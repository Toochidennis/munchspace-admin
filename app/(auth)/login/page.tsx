"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL || "";
const API_KEY = process.env.NEXT_PUBLIC_MUNCHSPACE_API_KEY || "";

const emailSchema = z.object({
  identifier: z.string().min(1, "Please enter your email address."),
});

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be longer than or equal to 8 characters"),
});

type EmailValues = z.infer<typeof emailSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

async function parseApiResponse(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  try {
    const item = JSON.parse(token);
    if (Date.now() > item.expiry) {
      localStorage.removeItem("accessToken");
      return null;
    }
    return item.value;
  } catch {
    localStorage.removeItem("accessToken");
    return null;
  }
}

export default function SignInPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "password" | "otp">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedIdentifier, setSavedIdentifier] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const identifierRef = useRef<string>("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { identifier: "" },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });

  // Check if user is already logged in
  useEffect(() => {
    const token = getAccessToken();
    const isAdmin = localStorage.getItem("admin");

    if (token && isAdmin === "true") {
      setIsAuthenticated(true);
      router.push("/admin/dashboard");
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-munchprimary" />
          <p className="text-sm text-slate-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const getIdentifier = () => identifierRef.current || savedIdentifier;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && otp.join("").length === 6) {
      onOtpSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pasted)) return;
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    const next = Math.min(pasted.length, 5);
    otpRefs.current[next]?.focus();
  };

  async function onEmailSubmit(values: EmailValues) {
    setIsLoading(true);
    setServerError("");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({ identifier: values.identifier }),
      });

      const apiRes = await parseApiResponse(res);
      console.log("Login response:", apiRes);

      if (res.status >= 500) {
        emailForm.setError("root", {
          message: "Something went wrong. Please try again later.",
        });
        setIsLoading(false);
        return;
      }

      if (res.status === 401 || res.status === 403) {
        const errorMessage = (
          apiRes?.message ||
          apiRes?.error ||
          ""
        ).toLowerCase();

        if (
          errorMessage.includes("access") ||
          errorMessage.includes("forbidden") ||
          errorMessage.includes("admin")
        ) {
          emailForm.setError("root", {
            message:
              apiRes?.message ||
              "You do not have access to the admin page. Please contact support.",
          });
        } else {
          emailForm.setError("root", {
            message:
              apiRes?.message || "No account found with this email address.",
          });
        }
        setIsLoading(false);
        return;
      }

      if (!apiRes?.success || !apiRes?.data) {
        emailForm.setError("root", {
          message:
            apiRes?.message ||
            "An unexpected error occurred. Please try again.",
        });
        setIsLoading(false);
        return;
      }

      const data = apiRes.data;

      identifierRef.current = values.identifier;
      setSavedIdentifier(values.identifier);

      if (data.availableMethods) {
        if (data.availableMethods.includes("password")) {
          setStep("password");
        } else if (data.availableMethods.includes("otp")) {
          await requestOtp();
          setStep("otp");
        } else {
          emailForm.setError("root", {
            message: "No supported authentication method available.",
          });
        }
      } else if (data.accessToken && data.refreshToken) {
        completeSignIn(data);
      } else if (!data.hasPassword) {
        emailForm.setError("root", {
          message:
            "You were registered as a customer. Please reset your password.",
        });
      } else {
        emailForm.setError("root", {
          message: "Unexpected response from server. Please try again.",
        });
      }
    } catch {
      emailForm.setError("root", {
        message:
          "Unable to connect to the server. Please check your internet connection.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onPasswordSubmit(values: PasswordValues) {
    setIsLoading(true);
    setServerError("");

    const currentIdentifier = getIdentifier();
    if (!currentIdentifier) {
      passwordForm.setError("root", {
        message: "Session error. Please go back and enter your email again.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({
          identifier: currentIdentifier,
          password: values.password,
        }),
      });

      const apiRes = await parseApiResponse(res);
      console.log("Login response 2:", apiRes, savedIdentifier);

      if (res.status === 401 || res.status === 403) {
        const errorMessage = (
          apiRes?.message ||
          apiRes?.error ||
          ""
        ).toLowerCase();

        // Check if it's an admin access issue vs invalid credentials
        if (
          errorMessage.includes("access") ||
          errorMessage.includes("forbidden") ||
          errorMessage.includes("admin")
        ) {
          passwordForm.setError("root", {
            message:
              apiRes?.message ||
              "You do not have access to the admin page. Please contact support.",
          });
        } else {
          passwordForm.setError("root", {
            message: apiRes?.message || "Incorrect password. Please try again.",
          });
        }
        setIsLoading(false);
        return;
      }

      if (res.status >= 500) {
        passwordForm.setError("root", {
          message: "Something went wrong. Please try again later.",
        });
        setIsLoading(false);
        return;
      }

      if (!apiRes?.success || !apiRes?.data) {
        passwordForm.setError("root", {
          message: apiRes?.message || "Incorrect password. Please try again.",
        });
        setIsLoading(false);
        return;
      }

      const data = apiRes.data;

      if (data.availableMethods?.includes("otp") || data.requiresOtp) {
        await requestOtp();
        setStep("otp");
      } else if (data.accessToken && data.refreshToken) {
        completeSignIn(data);
      } else {
        completeSignIn(data);
      }
    } catch {
      passwordForm.setError("root", {
        message: "Network error. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function requestOtp() {
    const currentIdentifier = getIdentifier();
    if (!currentIdentifier) {
      setOtpError("Session expired. Please go back and try again.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/otp/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({ identifier: currentIdentifier }),
      });

      const apiRes = await parseApiResponse(res);

      if (!apiRes?.success) {
        setOtpError(apiRes?.message || "Failed to send verification code.");
      } else {
        setResendCooldown(60);
        setOtp(["", "", "", "", "", ""]);
      }
    } catch {
      setOtpError("Failed to request verification code. Please try again.");
    }
  }

  async function onOtpSubmit() {
    const code = otp.join("");
    if (code.length !== 6) return;

    const currentIdentifier = getIdentifier();
    if (!currentIdentifier) {
      setOtpError("Session error. Please restart the login process.");
      return;
    }

    setIsLoading(true);
    setOtpError("");

    try {
      const res = await fetch(`${API_BASE}/auth/otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({ identifier: currentIdentifier, otp: code }),
      });

      const apiRes = await parseApiResponse(res);
      console.log("OTP verify response:", apiRes);

      if (!apiRes?.success || !apiRes?.data) {
        setOtpError(
          apiRes?.message ||
            "Invalid or expired code. Please check and try again.",
        );
        setIsLoading(false);
        return;
      }

      if (apiRes.data?.admin !== true) {
        setOtpError(
          "You do not have access to the admin page. Please contact support.",
        );
        setIsLoading(false);
        return;
      }

      completeSignIn(apiRes.data);
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function completeSignIn(data: any) {
    if (!data.accessToken || !data.refreshToken) {
      console.warn("Missing tokens in final response");
      return;
    }

    // Check if user is an admin
    if (data.admin !== true) {
      console.warn("Non-admin user attempted to access admin panel");
      return;
    }

    // Store tokens with expiry (TTL: 60 days)
    const TTL_MS = 60 * 60 * 24 * 60 * 1000;
    localStorage.setItem(
      "accessToken",
      JSON.stringify({
        value: data.accessToken,
        expiry: Date.now() + TTL_MS,
      }),
    );
    localStorage.setItem(
      "refreshToken",
      JSON.stringify({
        value: data.refreshToken,
        expiry: Date.now() + TTL_MS,
      }),
    );

    if (data.vendor) {
      localStorage.setItem("vendor", JSON.stringify(data.vendor));
    }

    localStorage.setItem("admin", JSON.stringify(!!data.admin));
    localStorage.setItem("customer", JSON.stringify(!!data.customer));
    localStorage.setItem("user", JSON.stringify({
      displayName: data.displayName,
      firstName: data.firstName,
      lastName: data.lastName
    }));

    router.push("/admin/dashboard");
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setOtpError("");
    await requestOtp();
    setIsLoading(false);
  }

  return (
    <div className="relative min-h-screen w-full flex items-center overflow-hidden">
      <Link href={"/"} className="absolute top-5 left-5 z-20">
        <Image
          src="/logo.svg"
          alt="MunchSpace Logo"
          width={100}
          height={38}
          priority
        />
      </Link>

      <div
        className="w-full md:w-3/5 lg:basis-2/4 h-screen flex items-center justify-center px-6 md:px-10 lg:px-20"
        style={{
          backgroundImage: `url('/auth/circuit-pattern.svg')`,
          backgroundSize: "800px",
        }}
      >
        <div className="z-10 w-full max-w-md">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-10">
              Sign In to MunchSpace Admin
            </h1>

            {/* EMAIL STEP */}
            {step === "email" && (
              <Form {...emailForm}>
                <form
                  onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                  className="space-y-6"
                >
                  {emailForm.formState.errors.root && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {emailForm.formState.errors.root.message}
                    </div>
                  )}

                  <FormField
                    control={emailForm.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-semibold">
                          Email{" "}
                          <span className="text-[var(--color-munchred)]">
                            *
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Email address"
                            className="bg-slate-50 border-slate-200 h-12 focus-visible:ring-1 focus-visible:ring-[var(--color-munchprimary)]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[var(--color-munchred)]" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-10 w-full font-normal bg-munchprimary hover:bg-munchprimaryDark transition-all text-white rounded shadow-sm disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {isLoading ? "Please wait..." : "Continue"}
                  </Button>

                  <div className="pt-2 text-center">
                    <span className="text-slate-500 text-sm">
                      Don&apos;t have an account?{" "}
                    </span>
                    <Link
                      href="/register"
                      className="text-blue-500 hover:underline text-sm font-semibold"
                    >
                      Contact admin
                    </Link>
                  </div>
                </form>
              </Form>
            )}

            {/* PASSWORD STEP */}
            {step === "password" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Enter your password
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    for {savedIdentifier}
                  </p>
                </div>

                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="space-y-6"
                  >
                    {passwordForm.formState.errors.root && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {passwordForm.formState.errors.root.message}
                      </div>
                    )}

                    <FormField
                      control={passwordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600 font-semibold">
                            Password{" "}
                            <span className="text-[var(--color-munchred)]">
                              *
                            </span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                className="bg-slate-50 border-slate-200 h-12 pr-10 focus-visible:ring-1 focus-visible:ring-[var(--color-munchprimary)]"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                {showPassword ? (
                                  <EyeOffIcon size={18} />
                                ) : (
                                  <EyeIcon size={18} />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-[var(--color-munchred)]" />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-end">
                      <Link
                        href="/forgot-password"
                        className="text-sm text-blue-500 hover:underline font-semibold"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="h-10 w-full font-normal bg-munchprimary hover:bg-munchprimaryDark transition-all text-white rounded shadow-sm disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {isLoading ? "Signing in..." : "Log In"}
                    </Button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setServerError("");
                      }}
                      className="w-full text-sm text-slate-500 hover:text-slate-700"
                    >
                      ← Back
                    </button>
                  </form>
                </Form>
              </div>
            )}

            {/* OTP STEP */}
            {step === "otp" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Verify your account
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Enter the code sent to {savedIdentifier}
                  </p>
                </div>

                {otpError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {otpError}
                  </div>
                )}

                <div className="grid grid-cols-6 gap-3">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="h-12 text-center text-lg"
                      maxLength={1}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  ))}
                </div>

                <Button
                  onClick={onOtpSubmit}
                  disabled={isLoading || otp.join("").length !== 6}
                  className="h-10 w-full font-normal bg-munchprimary hover:bg-munchprimaryDark transition-all text-white rounded shadow-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isLoading ? "Verifying..." : "Verify"}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-slate-500">
                    Didn&apos;t receive the code?
                  </p>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isLoading}
                    className="text-sm text-blue-500 hover:underline font-semibold disabled:opacity-50"
                  >
                    {resendCooldown > 0
                      ? `Resend in ${formatTime(resendCooldown)}`
                      : "Resend code"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep("password");
                    setOtpError("");
                  }}
                  className="w-full text-sm text-slate-500 hover:text-slate-700"
                >
                  ← Back to password
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div></div>
    </div>
  );
}
