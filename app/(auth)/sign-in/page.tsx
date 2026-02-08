"use client";

import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { EyeIcon } from "lucide-react";

import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function SignInPage() {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      trustDevice: true,
    },
  });

  async function onSubmit(data: LoginFormValues) {
    // sonner toast for modern feedback
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
      loading: "Signing you in...",
      success: "Welcome to MunchSpace Admin!",
      error: "Authentication failed. Please check your credentials.",
    });
    console.log(data);
  }

  return (
    <div className="relative min-h-screen w-full flex items-center overflow-hidden">
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
      {/* Background Circuit Pattern */}
      <div
        className="basis-2/4 h-screen flex items-center justify-center px-30"
        style={{
          backgroundImage: `url('/auth/circuit-pattern.svg')`,
          backgroundSize: "800px",
        }}
      >
        <div className="z-10 w-full">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-10">
              Sign In to MuchSpace Admin
            </h1>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600 font-semibold">
                        Email{" "}
                        <span className="text-[var(--color-munchred)]">*</span>
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

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600 font-semibold">
                        Password{" "}
                        <span className="text-[var(--color-munchred)]">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="password"
                            placeholder="Password"
                            className="bg-slate-50 border-slate-200 h-12 pr-10 focus-visible:ring-1 focus-visible:ring-[var(--color-munchprimary)]"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <EyeIcon size={18} />
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-[var(--color-munchred)]" />
                    </FormItem>
                  )}
                />

                {/* Trust Device */}
                <FormField
                  control={form.control}
                  name="trustDevice"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-slate-300 data-[state=checked]:bg-[var(--color-munchprimaryDark)] data-[state=checked]:border-none"
                        />
                      </FormControl>
                      <FormLabel className="text-sm text-slate-700 select-none">
                        Trust this device
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {/* Login Button */}
                <Button
                  type="submit"
                  className="h-10 mt-3 font-normal text- bg-munchprimary hover:bg-munchprimaryDark transition-all text-white rounded shadow-sm"
                >
                  Log In
                </Button>

                {/* Reset Password */}
                <div className="pt-4">
                  <span className="text-slate-500 text-sm">
                    Forget your password?{" "}
                  </span>
                  <Link
                    href="/reset-password"
                    className="text-blue-500 hover:underline text-sm underline font-semibold"
                  >
                    Reset it
                  </Link>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
      <div></div>
    </div>
  );
}
