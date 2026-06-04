import { z } from "zod";
import { NICKNAME_MAX_LENGTH, NICKNAME_MIN_LENGTH, NICKNAME_PATTERN } from "@/lib/nickname";

export const registerSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(NICKNAME_MIN_LENGTH)
    .max(NICKNAME_MAX_LENGTH)
    .regex(NICKNAME_PATTERN),
  email: z.email().toLowerCase(),
  password: z.string().min(8).max(100),
});

export const verifyEmailSchema = z.object({
  email: z.email().toLowerCase(),
  code: z.string().length(6).regex(/^\d+$/),
});

export const loginSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1),
});
