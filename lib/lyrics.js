import { env } from "@/lib/env";

function normalizeLines(value) {
  if (!value) return "";
  return String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

async function fetchFromLrcLib({ title, artist, album, durationMs }) {
  const params = new URLSearchParams({
    track_name: title,
    artist_name: artist,
  });

  if (album) {
    params.set("album_name", album);
  }

  if (durationMs) {
    params.set("duration", String(Math.round(durationMs / 1000)));
  }

  const response = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
    headers: {
      "User-Agent": "lyrics-companion/1.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const plainText = normalizeLines(payload.plainLyrics || payload.syncedLyrics);
  if (!plainText) {
    return null;
  }

  return {
    provider: "LRCLIB",
    plainText,
  };
}

async function fetchFromLyricsOvh({ title, artist }) {
  const response = await fetch(
    `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const plainText = normalizeLines(payload.lyrics);
  if (!plainText) {
    return null;
  }

  return {
    provider: "lyrics.ovh",
    plainText,
  };
}

export async function fetchLyrics(track) {
  const provider = env.lyricsProvider.toLowerCase();

  if (provider === "lyricsovh") {
    return fetchFromLyricsOvh(track);
  }

  const primary = await fetchFromLrcLib(track);
  if (primary) {
    return primary;
  }

  return fetchFromLyricsOvh(track);
}
