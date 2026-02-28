import { v4 as uuidv4 } from 'uuid';

interface Session {
  id: string;
  startTime: number;
  endTime: number | null;
  duration: number;
  projectPaths: string[];
  language: string | null;
}

export class SessionManager {
  private currentSession: Session | null = null;
  private sessionHistory: Session[] = [];

  startSession(projectPath?: string): Session {
    // End previous session if exists
    if (this.currentSession) {
      this.endSession();
    }

    this.currentSession = {
      id: uuidv4(),
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      projectPaths: projectPath ? [projectPath] : [],
      language: null
    };

    return this.currentSession;
  }

  endSession(): Session | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = Date.now();
    this.currentSession.duration = Math.floor(
      (this.currentSession.endTime - this.currentSession.startTime) / 1000
    );

    // Only keep sessions longer than 1 minute
    if (this.currentSession.duration >= 60) {
      this.sessionHistory.push({ ...this.currentSession });
    }

    const ended = { ...this.currentSession };
    this.currentSession = null;

    return ended;
  }

  getCurrentSession(): Session | null {
    if (!this.currentSession) return null;
    
    // Update duration to current time
    return {
      ...this.currentSession,
      duration: Math.floor((Date.now() - this.currentSession.startTime) / 1000)
    };
  }

  getSessionHistory(): Session[] {
    return [...this.sessionHistory];
  }

  setProjectPath(path: string): void {
    if (this.currentSession && !this.currentSession.projectPaths.includes(path)) {
      this.currentSession.projectPaths.push(path);
    }
  }

  setLanguage(language: string): void {
    if (this.currentSession) {
      this.currentSession.language = language;
    }
  }

  isActive(): boolean {
    return this.currentSession !== null;
  }

  getSessionDuration(): number {
    if (!this.currentSession) return 0;
    return Math.floor((Date.now() - this.currentSession.startTime) / 1000);
  }
}
