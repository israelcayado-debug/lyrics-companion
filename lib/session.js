import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import { env } from "@/lib/env";
import { refreshAccessToken } from "@/lib/spotify";

const encoder = new TextEncoder();
const sessionKey = encoder.encode(env.sessionSecret);

export const sessionCookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "lax",
  secure: env.isProd,
  maxAge: 60 * 60 * 24 * 30,
};

export async function createSessionToken({ accessToken, refreshToken, expiresAt }) {
  return new SignJWT({ accessToken, refreshToken, expiresAt })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(sessionKey);
}

async function readSessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, sessionKey);
    return payload;
  } catch {
    return null;
  }
}

export async function ensureSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("lyrics_session")?.value;
  if (!token) return null;

  const payload = await readSessionToken(token);
  if (!payload?.accessToken || !payload?.refreshToken || !payload?.expiresAt) {
    return null;
  }

  const expiresAt = Number(payload.expiresAt);

  if (Date.now() < expiresAt - 60_000) {
    return {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      updatedCookie: null,
    };
  }

  const refreshed = await refreshAccessToken(payload.refreshToken);
  if (!refreshed) {
    return null;
  }

  const updatedCookieValue = await createSessionToken({
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    expiresAt: refreshed.expiresAt,
  });

  return {
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    updatedCookie: {
      value: updatedCookieValue,
      options: sessionCookieOptions,
    },
  };
}
