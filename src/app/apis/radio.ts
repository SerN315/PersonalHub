import { api } from "./http";

export interface Station {
  id: string; // the directory's id; the stream address itself is only ever opened by the server (for song titles) or the audio element
  name: string;
  url: string;
  country: string;
  countryCode: string;
  tags: string[];
  codec: string;
  bitrate: number;
  votes: number;
}

export interface StationQuery {
  q?: string;
  tag?: string;
  country?: string;
}

// Search the station directory through our own server. With no search it returns what people listen to most.
export async function searchStations(query: StationQuery, signal?: AbortSignal): Promise<Station[]> {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.tag) params.set("tag", query.tag);
  if (query.country) params.set("country", query.country);
  params.set("limit", "40");
  const data = await api<{ stations: Station[] }>(`/api/radio/stations?${params}`, { signal });
  return data.stations;
}

export interface YouTubeName {
  title: string | null;
  author: string | null;
}

// The title and channel of a YouTube video or playlist (nulls when it is private, removed, or YouTube did not answer).
export const getYouTubeName = (kind: "video" | "playlist", id: string, signal?: AbortSignal) => api<YouTubeName>(`/api/radio/youtube?kind=${kind}&id=${encodeURIComponent(id)}`, { signal });

// The names of up to 25 songs at once, by video id.
export async function getVideoNames(ids: string[], signal?: AbortSignal): Promise<Record<string, YouTubeName | null>> {
  const data = await api<{ videos: Record<string, YouTubeName | null> }>(`/api/radio/youtube/videos?ids=${ids.map(encodeURIComponent).join(",")}`, { signal });
  return data.videos;
}

// The title the station is playing right now (null when the station does not announce one).
export async function getNowPlaying(stationId: string, signal?: AbortSignal): Promise<string | null> {
  const data = await api<{ title: string | null }>(`/api/radio/now-playing?station=${encodeURIComponent(stationId)}`, { signal });
  return data.title;
}
