import * as z from "zod";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

const passwordValidation = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(
    /[^a-zA-Z0-9]/,
    "Password must contain at least one special character",
  );

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: passwordValidation,
  trustDevice: z.boolean().default(false),
});

export type LoginFormValues = z.input<typeof loginSchema>;

export const resetPasswordSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const createNewPasswordSchema = z
  .object({
    password: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type CreateNewPasswordValues = z.infer<typeof createNewPasswordSchema>;
