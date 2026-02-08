"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check } from "lucide-react";

import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/validations/auth";
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit: SubmitHandler<ResetPasswordValues> = async (data) => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: "Processing request...",
      success: () => {
        setSubmittedEmail(data.email);
        setIsSuccess(true);
        return "Reset link generated!";
      },
      error: "Something went wrong. Please try again.",
    });
  };

  const handleGoToLogin = () => {
    setIsSuccess(false);
    router.push("/sign-in");
  };

  return (
    <div className="relative min-h-screen w-full flex items-center overflow-hidden bg-white">
      {/* Logo Section */}
      <Link href={"/"} className="absolute top-5 left-5 z-20">
        <Image
          src="/logo.svg"
          alt="MunchSpace Logo"
          width={100}
          height={38}
          priority
        />
      </Link>

      {/* Left Section: Form Container */}
      <div className="basis-full lg:basis-2/4 h-screen flex items-center justify-center px-10 md:px-20 lg:px-30">
        <div className="z-10 w-full max-w-[420px]">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">
            Reset Your Password
          </h1>
          <p className="text-slate-500 text-sm mb-10 leading-relaxed">
            Enter your email address below, and we'll send you a link to create
            a new password.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-600 font-semibold">
                      Email <span className="text-(--color-munchred)">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Email address"
                        className="bg-slate-50 border-slate-200 h-12 focus-visible:ring-1 focus-visible:ring-(--color-munchprimary)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-(--color-munchred)" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-10 px-6 font-normal bg-(--color-munchprimary) hover:bg-(--color-munchprimaryDark) transition-all text-white rounded shadow-sm"
              >
                Reset Password
              </Button>

              <div className="pt-2">
                <Link
                  href="/sign-in"
                  className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
                >
                  ← Back to Sign In
                </Link>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Right Section: Circuit Background */}
      <div
        className="hidden lg:block lg:basis-2/4 bg-slate-50/30 h-screen"
        style={{
          backgroundImage: `url('/auth/circuit-pattern.svg')`,
          backgroundSize: "800px",
        }}
      />

      {/* Full-Screen Success Overlay */}
      {isSuccess && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-6">
          <div className="w-full max-w-[440px] bg-white p-10 rounded-xl shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-(--color-munchprimary) flex items-center justify-center mb-6">
              <div className="w-12 h-12 rounded-full bg-(--color-munchprimary) flex items-center justify-center">
                <Check className="text-white w-6 h-6" strokeWidth={3} />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Check Your Email
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 px-4">
              We've sent a link to reset your password to{" "}
              <span className="text-blue-500 font-medium">
                {submittedEmail || "your email"}
              </span>
              . Please check your inbox and follow the instructions in the email
              to create a new password.
            </p>

            <Button
              onClick={handleGoToLogin}
              className="w-full h-12 bg-(--color-munchprimary) hover:bg-(--color-munchprimaryDark) text-white font-semibold rounded text-lg transition-colors"
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
