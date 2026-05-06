"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  console.log("Retrieved token:", token);

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

const routeTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/orders": "Orders",
  "/admin/vendors": "Vendors",
  "/admin/riders": "Riders",
  "/admin/customers": "Customers",
  "/admin/payments": "Payments",
  "/admin/payouts": "Payouts",
  "/admin/settings": "Settings",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
    } else {
      setIsChecking(false);
    }
  }, [router, pathname]);

  const getPageTitle = () => {
    // Exact match
    if (routeTitles[pathname]) return routeTitles[pathname];
    
    // Dynamic match (e.g. /admin/orders/[slug])
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length >= 2) {
      const base = `/${segments[0]}/${segments[1]}`;
      if (routeTitles[base]) {
        // If it's a detail page, maybe return "Order Details" etc
        const detailMap: Record<string, string> = {
          "/admin/orders": "Order Details",
          "/admin/vendors": "Vendor Details",
          "/admin/riders": "Rider Details",
          "/admin/customers": "Customer Details",
        };
        return detailMap[base] || routeTitles[base];
      }
    }
    
    return "Munchspace Admin";
  };

  if (isChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAFBFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-munchprimary" />
          <p className="text-sm text-slate-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FAFBFC]">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header title={getPageTitle()} />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
