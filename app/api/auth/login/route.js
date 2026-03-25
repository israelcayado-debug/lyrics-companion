import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { randomState } from "@/lib/utils";

export async function GET() {
  const state = randomState();
  const cookieStore = await cookies();
  cookieStore.set("spotify_oauth_state", state, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax",
    secure: env.isProd,
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.spotifyClientId,
    scope: "user-read-currently-playing user-read-playback-state",
    redirect_uri: env.spotifyRedirectUri,
    state,
  });

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
}
