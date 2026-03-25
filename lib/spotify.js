import { env } from "@/lib/env";

export async function refreshAccessToken(refreshToken) {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${env.spotifyClientId}:${env.spotifyClientSecret}`,
      ).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || refreshToken,
    expiresAt: Date.now() + payload.expires_in * 1000,
  };
}

function mapPlaybackItem(payload) {
  const item = payload?.item;

  if (!item) {
    return null;
  }

  return {
    id: item.id,
    title: item.name,
    artist: item.artists?.map((artist) => artist.name).join(", ") || "Artista desconocido",
    album: item.album?.name || "",
    albumArt: item.album?.images?.[0]?.url || null,
    durationMs: item.duration_ms || null,
    progressMs: payload?.progress_ms || 0,
    isPlaying: Boolean(payload?.is_playing),
    deviceName: payload?.device?.name || "",
    deviceType: payload?.device?.type || "",
  };
}

async function fetchSpotifyPlayback(accessToken, endpoint) {
  const response = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Spotify playback request failed for ${endpoint}: ${response.status} ${body}`);
  }

  return mapPlaybackItem(await response.json());
}

export async function getCurrentPlayback(accessToken) {
  const current = await fetchSpotifyPlayback(accessToken, "me/player/currently-playing");
  if (current) {
    return current;
  }

  return fetchSpotifyPlayback(accessToken, "me/player");
}
