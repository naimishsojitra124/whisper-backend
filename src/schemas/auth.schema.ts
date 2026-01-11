import { z } from 'zod';

export const registerSchema = z.object({
    username: z.string().min(3).max(30),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128)
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;


export const twoFactorLoginSchema = z
  .object({
    twoFactorToken: z.string(),
    totp: z.string().length(6).optional(),
    emailOtp: z.string().length(6).optional(),
  })
  .refine(
    (data) => data.totp || data.emailOtp,
    {
      message: "Either TOTP or email OTP is required.",
    }
  );

export type TwoFactorLoginInput = z.infer<typeof twoFactorLoginSchema>;