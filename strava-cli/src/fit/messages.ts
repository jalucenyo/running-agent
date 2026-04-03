import {
  BASE_TYPE,
  MESG_NUM,
  FILE_ID_FIELD,
  FILE_TYPE,
  MANUFACTURER,
  EVENT_FIELD,
  EVENT,
  EVENT_TYPE,
  RECORD_FIELD,
  LAP_FIELD,
  SESSION_FIELD,
  ACTIVITY_FIELD,
  ACTIVITY_TYPE,
  type FieldDef,
} from './types.js';
import type { FitEncoder } from './encoder.js';

// Local message type assignments (file-scoped constants)
const LOCAL_FILE_ID = 0;
const LOCAL_EVENT = 1;
const LOCAL_RECORD = 2;
const LOCAL_LAP = 3;
const LOCAL_SESSION = 4;
const LOCAL_ACTIVITY = 5;

export interface RecordPoint {
  timestamp: number; // FIT timestamp (seconds since FIT epoch)
  positionLat?: number | null; // degrees
  positionLong?: number | null; // degrees
  altitude?: number | null; // meters
  heartRate?: number | null; // bpm
  cadence?: number | null; // rpm / spm
  distance?: number | null; // meters
  power?: number | null; // watts
}

export interface FitActivityData {
  startTimeFit: number; // FIT timestamp for activity start
  endTimeFit: number; // FIT timestamp for activity end
  totalElapsedTime: number; // seconds
  totalTimerTime: number; // seconds
  totalDistance: number; // meters
  sport: number; // FIT sport enum
  subSport: number; // FIT sub_sport enum
  localTimestampFit: number; // FIT timestamp in local time
  records: RecordPoint[];
}

function degToSemi(degrees: number): number {
  return Math.round(degrees * (2147483648 / 180));
}

// ── Static field definition arrays ─────────────────────────────────────────

const FILE_ID_FIELDS: FieldDef[] = [
  { defNum: FILE_ID_FIELD.TYPE, size: 1, baseType: BASE_TYPE.ENUM },
  { defNum: FILE_ID_FIELD.MANUFACTURER, size: 2, baseType: BASE_TYPE.UINT16 },
  { defNum: FILE_ID_FIELD.PRODUCT, size: 2, baseType: BASE_TYPE.UINT16 },
  { defNum: FILE_ID_FIELD.TIME_CREATED, size: 4, baseType: BASE_TYPE.UINT32 },
];

const EVENT_FIELDS: FieldDef[] = [
  { defNum: EVENT_FIELD.TIMESTAMP, size: 4, baseType: BASE_TYPE.UINT32 },
  { defNum: EVENT_FIELD.EVENT, size: 1, baseType: BASE_TYPE.ENUM },
  { defNum: EVENT_FIELD.EVENT_TYPE, size: 1, baseType: BASE_TYPE.ENUM },
];

const LAP_FIELDS: FieldDef[] = [
  { defNum: LAP_FIELD.TIMESTAMP, size: 4, baseType: BASE_TYPE.UINT32 },
  { defNum: LAP_FIELD.EVENT, size: 1, baseType: BASE_TYPE.ENUM },
  { defNum: LAP_FIELD.EVENT_TYPE, size: 1, baseType: BASE_TYPE.ENUM },
  { defNum: LAP_FIELD.START_TIME, size: 4, baseType: BASE_TYPE.UINT32 },
  {
    defNum: LAP_FIELD.TOTAL_ELAPSED_TIME,
    size: 4,
    baseType: BASE_TYPE.UINT32,
  },
  { defNum: LAP_FIELD.TOTAL_TIMER_TIME, size: 4, baseType: BASE_TYPE.UINT32 },
  { defNum: LAP_FIELD.SPORT, size: 1, baseType: BASE_TYPE.ENUM },
  { defNum: LAP_FIELD.SUB_SPORT, size: 1, baseType: BASE_TYPE.ENUM },
  { defNum: LAP_FIELD.MESSAGE_INDEX, size: 2, baseType: BASE_TYPE.UINT16 },
];

