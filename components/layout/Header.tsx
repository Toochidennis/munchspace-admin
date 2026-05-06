"use client";

import React from 'react'
import { Button } from '../ui/button';
import { Bell, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NotificationItem {
  key: string;
  label: string;
  isCritical: boolean;
  channels: Record<string, boolean>;
}

interface NotificationData {
  customer: NotificationItem[];
  vendor: NotificationItem[];
  admin: NotificationItem[];
}

const Header = ({ title }: { title: string; }) => {
  const [user, setUser] = React.useState<{ displayName: string; firstName: string; lastName: string } | null>(null);
  const [notifications, setNotifications] = React.useState<NotificationData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }

    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await authenticatedFetch("/admin/settings/notifications");
      const result = await parseApiResponse(res);
      if (result?.success) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setIsLoading(false);
    }
  };

  const initials = React.useMemo(() => {
    if (!user) return "MS";
    const f = user.firstName?.[0] || "";
    const l = user.lastName?.[0] || "";
    return (f + l).toUpperCase() || user.displayName?.[0]?.toUpperCase() || "U";
  }, [user]);

  const allNotifications = React.useMemo(() => {
    if (!notifications) return [];
    
    // Flatten and add category
    return [
      ...notifications.admin.map(n => ({ ...n, category: 'Admin' })),
      ...notifications.vendor.map(n => ({ ...n, category: 'Vendor' })),
      ...notifications.customer.map(n => ({ ...n, category: 'Customer' }))
    ];
  }, [notifications]);

  return (
    <>
      {/* FIXED HEADER */}
      <header className="h-[72px] bg-white border-b flex items-center justify-between px-8 flex-shrink-0 z-20">
        <h1 className="text-xl font-medium text-[#1A1C1E] capitalize">{title}</h1>
        <div className="flex items-center gap-5">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-10 w-10 outline-none">
                <Bell size={22} className="text-slate-600" />
                {allNotifications.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#FF3B30] rounded-full border-2 border-white animate-pulse"></span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[380px] p-0 overflow-hidden rounded-xl border-slate-200 shadow-2xl">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-semibold text-slate-900">System Notifications</h3>
                <Badge variant="outline" className="bg-white text-slate-500 font-medium border-slate-200">
                  {allNotifications.length} Total
                </Badge>
              </div>
              <div className="max-h-[450px] overflow-y-auto scrollbar-hide">
                {isLoading ? (
                  <div className="p-12 text-center text-slate-400 text-sm italic">
                    Loading notifications...
                  </div>
                ) : allNotifications.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {allNotifications.map((notif, idx) => (
                      <div key={notif.key + idx} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className="flex gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                            notif.isCritical ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                          )}>
                            {notif.isCritical ? <AlertTriangle size={18} /> : <Info size={18} />}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[13.5px] font-semibold text-slate-900 leading-tight">
                                {notif.label}
                              </p>
                              {notif.isCritical && (
                                <Badge variant="destructive" className="text-[9px] h-4 px-1.5 uppercase tracking-wider font-bold">
                                  Critical
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter">
                                {notif.category} Update
                              </span>
                              <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                              <span className="text-[11px] text-slate-400">
                                {notif.channels.email ? 'Email' : ''} {notif.channels.push ? '& Push' : ''} enabled
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="text-slate-200" size={24} />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">All caught up!</p>
                    <p className="text-xs text-slate-400 mt-1">No new system alerts at the moment.</p>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-slate-100 text-center bg-slate-50/30">
                <button className="text-[12px] font-semibold text-[#E86B35] hover:text-[#d45a2a] transition-colors">
                  View Notification Settings
                </button>
              </div>
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-3 pl-5 border-l h-10 border-slate-100">
            <p className="text-sm font-medium text-[#1A1C1E] hidden sm:block">
              {user?.displayName || "User"}
            </p>
            <div className="w-10 h-10 rounded bg-[#1A1C1E] text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {initials}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header