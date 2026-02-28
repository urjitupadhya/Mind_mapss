import * as vscode from 'vscode';
import { TelemetryCollector } from './telemetry';
import { MetricsAggregator, WeightedScore } from './aggregator';
import { SessionManager } from './session';

let telemetryCollector: TelemetryCollector;
let metricsAggregator: MetricsAggregator;
let sessionManager: SessionManager;
let syncTimer: NodeJS.Timeout | null = null;
let statusBarItem: vscode.StatusBarItem;
let lastContentHash: string = '';
let idleTimer: NodeJS.Timeout | null = null;
let isIdle: boolean = false;

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const DEBOUNCE_MS = 100;

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('mindlint');
  const isEnabled = config.get('trackTyping', true);

  if (!isEnabled) {
    vscode.window.showInformationMessage('MindLint tracking is disabled');
    return;
  }

  metricsAggregator = new MetricsAggregator();
  sessionManager = new SessionManager();
  telemetryCollector = new TelemetryCollector(context);

  const userPrefs = config.get('userPreferences') as { codingStartHour?: number; codingEndHour?: number; sleepStartHour?: number; sleepEndHour?: number } | undefined;
  if (userPrefs) {
    metricsAggregator.setUserPreferences(userPrefs);
  }

  sessionManager.startSession();

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'mindlint.showDashboard';
  context.subscriptions.push(statusBarItem);
  updateStatusBar();

  setupIdleDetection();

  context.subscriptions.push(
    vscode.commands.registerCommand('mindlint.showDashboard', async () => {
      const backendUrl = config.get('backendUrl', 'http://localhost:3001');
      vscode.env.openExternal(vscode.Uri.parse(`${backendUrl.replace(':3001', ':5173')}`));
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mindlint.enableTracking', () => {
      telemetryCollector.enable();
      vscode.window.showInformationMessage('MindLint tracking enabled');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mindlint.disableTracking', () => {
      telemetryCollector.disable();
      vscode.window.showInformationMessage('MindLint tracking disabled');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mindlint.setLocalMode', async () => {
      const config = vscode.workspace.getConfiguration('mindlint');
      await config.update('localMode', true, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage('MindLint: Local-only mode enabled. No data will be sent to backend.');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mindlint.syncNow', async () => {
      const config = vscode.workspace.getConfiguration('mindlint');
      await syncToBackend(config.get('backendUrl', 'http://localhost:3001'));
      vscode.window.showInformationMessage('MindLint: Synced successfully');
    })
  );

  setupTelemetryListeners();

  const syncInterval = 60000;
  syncTimer = setInterval(() => {
    const config = vscode.workspace.getConfiguration('mindlint');
    const localMode = config.get('localMode', false);
    if (!localMode) {
      syncToBackend(config.get('backendUrl', 'http://localhost:3001'));
    }
    updateStatusBar();
  }, syncInterval);

  const scoreUpdateInterval = 5000;
  setInterval(() => {
    updateStatusBar();
  }, scoreUpdateInterval);

  context.subscriptions.push({
    dispose: () => {
      if (syncTimer) clearInterval(syncTimer);
      if (idleTimer) clearTimeout(idleTimer);
      if (statusBarItem) statusBarItem.dispose();
      sessionManager.endSession();
      telemetryCollector.flush();
    }
  });

  vscode.window.showInformationMessage('MindLint: Cognitive tracking started');
}

function setupIdleDetection() {
  vscode.window.onDidChangeWindowState((windowState) => {
    if (windowState.focused) {
      if (isIdle) {
        isIdle = false;
        resetIdleTimer();
      }
    }
  });

  resetIdleTimer();
}

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    isIdle = true;
  }, IDLE_TIMEOUT_MS);
}

function updateStatusBar() {
  if (!metricsAggregator || !statusBarItem) return;

  const score = metricsAggregator.calculateWeightedScore();
  const emoji = getStrainEmoji(score.strainLevel);
  const color = getStrainColor(score.strainLevel);

  statusBarItem.text = `${emoji} ${score.cognitiveScore}%`;
  statusBarItem.color = color;
  statusBarItem.tooltip = `Burnout Risk: ${score.burnoutProbability}%\nFlow State: ${score.flowState}%\nClick to open dashboard`;
  statusBarItem.show();
}

function getStrainEmoji(strain: string): string {
  switch (strain) {
    case 'low': return '🟢';
    case 'moderate': return '🟡';
    case 'high': return '🟠';
    case 'critical': return '🔴';
    default: return '⚪';
  }
}

