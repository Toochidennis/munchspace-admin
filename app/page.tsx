"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Homepage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    let isLoggedIn = false;

    if (token) {
      try {
        const item = JSON.parse(token);
        if (item.value && Date.now() < item.expiry) {
          isLoggedIn = true;
        }
      } catch {
        // Invalid token
      }
    }

    if (isLoggedIn) {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return null;
}