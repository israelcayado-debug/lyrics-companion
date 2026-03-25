import { NextResponse } from "next/server";

import { ensureSession } from "@/lib/session";
import { fetchLyrics } from "@/lib/lyrics";
import { getCurrentPlayback } from "@/lib/spotify";

export async function GET() {
  const sessionState = await ensureSession();

  if (!sessionState) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  let playback = null;

  try {
    playback = await getCurrentPlayback(sessionState.accessToken);
  } catch (error) {
    const response = NextResponse.json(
      { error: error.message || "spotify_playback_failed" },
      { status: 502 },
    );
    if (sessionState.updatedCookie) {
      response.cookies.set("lyrics_session", sessionState.updatedCookie.value, sessionState.updatedCookie.options);
    }
    return response;
  }

  if (!playback) {
    const response = NextResponse.json({ item: null, lyrics: null, provider: null });
    if (sessionState.updatedCookie) {
      response.cookies.set("lyrics_session", sessionState.updatedCookie.value, sessionState.updatedCookie.options);
    }
    return response;
  }

  const lyrics = await fetchLyrics({
    title: playback.title,
    artist: playback.artist,
    album: playback.album,
    durationMs: playback.durationMs,
  });

  const response = NextResponse.json({
    item: playback,
    lyrics: lyrics ? { plainText: lyrics.plainText } : null,
    provider: lyrics?.provider || null,
  });

  if (sessionState.updatedCookie) {
    response.cookies.set("lyrics_session", sessionState.updatedCookie.value, sessionState.updatedCookie.options);
  }

  return response;
}
