function readRequired(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function readOptional(name, fallback) {
  const value = process.env[name]?.trim();
  return value || fallback;
}

export const env = {
  appUrl: readOptional("APP_URL", "http://127.0.0.1:3000"),
  spotifyClientId: readRequired("SPOTIFY_CLIENT_ID"),
  spotifyClientSecret: readRequired("SPOTIFY_CLIENT_SECRET"),
  spotifyRedirectUri:
    readOptional("SPOTIFY_REDIRECT_URI", `${readOptional("APP_URL", "http://127.0.0.1:3000")}/api/auth/callback`),
  sessionSecret: readRequired("SESSION_SECRET"),
  lyricsProvider: readOptional("LYRICS_PROVIDER", "lrclib"),
  isProd: process.env.NODE_ENV === "production",
};