function getStrainColor(strain: string): string {
  switch (strain) {
    case 'low': return '#22c55e';
    case 'moderate': return '#eab308';
    case 'high': return '#f97316';
    case 'critical': return '#ef4444';
    default: return '#9ca3af';
  }
}

function setupTelemetryListeners() {
  let keystrokeTimeout: NodeJS.Timeout | null = null;

  vscode.workspace.onDidChangeTextDocument((event) => {
    if (!telemetryCollector.isEnabled() || isIdle) return;
    
    resetIdleTimer();

    const document = event.document;
    const changes = event.contentChanges;
    
    for (const change of changes) {
      if (keystrokeTimeout) clearTimeout(keystrokeTimeout);
      
      keystrokeTimeout = setTimeout(() => {
        telemetryCollector.trackKeystroke({
          timestamp: Date.now(),
          documentUri: document.uri.toString(),
          changeLength: change.text.length,
          rangeLength: change.rangeLength,
          line: change.range.start.line
        });

        metricsAggregator.addKeystroke(Date.now());

        if (change.text.length === 0 && change.rangeLength > 0) {
          metricsAggregator.addUndoSpike();
        }
      }, DEBOUNCE_MS);
    }
  });

  vscode.languages.onDidChangeDiagnostics((event) => {
    if (!telemetryCollector.isEnabled()) return;
    
    for (const [uri, diagnostics] of event.uris) {
      const errorCount = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error).length;
      if (errorCount > 0) {
        for (let i = 0; i < errorCount; i++) {
          metricsAggregator.addError();
        }
      }
      telemetryCollector.trackDiagnostics({
        timestamp: Date.now(),
        documentUri: uri.toString(),
        errorCount,
        warningCount: diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Warning).length
      });
    }
  });

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (!telemetryCollector.isEnabled() || !editor || isIdle) return;
    
    telemetryCollector.trackFileSwitch({
      timestamp: Date.now(),
      documentUri: editor.document.uri.toString(),
      language: editor.document.languageId
    });
    metricsAggregator.addFileSwitch();
  });

  vscode.workspace.onDidSaveTextDocument((document) => {
    if (!telemetryCollector.isEnabled()) return;
    
    const currentContent = document.getText();
    const currentHash = hashString(currentContent);
    const hasDiff = currentHash !== lastContentHash;
    
    metricsAggregator.addSaveWithoutDiff(!hasDiff);
    lastContentHash = currentHash;
    
    telemetryCollector.trackSave({
      timestamp: Date.now(),
      documentUri: document.uri.toString(),
      lineCount: document.lineCount
    });
  });
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

async function syncToBackend(backendUrl: string) {
  try {
    const config = vscode.workspace.getConfiguration('mindlint');
    const localMode = config.get('localMode', false);
    
    if (localMode) {
      console.log('MindLint: Local mode enabled, skipping sync');
      return;
    }

    const metrics = metricsAggregator.getAggregates();
    const session = sessionManager.getCurrentSession();
    const weightedScore = metricsAggregator.calculateWeightedScore();
    
    if (!session || metrics.totalEvents === 0) return;

    const payload = {
      sessionId: session.id,
      userId: telemetryCollector.getUserId(),
      timestamp: Date.now(),
      metrics,
      aggregates: {
        avg_stability: metricsAggregator.calculateStability(),
        error_rate: metricsAggregator.calculateErrorRate(),
        complexity_index: metricsAggregator.calculateComplexity(),
        typing_cadence_variance: metricsAggregator.calculateTypingVariance(),
        undo_spikes: metricsAggregator.getUndoSpikes(),
        file_switches: metricsAggregator.getFileSwitches(),
        session_duration: session.duration,
        cognitive_score: weightedScore.cognitiveScore,
        burnout_probability: weightedScore.burnoutProbability,
        flow_state: weightedScore.flowState,
        ema_cognitive_score: metricsAggregator.getEMACognitiveScore(),
        ema_stability: metricsAggregator.getEMAStability()
      },
      weighted_breakdown: weightedScore.breakdown,
      normalized_metrics: metricsAggregator.getNormalizedMetrics()
    };

    const response = await fetch(`${backendUrl}/api/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      metricsAggregator.reset();
      lastContentHash = '';
    }
  } catch (error) {
    console.error('MindLint sync failed:', error);
  }
}

export function deactivate() {
  if (telemetryCollector) {
    telemetryCollector.flush();
  }
  if (sessionManager) {
    sessionManager.endSession();
  }
}
