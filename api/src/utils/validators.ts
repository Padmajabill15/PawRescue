import { z } from "zod";

/** Indian mobile: optional +91 / 91 / 0 prefix, spaces or dashes allowed; stored as 10 digits. */
const PHONE_RE = /^(?:\+?91|0)?[6-9]\d{9}$/;
const clean = (v: string) => v.replace(/[\s-]/g, "");
export const phone = z
  .string()
  .trim()
  .transform(clean)
  .refine((v) => PHONE_RE.test(v), "Enter a valid 10-digit Indian mobile number")
  .transform((v) => v.slice(-10));
/** Same rule, but an empty value is allowed (field left blank). */
export const optionalPhone = z
  .string()
  .trim()
  .transform(clean)
  .refine((v) => v === "" || PHONE_RE.test(v), "Enter a valid 10-digit Indian mobile number")
  .transform((v) => (v ? v.slice(-10) : undefined));

export const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100)
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/\d/, "Password must include a number");

export const personName = z
  .string()
  .trim()
  .min(2, "Name is too short")
  .max(80)
  .regex(/^\p{L}[\p{L}\p{M} .'-]*$/u, "Name can contain letters, spaces and . ' - only");

export const orgName = z
  .string()
  .trim()
  .min(2, "Name is too short")
  .max(120)
  .regex(/^[\p{L}\p{N}][\p{L}\p{M}\p{N} .'&(),-]*$/u, "Name has characters that aren't allowed");
