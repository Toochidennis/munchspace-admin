"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Home,
  ShoppingBag,
  Store,
  Users,
  Settings,
  LogOut,
  Motorbike,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { icon: <Home size={22} />, label: "Homepage", href: "/admin/dashboard" },
    {
      icon: <ShoppingBag size={22} />,
      label: "Orders",
      href: "/admin/orders",
    },
    { icon: <Store size={22} />, label: "Vendors", href: "/admin/vendors" },
    { icon: <Motorbike size={22} />, label: "Riders", href: "/admin/riders" },
    {
      icon: <Users size={22} />,
      label: "Customers",
      href: "/admin/customers",
    },
  ];

  return (
    <aside
      className={cn(
        "border-r bg-background transition-all duration-300 flex flex-col h-screen sticky top-0 z-30",
        isCollapsed ? "w-[80px]" : "w-[260px]",
      )}
    >
      {/* Logo Section */}
      <div className="p-6 flex items-center justify-between flex-shrink-0">
        {!isCollapsed && (
          <Image
            src="/logo.svg"
            alt="MunchSpace"
            width={110}
            height={35}
            priority
          />
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 p-1 hover:bg-slate-100 rounded transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Search Bar */}
      {!isCollapsed && (
        <div className="px-4 mb-6 flex-shrink-0">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <Input
              placeholder="Search"
              className="pl-10 bg-[#F8F9FA] border-none h-11 focus-visible:ring-1 focus-visible:ring-orange-500"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.label} href={item.href}>
              <button
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-1",
                  isActive
                    ? "bg-orange-500 text-white shadow-md shadow-orange-100"
                    : "text-slate-500 hover:bg-slate-50",
                  isCollapsed ? "justify-center" : "justify-start",
                )}
              >
                {item.icon}
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </button>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t space-y-1">
        <button
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-50",
            isCollapsed ? "justify-center" : "justify-start",
          )}
        >
          <Settings size={22} />
          {!isCollapsed && (
            <Link href={"/admin/settings"} className="text-sm font-medium">
              Settings
            </Link>
          )}
        </button>
        <button
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50",
            isCollapsed ? "justify-center" : "justify-start",
          )}
        >
          <LogOut size={22} />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
