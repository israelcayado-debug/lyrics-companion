function readRequired(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  appUrl: process.env.APP_URL || "http://127.0.0.1:3000",
  spotifyClientId: readRequired("SPOTIFY_CLIENT_ID"),
  spotifyClientSecret: readRequired("SPOTIFY_CLIENT_SECRET"),
  spotifyRedirectUri:
    process.env.SPOTIFY_REDIRECT_URI ||
    `${process.env.APP_URL || "http://127.0.0.1:3000"}/api/auth/callback`,
  sessionSecret: readRequired("SESSION_SECRET"),
  lyricsProvider: process.env.LYRICS_PROVIDER || "lrclib",
  isProd: process.env.NODE_ENV === "production",
};
