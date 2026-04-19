import { stravaActivityDetailSchema } from '../schemas/strava-activity-detail.js';
import {
  stravaStreamsResponseSchema,
  parseStreams,
  type ParsedStreams,
} from '../schemas/strava-streams.js';
import {
  createActivityRequestSchema,
  createActivityResponseSchema,
  type CreateActivityRequest,
  type CreateActivityResponse,
} from '../schemas/strava-create-activity.js';
import {
  stravaUploadResponseSchema,
  stravaUploadStatusSchema,
  type StravaUploadResponse,
  type StravaUploadStatus,
} from '../schemas/strava-upload.js';
import type { StravaActivityDetail } from '../schemas/strava-activity-detail.js';

const STREAMS_KEYS = 'time,latlng,heartrate,altitude,distance,cadence,watts';

export async function fetchActivityDetail(
  id: number,
  accessToken: string,
): Promise<StravaActivityDetail> {
  const resp = await fetch(`https://www.strava.com/api/v3/activities/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (resp.status === 401) throw new Error('UNAUTHORIZED');
  if (resp.status === 404) throw new Error(`ACTIVITY_NOT_FOUND:${id}`);
  if (!resp.ok) throw new Error(`API_ERROR:${resp.status}`);
  const raw: unknown = await resp.json();
  const result = stravaActivityDetailSchema.safeParse(raw);
  if (!result.success) throw new Error('INVALID_ACTIVITY_RESPONSE');
  return result.data;
}

export async function fetchActivityStreams(
  id: number,
  accessToken: string,
): Promise<ParsedStreams> {
  const url = `https://www.strava.com/api/v3/activities/${id}/streams?keys=${STREAMS_KEYS}&key_type=time`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (resp.status === 401) throw new Error('UNAUTHORIZED');
  if (!resp.ok) throw new Error(`API_ERROR:${resp.status}`);
  const raw: unknown = await resp.json();
  const result = stravaStreamsResponseSchema.safeParse(raw);
  if (!result.success) throw new Error('INVALID_STREAMS_RESPONSE');
  return parseStreams(result.data);
}

export async function createActivity(
  data: CreateActivityRequest,
  accessToken: string,
): Promise<CreateActivityResponse> {
  const validated = createActivityRequestSchema.parse(data);
  const resp = await fetch('https://www.strava.com/api/v3/activities', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(validated),
  });
  if (resp.status === 401) throw new Error('UNAUTHORIZED');
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`CREATE_FAILED:${resp.status}:${text}`);
  }
  const raw: unknown = await resp.json();
  const result = createActivityResponseSchema.safeParse(raw);
  if (!result.success) throw new Error('INVALID_CREATE_RESPONSE');
  return result.data;
}

export async function deleteActivity(
  id: number,
  accessToken: string,
): Promise<void> {
  const resp = await fetch(`https://www.strava.com/api/v3/activities/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (resp.status === 401) throw new Error('UNAUTHORIZED');
  if (resp.status === 404) return; // already gone — treat as success
  if (!resp.ok) throw new Error(`DELETE_FAILED:${resp.status}`);
}

const UPLOAD_POLL_INTERVAL_MS = 3000;
const UPLOAD_POLL_TIMEOUT_MS = 120_000;

export async function uploadFitFile(
  buffer: Buffer,
  name: string,
  description: string,
  accessToken: string,
): Promise<StravaUploadResponse> {
  const blob = new Blob([new Uint8Array(buffer)], { type: 'application/octet-stream' });
  const form = new FormData();
  form.append('file', blob, 'merge.fit');
  form.append('data_type', 'fit');
  form.append('name', name);
  form.append('description', description);

  const resp = await fetch('https://www.strava.com/api/v3/uploads', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  if (resp.status === 401) throw new Error('UNAUTHORIZED');
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`UPLOAD_FAILED:${resp.status}:${text}`);
  }
  const raw: unknown = await resp.json();
  const result = stravaUploadResponseSchema.safeParse(raw);
  if (!result.success) throw new Error('INVALID_UPLOAD_RESPONSE');
  return result.data;
}

export async function pollUploadStatus(
  uploadId: number,
  accessToken: string,
): Promise<StravaUploadStatus> {
  const deadline = Date.now() + UPLOAD_POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const resp = await fetch(
      `https://www.strava.com/api/v3/uploads/${uploadId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (resp.status === 401) throw new Error('UNAUTHORIZED');
    if (!resp.ok) throw new Error(`POLL_FAILED:${resp.status}`);

    const raw: unknown = await resp.json();
    const result = stravaUploadStatusSchema.safeParse(raw);
    if (!result.success) throw new Error('INVALID_POLL_RESPONSE');

    if (result.data.error) {
      throw new Error(`UPLOAD_PROCESSING_ERROR:${result.data.error}`);
    }
    if (result.data.activity_id) {
      return result.data;
    }

    await new Promise((resolve) => setTimeout(resolve, UPLOAD_POLL_INTERVAL_MS));
  }

  throw new Error(`UPLOAD_TIMEOUT:${uploadId}`);
}

export async function updateActivity(
  id: number,
  data: { name?: string; description?: string },
  accessToken: string,
): Promise<void> {
  const resp = await fetch(`https://www.strava.com/api/v3/activities/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (resp.status === 401) throw new Error('UNAUTHORIZED');
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`UPDATE_FAILED:${resp.status}:${text}`);
  }
}

export type { StravaActivityDetail, ParsedStreams, CreateActivityResponse };
