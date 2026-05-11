"use client";

import * as React from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";

interface NotificationChannel {
  email?: boolean;
  push?: boolean;
  sms?: boolean;
}

interface NotificationItem {
  key: string;
  label: string;
  isCritical: boolean;
  channels: NotificationChannel;
}

interface NotificationData {
  customer: NotificationItem[];
  vendor: NotificationItem[];
  admin: NotificationItem[];
}



export function NotificationSettings() {
  const [notifData, setNotifData] = React.useState<NotificationData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await authenticatedFetch("/admin/settings/notifications");
      const result = await parseApiResponse(res);
      if (result?.success) {
        setNotifData(result.data);
      } else {
        toast.error("Failed to fetch notification settings");
      }
    } catch (error) {
      toast.error("An error occurred while fetching settings");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSettings();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-munchprimary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <CardHeader className="px-0 flex flex-row items-center justify-between mt-5 mb-12">
        <div>
          <CardTitle className="text-2xl font-normal text-slate-900">
            Notification Settings
          </CardTitle>
          <CardDescription className="text-slate-500 mt-1">
            Customize how and when customers are notified about their orders,
            from order confirmation down to the delivery state.
          </CardDescription>
        </div>
      </CardHeader>

      <div className="space-y-4">
        <NotificationAccordion
          role="customer"
          title="Customer Notifications"
          description="Set up alerts to keep vendors updated on orders, payments, and inventory changes."
          initialData={notifData?.customer || []}
          defaultOpen
        />
        <NotificationAccordion
          role="vendor"
          title="Vendor Notifications"
          description="Set up alerts for vendors regarding orders and stock."
          initialData={notifData?.vendor || []}
        />
        <NotificationAccordion
          role="admin"
          title="Admin Notifications"
          description="Configure critical notifications to keep admins informed about platform activity and approvals."
          initialData={notifData?.admin || []}
        />
      </div>
    </div>
  );
}

function NotificationAccordion({
  role,
  title,
  description,
  initialData,
  defaultOpen = false,
}: any) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [data, setData] = React.useState<NotificationItem[]>(initialData);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  // Get all unique channels across all items in this group
  const channels = React.useMemo(() => {
    const keys = new Set<keyof NotificationChannel>();
    data.forEach((item) => {
      Object.keys(item.channels).forEach((k) => keys.add(k as any));
    });
    return Array.from(keys);
  }, [data]);

  const handleToggle = async (key: string, channel: keyof NotificationChannel, currentValue: boolean) => {
    const loaderKey = `${key}-${channel}`;
    setLoadingId(loaderKey);

    try {
      const item = data.find((it) => it.key === key);
      if (!item) return;

      const payload = {
        actorType: role,
        eventKey: key,
        ...item.channels,
        [channel]: !currentValue,
      };

      const res = await authenticatedFetch("/admin/settings/notifications", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const result = await parseApiResponse(res);

      if (result?.success) {
        setData((prev) =>
          prev.map((item) =>
            item.key === key
              ? {
                  ...item,
                  channels: {
                    ...item.channels,
                    [channel]: !currentValue,
                  },
                }
              : item
          )
        );
        toast.success(`${title} preference updated`);
      } else {
        toast.error(result?.message || "Failed to update preference");
      }
    } catch (error) {
      toast.error("Unable to update setting. Please check your connection.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card className="border border-slate-200 overflow-hidden bg-white rounded">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-3 bg-white hover:bg-slate-50/50 transition-all text-left group"
      >
        <div>
          <CardTitle className="text-lg font-normal text-slate-900">
            {title}
          </CardTitle>
          <CardDescription className="text-sm mt-1 text-slate-500">
            {description}
          </CardDescription>
        </div>
        <div
          className={cn(
            "p-2 rounded-full text-slate-500 transition-transform duration-200 group-hover:bg-slate-200",
            isOpen && "rotate-180",
          )}
        >
          <ChevronDown size={18} />
        </div>
      </button>

      {isOpen && (
        <div className="border mx-5 rounded border-slate-200">
          <Table>
            <TableHeader className="bg-gray-100 border-b">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-sm border-r-2 font-normal tracking-widest h-12 px-6">
                  Updates
                </TableHead>
                {channels.map((channel) => (
                  <TableHead key={channel} className="text-sm font-normal capitalize tracking-widest h-12 px-6">
                    {channel}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: any) => (
                <TableRow
                  key={item.key}
                  className="hover:bg-slate-50/30 border-none last:border-0 h-13"
                >
                  <TableCell className="px-6 font-normal border-r-2 text-slate-700 text-sm w-2/4">
                    {item.label}
                    {item.isCritical && (
                      <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-red-100 text-red-600 rounded-full font-normal">CRITICAL</span>
                    )}
                  </TableCell>
                  {channels.map((channel) => {
                    const isActive = item.channels[channel];
                    const isPresent = channel in item.channels;
                    const loaderKey = `${item.key}-${channel}`;

                    return (
                      <TableCell key={channel} className="px-6">
                        <div className="flex items-center gap-3">
                          {loadingId === loaderKey && (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          )}
                          {isPresent ? (
                            <Switch
                              checked={isActive}
                              disabled={loadingId !== null}
                              className="data-[state=checked]:bg-munchprimary"
                              onCheckedChange={() =>
                                handleToggle(item.key, channel, !!isActive)
                              }
                            />
                          ) : (
                            <span className="text-xs text-slate-300">-</span>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
