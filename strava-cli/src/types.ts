export interface GlobalFlags {
  json: boolean;
  raw: boolean;
  tui: boolean;
  help: boolean;
  version: boolean;
}

export type OutputMode = 'interactive' | 'machine';

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  username: string;
}

export interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: StravaAthlete;
}

export interface StravaAuthConfig {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: {
    id: number;
    firstname: string;
    lastname: string;
    username: string;
  };
}

export interface StravaAppConfig {
  client_id: string;
  client_secret: string;
}

export type AthleteSex = 'male' | 'female';

export interface StravaProfile {
  age: number;
  sex: AthleteSex;
  weight: number;
  height: number;
}
