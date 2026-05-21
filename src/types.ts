export type GameType = 'shape-match' | 'bubble-pop' | 'feed-puppy' | 'trace-path';

export interface Game {
  id: GameType;
  title: string;
  icon: string;
  bgColor: string;
  borderColor: string;
  description: string;
  skills: string[];
}

export interface PlaySession {
  gameId: GameType;
  timestamp: string;
  durationMs: number;
  completed: boolean;
  score?: number;
}

export interface ParentSettings {
  voiceEnabled: boolean;
  musicEnabled: boolean;
  voiceSpeed: number; // 0.8 to 1.5
  completedGatesCount: number;
}

export interface AppStats {
  sessions: PlaySession[];
  settings: ParentSettings;
}
