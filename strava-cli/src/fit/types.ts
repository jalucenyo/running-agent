// FIT Protocol epoch: Dec 31, 1989 00:00:00 UTC
export const FIT_EPOCH_S = 631065600;

export const PROTOCOL_VERSION = 0x20; // FIT Protocol v2.0
export const PROFILE_VERSION = 2132;

// Base type byte values (from FIT protocol spec Table 7)
export const BASE_TYPE = {
  ENUM: 0x00,
  SINT8: 0x01,
  UINT8: 0x02,
  SINT16: 0x83,
  UINT16: 0x84,
  SINT32: 0x85,
  UINT32: 0x86,
  UINT8Z: 0x0a,
  UINT16Z: 0x8b,
  UINT32Z: 0x8c,
} as const;

// Global message numbers (mesg_num)
export const MESG_NUM = {
  FILE_ID: 0,
  SESSION: 18,
  LAP: 19,
  RECORD: 20,
  EVENT: 21,
  ACTIVITY: 34,
} as const;

// file_id message field definition numbers
export const FILE_ID_FIELD = {
  TYPE: 0,
  MANUFACTURER: 1,
  PRODUCT: 2,
  TIME_CREATED: 4,
} as const;

// event message field definition numbers
export const EVENT_FIELD = {
  EVENT: 0,
  EVENT_TYPE: 1,
  TIMESTAMP: 253,
} as const;

// record message field definition numbers
export const RECORD_FIELD = {
  POSITION_LAT: 0,
  POSITION_LONG: 1,
  ALTITUDE: 2,
  HEART_RATE: 3,
  CADENCE: 4,
  DISTANCE: 5,
  POWER: 7,
  TIMESTAMP: 253,
} as const;

// lap message field definition numbers
export const LAP_FIELD = {
  EVENT: 0,
  EVENT_TYPE: 1,
  START_TIME: 2,
  TOTAL_ELAPSED_TIME: 7,
  TOTAL_TIMER_TIME: 8,
  SPORT: 25,
  SUB_SPORT: 39,
  MESSAGE_INDEX: 254,
  TIMESTAMP: 253,
} as const;

// session message field definition numbers
export const SESSION_FIELD = {
  EVENT: 0,
  EVENT_TYPE: 1,
  START_TIME: 2,
  SPORT: 5,
  SUB_SPORT: 6,
  TOTAL_ELAPSED_TIME: 7,
  TOTAL_TIMER_TIME: 8,
  TOTAL_DISTANCE: 9,
  FIRST_LAP_INDEX: 25,
  NUM_LAPS: 26,
  TRIGGER: 28,
  MESSAGE_INDEX: 254,
  TIMESTAMP: 253,
} as const;

// activity message field definition numbers
export const ACTIVITY_FIELD = {
  TOTAL_TIMER_TIME: 0,
  NUM_SESSIONS: 1,
  TYPE: 2,
  EVENT: 3,
  EVENT_TYPE: 4,
  LOCAL_TIMESTAMP: 5,
  TIMESTAMP: 253,
} as const;

// FIT enum values
export const FILE_TYPE = { ACTIVITY: 4 } as const;
export const MANUFACTURER = { DEVELOPMENT: 255 } as const;

export const EVENT = {
  TIMER: 0,
  LAP: 9,
  SESSION: 14,
  ACTIVITY: 26,
} as const;

export const EVENT_TYPE = {
  START: 0,
  STOP: 1,
  STOP_ALL: 4,
} as const;

export const ACTIVITY_TYPE = { MANUAL: 0 } as const;

export const SPORT = {
  GENERIC: 0,
  RUNNING: 1,
  CYCLING: 2,
  WALKING: 11,
  HIKING: 17,
} as const;

export const SUB_SPORT = {
  GENERIC: 0,
  TREADMILL: 1,
  STREET: 2,
  TRAIL: 3,
  ROAD: 7,
  MOUNTAIN: 8,
  INDOOR_CYCLING: 6,
  CASUAL_WALKING: 30,
  VIRTUAL_ACTIVITY: 58,
} as const;

export interface FieldDef {
  defNum: number;
  size: number;
  baseType: number;
}
