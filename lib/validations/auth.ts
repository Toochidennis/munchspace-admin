import * as z from "zod";

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  trustDevice: z.boolean().default(false),
});

export type LoginFormValues = z.input<typeof loginSchema>;

export const resetPasswordSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const createNewPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type CreateNewPasswordValues = z.infer<typeof createNewPasswordSchema>;