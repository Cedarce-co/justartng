import { createHmac, timingSafeEqual } from "crypto";

export function passwordMatches(input: string) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const given = Buffer.from(input);
  const expected = Buffer.from(password);
  if (given.length !== expected.length) {
    timingSafeEqual(expected, expected);
    return false;
  }
  return timingSafeEqual(given, expected);
}

export function adminToken(password: string) {
  return createHmac("sha256", password).update("anticipate-hues-admin").digest("hex");
}

export function isAdminCookie(value: string | undefined) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || !value) return false;
  const expected = Buffer.from(adminToken(password));
  const given = Buffer.from(value);
  if (given.length !== expected.length) return false;
  return timingSafeEqual(given, expected);
}
