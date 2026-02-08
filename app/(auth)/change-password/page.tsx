"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, EyeIcon } from "lucide-react";

import {
  createNewPasswordSchema,
  type CreateNewPasswordValues,
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

export default function CreateNewPasswordPage() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const form = useForm<CreateNewPasswordValues>({
    resolver: zodResolver(createNewPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit: SubmitHandler<CreateNewPasswordValues> = async (data) => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: "Updating password...",
      success: () => {
        setIsSuccess(true);
        return "Password updated!";
      },
      error: "Failed to update password.",
    });
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
            Create New Password
          </h1>
          <p className="text-slate-500 text-sm mb-10 leading-relaxed">
            Secure your account by setting your new password.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-600 font-semibold">
                      New password{" "}
                      <span className="text-(--color-munchred)">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPass ? "text" : "password"}
                          placeholder="New password"
                          className="bg-slate-50 border-slate-200 h-12 pr-10 focus-visible:ring-1 focus-visible:ring-(--color-munchprimary)"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <EyeIcon size={18} />
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-(--color-munchred)" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-600 font-semibold">
                      Confirm password{" "}
                      <span className="text-(--color-munchred)">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPass ? "text" : "password"}
                          placeholder="Confirm password"
                          className="bg-slate-50 border-slate-200 h-12 pr-10 focus-visible:ring-1 focus-visible:ring-(--color-munchprimary)"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <EyeIcon size={18} />
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-(--color-munchred)" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-10 px-6 font-normal bg-(--color-munchprimary) hover:bg-(--color-munchprimaryDark) transition-all text-white rounded shadow-sm"
              >
                Create Password
              </Button>
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

      {/* Full-Screen Success Overlay (No Close Button) */}
      {isSuccess && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-[440px] bg-white p-10 rounded-xl shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-(--color-munchprimary) flex items-center justify-center mb-6">
              <div className="w-12 h-12 rounded-full bg-(--color-munchprimary) flex items-center justify-center">
                <Check className="text-white w-6 h-6" strokeWidth={3} />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Password Updated Successfully
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 px-4">
              Your password has been updated. You can now use your new password
              to log in to your account.
            </p>

            <Button
              onClick={() => router.push("/sign-in")}
              className="w-full h-12 bg-(--color-munchprimary) hover:bg-(--color-munchprimaryDark) text-white font-semibold rounded text-lg transition-colors"
            >
              Go to Login
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
