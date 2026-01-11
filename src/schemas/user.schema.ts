import { z } from "zod";

// Update Profile
export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9._]+$/, "Invalid username")
    .optional(),
  avatar: z.string().url().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;


// Change Passowrd
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;


// Change Email
export const changeEmailSchema = z.object({
  newEmail: z.string().email().toLowerCase(),
});

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;


// Confirm 2FA
export const confirmTwoFactorSchema = z.object({
  totp: z.string().length(6).optional(),
  emailOtp: z.string().length(6).optional(),
});

export type ConfirmTwoFactorInput = z.infer<typeof confirmTwoFactorSchema>;