const SESSION_FIELDS: FieldDef[] = [
  { defNum: SESSION_FIELD.TIMESTAMP, size: 4, baseType: BASE_TYPE.UINT32 },
  { defNum: SESSION_FIELD.EVENT, size: 1, baseType: BASE_TYPE.ENUM },
  { defNum: SESSION_FIELD.EVENT_TYPE, size: 1, baseType: BASE_TYPE.ENUM },
  { defNum: SESSION_FIELD.START_TIME, size: 4, baseType: BASE_TYPE.UINT32 },
  { defNum: SESSION_FIELD.SPORT, size: 1, baseType: BASE_TYPE.ENUM },
  { defNum: SESSION_FIELD.SUB_SPORT, size: 1, baseType: BASE_TYPE.ENUM },
  {
    defNum: SESSION_FIELD.TOTAL_ELAPSED_TIME,
    size: 4,
    baseType: BASE_TYPE.UINT32,
  },
  {
    defNum: SESSION_FIELD.TOTAL_TIMER_TIME,
    size: 4,
    baseType: BASE_TYPE.UINT32,
  },
  {
    defNum: SESSION_FIELD.TOTAL_DISTANCE,
    size: 4,
    baseType: BASE_TYPE.UINT32,
  },
  {
    defNum: SESSION_FIELD.FIRST_LAP_INDEX,
    size: 2,
    baseType: BASE_TYPE.UINT16,
  },
  { defNum: SESSION_FIELD.NUM_LAPS, size: 2, baseType: BASE_TYPE.UINT16 },
  { defNum: SESSION_FIELD.TRIGGER, size: 1, baseType: BASE_TYPE.ENUM },
  { defNum: SESSION_FIELD.MESSAGE_INDEX, size: 2, baseType: BASE_TYPE.UINT16 },
];

const ACTIVITY_FIELDS: FieldDef[] = [
  { defNum: ACTIVITY_FIELD.TIMESTAMP, size: 4, baseType: BASE_TYPE.UINT32 },
  {
    defNum: ACTIVITY_FIELD.TOTAL_TIMER_TIME,
    size: 4,
    baseType: BASE_TYPE.UINT32,
  },
  { defNum: ACTIVITY_FIELD.NUM_SESSIONS, size: 2, baseType: BASE_TYPE.UINT16 },
  { defNum: ACTIVITY_FIELD.TYPE, size: 1, baseType: BASE_TYPE.ENUM },
  { defNum: ACTIVITY_FIELD.EVENT, size: 1, baseType: BASE_TYPE.ENUM },
  { defNum: ACTIVITY_FIELD.EVENT_TYPE, size: 1, baseType: BASE_TYPE.ENUM },
  {
    defNum: ACTIVITY_FIELD.LOCAL_TIMESTAMP,
    size: 4,
    baseType: BASE_TYPE.UINT32,
  },
];

// ── Message writers ─────────────────────────────────────────────────────────

function writeFileId(encoder: FitEncoder, timeCreated: number): void {
  encoder.writeDefinition(LOCAL_FILE_ID, MESG_NUM.FILE_ID, FILE_ID_FIELDS);
  encoder.writeData(LOCAL_FILE_ID, [
    FILE_TYPE.ACTIVITY,
    MANUFACTURER.DEVELOPMENT,
    0, // product
    timeCreated,
  ]);
}

function writeEventDefinition(encoder: FitEncoder): void {
  encoder.writeDefinition(LOCAL_EVENT, MESG_NUM.EVENT, EVENT_FIELDS);
}

function writeTimerStart(encoder: FitEncoder, timestamp: number): void {
  encoder.writeData(LOCAL_EVENT, [timestamp, EVENT.TIMER, EVENT_TYPE.START]);
}

function writeTimerStop(encoder: FitEncoder, timestamp: number): void {
  encoder.writeData(LOCAL_EVENT, [timestamp, EVENT.TIMER, EVENT_TYPE.STOP_ALL]);
}

function buildRecordFields(opts: {
  hasGps: boolean;
  hasHr: boolean;
  hasAlt: boolean;
  hasDist: boolean;
  hasCad: boolean;
  hasPower: boolean;
}): FieldDef[] {
  const fields: FieldDef[] = [
    { defNum: RECORD_FIELD.TIMESTAMP, size: 4, baseType: BASE_TYPE.UINT32 },
  ];
  if (opts.hasGps) {
    fields.push({
      defNum: RECORD_FIELD.POSITION_LAT,
      size: 4,
      baseType: BASE_TYPE.SINT32,
    });
    fields.push({
      defNum: RECORD_FIELD.POSITION_LONG,
      size: 4,
      baseType: BASE_TYPE.SINT32,
    });
  }
  if (opts.hasHr)
    fields.push({ defNum: RECORD_FIELD.HEART_RATE, size: 1, baseType: BASE_TYPE.UINT8 });
  if (opts.hasAlt)
    fields.push({ defNum: RECORD_FIELD.ALTITUDE, size: 2, baseType: BASE_TYPE.UINT16 });
  if (opts.hasDist)
    fields.push({ defNum: RECORD_FIELD.DISTANCE, size: 4, baseType: BASE_TYPE.UINT32 });
  if (opts.hasCad)
    fields.push({ defNum: RECORD_FIELD.CADENCE, size: 1, baseType: BASE_TYPE.UINT8 });
  if (opts.hasPower)
    fields.push({ defNum: RECORD_FIELD.POWER, size: 2, baseType: BASE_TYPE.UINT16 });
  return fields;
}

