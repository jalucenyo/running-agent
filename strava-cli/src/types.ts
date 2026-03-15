export interface GlobalFlags {
  json: boolean;
  raw: boolean;
  tui: boolean;
  help: boolean;
  version: boolean;
}

export type OutputMode = 'interactive' | 'machine';
