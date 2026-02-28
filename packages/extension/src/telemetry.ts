import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface KeystrokeData {
  timestamp: number;
  documentUri: string;
  changeLength: number;
  rangeLength: number;
  line: number;
}

interface DiagnosticData {
  timestamp: number;
  documentUri: string;
  errorCount: number;
  warningCount: number;
}

interface FileSwitchData {
  timestamp: number;
  documentUri: string;
  language: string;
}

interface SaveData {
  timestamp: number;
  documentUri: string;
  lineCount: number;
}

export class TelemetryCollector {
  private context: vscode.ExtensionContext;
  private enabled: boolean = true;
  private userId: string;
  private keystrokes: KeystrokeData[] = [];
  private diagnostics: DiagnosticData[] = [];
  private fileSwitches: FileSwitchData[] = [];
  private saves: SaveData[] = [];
  private undoStack: number[] = [];
  private lastKeystrokeTime: number = 0;
  private rapidUndoCount: number = 0;
  private dbPath: string;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.dbPath = path.join(context.globalStorageUri.fsPath, 'mindlint.db');
    this.userId = this.getOrCreateUserId();
    this.ensureStorageDir();
  }

  private ensureStorageDir(): void {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private getOrCreateUserId(): string {
    const config = vscode.workspace.getConfiguration('mindlint');
    let userId = config.get('userId') as string;
    
    if (!userId) {
      userId = uuidv4();
      config.update('userId', userId, vscode.ConfigurationTarget.Global);
    }
    
    return userId;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getUserId(): string {
    return this.userId;
  }

  trackKeystroke(data: KeystrokeData): void {
    if (!this.enabled) return;
    
    // Detect rapid undo sequences
    if (data.changeLength === 0 && data.rangeLength > 0) {
      const now = Date.now();
      if (now - this.lastKeystrokeTime < 500) {
        this.rapidUndoCount++;
      }
      this.undoStack.push(now);
      this.lastKeystrokeTime = now;
    }

    this.keystrokes.push(data);
    
    // Keep only last 1000 keystrokes in memory
    if (this.keystrokes.length > 1000) {
      this.keystrokes = this.keystrokes.slice(-500);
    }
  }

  trackDiagnostics(data: DiagnosticData): void {
    if (!this.enabled) return;
    this.diagnostics.push(data);
    
    // Keep only last 100 diagnostic events
    if (this.diagnostics.length > 100) {
      this.diagnostics = this.diagnostics.slice(-50);
    }
  }

  trackFileSwitch(data: FileSwitchData): void {
    if (!this.enabled) return;
    this.fileSwitches.push(data);
    
    // Keep only last 50 file switches
    if (this.fileSwitches.length > 50) {
      this.fileSwitches = this.fileSwitches.slice(-25);
    }
  }

  trackSave(data: SaveData): void {
    if (!this.enabled) return;
    this.saves.push(data);
  }

  getUndoSpikes(): number {
    const now = Date.now();
    const recentUndos = this.undoStack.filter(t => now - t < 60000);
    return recentUndos.length;
  }

  getData(): {
    keystrokes: KeystrokeData[];
    diagnostics: DiagnosticData[];
    fileSwitches: FileSwitchData[];
    saves: SaveData[];
    undoCount: number;
  } {
    return {
      keystrokes: this.keystrokes,
      diagnostics: this.diagnostics,
      fileSwitches: this.fileSwitches,
      saves: this.saves,
      undoCount: this.rapidUndoCount
    };
  }

  flush(): void {
    // Write to local storage (privacy: only aggregated metrics, no raw code)
    const data = {
      timestamp: Date.now(),
      userId: this.userId,
      keystrokeCount: this.keystrokes.length,
      diagnosticCount: this.diagnostics.length,
      fileSwitchCount: this.fileSwitches.length,
      saveCount: this.saves.length,
      undoCount: this.rapidUndoCount
    };

    const logPath = path.join(path.dirname(this.dbPath), 'telemetry.log');
    fs.appendFileSync(logPath, JSON.stringify(data) + '\n');

    // Clear in-memory data
    this.keystrokes = [];
    this.diagnostics = [];
    this.fileSwitches = [];
    this.saves = [];
    this.undoStack = [];
    this.rapidUndoCount = 0;
  }
}
