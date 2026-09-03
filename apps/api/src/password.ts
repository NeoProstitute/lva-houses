import { z } from "zod";

const passwordMessage = "Use at least 14 characters with upper- and lower-case letters, a number, and a symbol";

export const passwordInput = z.string()
  .min(14, passwordMessage)
  .max(128)
  .refine((password) => /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password), passwordMessage);
