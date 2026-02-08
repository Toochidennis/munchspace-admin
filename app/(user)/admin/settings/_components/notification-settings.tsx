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

const NOTIF_DATA = {
  customer: [
    { id: "c1", title: "Order Confirmation", email: true },
    { id: "c2", title: "Payment Received", email: true },
    { id: "c3", title: "Order Shipped", email: true },
    { id: "c4", title: "Delivery Date Scheduled", email: true },
    { id: "c5", title: "Order Delivered", email: true },
    { id: "c6", title: "Order Cancelled", email: false },
  ],
  vendor: [
    { id: "v1", title: "New Order Alert", email: true },
    { id: "v2", title: "Payout Processed", email: true },
    { id: "v3", title: "Low Stock Warning", email: true },
  ],
  admin: [
    { id: "a1", title: "New Vendor Registration", email: true },
    { id: "a2", title: "Critical System Errors", email: true },
  ],
};

export function NotificationSettings() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <CardHeader className="px-0 flex flex-row items-center justify-between mt-5 mb-12">
        <div>
          <CardTitle className="text-2xl font-medium text-slate-900">
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
          title="Customer Notifications"
          description="Set up alerts to keep vendors updated on orders, payments, and inventory changes."
          initialData={NOTIF_DATA.customer}
          defaultOpen
        />
        <NotificationAccordion
          title="Vendor Notifications"
          description="Set up alerts for vendors regarding orders and stock."
          initialData={NOTIF_DATA.vendor}
        />
        <NotificationAccordion
          title="Admin Notifications"
          description="Configure critical notifications to keep admins informed about platform activity and approvals."
          initialData={NOTIF_DATA.admin}
        />
      </div>
    </div>
  );
}

function NotificationAccordion({
  title,
  description,
  initialData,
  defaultOpen = false,
}: any) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [data, setData] = React.useState(initialData);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  // Simulated API Call Logic
  const handleToggle = async (id: string, currentEmail: boolean) => {
    setLoadingId(id);

    try {
      // Simulate network latency
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate 5% failure rate for testing
          if (Math.random() > 0.05) {
            resolve(true);
          } else {
            reject(new Error("Update failed"));
          }
        }, 800);
      });

      // Update local UI state
      setData((prev: any) =>
        prev.map((item: any) =>
          item.id === id ? { ...item, email: !currentEmail } : item,
        ),
      );

      toast.success(`${title} preference updated`);
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
          <CardTitle className="text-lg font-bold text-slate-900">
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
                <TableHead className="text-sm border-r-2 font-semibold tracking-widest h-12 px-6">
                  Order Updates
                </TableHead>
                <TableHead className="text-sm font-semibold tracking-widest h-12 px-6 text-">
                  Email
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: any) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-slate-50/30 border-none last:border-0 h-13"
                >
                  <TableCell className="px-6 font-semibold border-r-2 text-slate-700 text-sm w-2/4">
                    {item.title}
                  </TableCell>
                  <TableCell className="px-6">
                    <div className="flex items-center gap-3">
                      {loadingId === item.id && (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      )}
                      <Switch
                        checked={item.email}
                        disabled={loadingId === item.id}
                        className="data-[state=checked]:bg-munchprimary"
                        onCheckedChange={() =>
                          handleToggle(item.id, item.email)
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
