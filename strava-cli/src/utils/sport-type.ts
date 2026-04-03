import { SPORT, SUB_SPORT } from '../fit/types.js';

export interface SportMapping {
  sport: number;
  subSport: number;
}

const SPORT_MAP: Record<string, SportMapping> = {
  Run: { sport: SPORT.RUNNING, subSport: SUB_SPORT.STREET },
  TrailRun: { sport: SPORT.RUNNING, subSport: SUB_SPORT.TRAIL },
  Ride: { sport: SPORT.CYCLING, subSport: SUB_SPORT.ROAD },
  MountainBikeRide: { sport: SPORT.CYCLING, subSport: SUB_SPORT.MOUNTAIN },
  GravelRide: { sport: SPORT.CYCLING, subSport: SUB_SPORT.ROAD },
  EBikeRide: { sport: SPORT.CYCLING, subSport: SUB_SPORT.ROAD },
  VirtualRide: {
    sport: SPORT.CYCLING,
    subSport: SUB_SPORT.VIRTUAL_ACTIVITY,
  },
  Walk: { sport: SPORT.WALKING, subSport: SUB_SPORT.CASUAL_WALKING },
  Hike: { sport: SPORT.HIKING, subSport: SUB_SPORT.GENERIC },
  VirtualRun: {
    sport: SPORT.RUNNING,
    subSport: SUB_SPORT.VIRTUAL_ACTIVITY,
  },
  Treadmill: { sport: SPORT.RUNNING, subSport: SUB_SPORT.TREADMILL },
};

export function mapSportType(stravaType: string): SportMapping {
  return SPORT_MAP[stravaType] ?? { sport: SPORT.GENERIC, subSport: SUB_SPORT.GENERIC };
}