function writeRecords(encoder: FitEncoder, records: RecordPoint[]): void {
  if (records.length === 0) return;

  const hasGps = records.some(
    (r) => r.positionLat != null && r.positionLong != null,
  );
  const hasHr = records.some((r) => r.heartRate != null);
  const hasAlt = records.some((r) => r.altitude != null);
  const hasDist = records.some((r) => r.distance != null);
  const hasCad = records.some((r) => r.cadence != null);
  const hasPower = records.some((r) => r.power != null);

  const fields = buildRecordFields({
    hasGps,
    hasHr,
    hasAlt,
    hasDist,
    hasCad,
    hasPower,
  });
  encoder.writeDefinition(LOCAL_RECORD, MESG_NUM.RECORD, fields);

  for (const rec of records) {
    const values: (number | null)[] = [rec.timestamp];

    if (hasGps) {
      values.push(
        rec.positionLat != null ? degToSemi(rec.positionLat) : null,
      );
      values.push(
        rec.positionLong != null ? degToSemi(rec.positionLong) : null,
      );
    }
    if (hasHr) values.push(rec.heartRate ?? null);
    if (hasAlt) {
      values.push(
        rec.altitude != null ? Math.round((rec.altitude + 500) * 5) : null,
      );
    }
    if (hasDist) {
      values.push(
        rec.distance != null ? Math.round(rec.distance * 100) : null,
      );
    }
    if (hasCad) values.push(rec.cadence ?? null);
    if (hasPower) values.push(rec.power ?? null);

    encoder.writeData(LOCAL_RECORD, values);
  }
}

function writeLap(
  encoder: FitEncoder,
  data: Pick<
    FitActivityData,
    | 'startTimeFit'
    | 'endTimeFit'
    | 'totalElapsedTime'
    | 'totalTimerTime'
    | 'sport'
    | 'subSport'
  >,
): void {
  encoder.writeDefinition(LOCAL_LAP, MESG_NUM.LAP, LAP_FIELDS);
  encoder.writeData(LOCAL_LAP, [
    data.endTimeFit,
    EVENT.LAP,
    EVENT_TYPE.STOP_ALL,
    data.startTimeFit,
    Math.round(data.totalElapsedTime * 1000),
    Math.round(data.totalTimerTime * 1000),
    data.sport,
    data.subSport,
    0, // message_index
  ]);
}

function writeSession(encoder: FitEncoder, data: FitActivityData): void {
  encoder.writeDefinition(LOCAL_SESSION, MESG_NUM.SESSION, SESSION_FIELDS);
  encoder.writeData(LOCAL_SESSION, [
    data.endTimeFit,
    EVENT.SESSION,
    EVENT_TYPE.STOP_ALL,
    data.startTimeFit,
    data.sport,
    data.subSport,
    Math.round(data.totalElapsedTime * 1000),
    Math.round(data.totalTimerTime * 1000),
    Math.round(data.totalDistance * 100),
    0, // first_lap_index
    1, // num_laps
    0, // trigger: activity_end
    0, // message_index
  ]);
}

function writeActivity(encoder: FitEncoder, data: FitActivityData): void {
  encoder.writeDefinition(LOCAL_ACTIVITY, MESG_NUM.ACTIVITY, ACTIVITY_FIELDS);
  encoder.writeData(LOCAL_ACTIVITY, [
    data.endTimeFit,
    Math.round(data.totalTimerTime * 1000),
    1, // num_sessions
    ACTIVITY_TYPE.MANUAL,
    EVENT.ACTIVITY,
    EVENT_TYPE.STOP,
    data.localTimestampFit,
  ]);
}

// ── Public API ──────────────────────────────────────────────────────────────

export function writeFitActivity(
  encoder: FitEncoder,
  data: FitActivityData,
): void {
  writeFileId(encoder, data.startTimeFit);
  writeEventDefinition(encoder);
  writeTimerStart(encoder, data.startTimeFit);
  writeRecords(encoder, data.records);
  writeTimerStop(encoder, data.endTimeFit);
  writeLap(encoder, data);
  writeSession(encoder, data);
  writeActivity(encoder, data);
}
