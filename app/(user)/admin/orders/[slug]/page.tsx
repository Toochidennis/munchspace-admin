"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  MoreHorizontal,
  ChevronRight,
  Plus,
  Info,
  Search,
  X,
  Loader2,
  Eye,
  EyeOff,
  MessageSquare,
  Ban,
  CheckCircle2,
  UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useParams, useRouter } from "next/navigation";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import { toast } from "sonner";

// --- Types ---
interface OrderDetails {
  orderId: string;
  orderCode: string;
  placedAt: string;
  expectedDeliveryAt: string | null;
  status: { key: string; label: string };
  allowedTransitions: { key: string; label: string }[];
  customer: { name: string; email: string; phoneNumber: string };
  shippingAddress: string;
  fulfillment: { type: string; pickup?: any; dropoff?: any };
  items: any[];
  summary: any;
  operations: any;
  riderPickup: any;
  timeline: { key: string; label: string; state: string; note: string; at: string }[];
}

interface ActivityLog {
  note: string;
  createdAt: string;
  createdDate: string;
  createdTime: string;
}

function CustomModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "sm:max-w-[640px]",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full bg-white shadow-xl overflow-hidden rounded animate-in zoom-in-95 duration-200 flex flex-col",
          maxWidth,
        )}
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex border-b items-center justify-between px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Activity Logs state
  const [isActivityLogsOpen, setIsActivityLogsOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsSearchQuery, setLogsSearchQuery] = useState("");

  // Modals States
  const [notifyVendorOpen, setNotifyVendorOpen] = useState(false);
  const [notifyCustomerOpen, setNotifyCustomerOpen] = useState(false);
  const [assignCourierOpen, setAssignCourierOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const [cancelOrderOpen, setCancelOrderOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelPassword, setCancelPassword] = useState("");
  const [cancelPasswordError, setCancelPasswordError] = useState<string | null>(null);
  const [showCancelPassword, setShowCancelPassword] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [markOrderAsOpen, setMarkOrderAsOpen] = useState(false);
  const [selectedStatusKey, setSelectedStatusKey] = useState("");
  const [statusChangeReason, setStatusChangeReason] = useState("");
  const [statusChangePassword, setStatusChangePassword] = useState("");
  const [showStatusChangePassword, setShowStatusChangePassword] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [statusChangeError, setStatusChangeError] = useState<string | null>(null);

  const [courierTab, setCourierTab] = useState<"all" | "unassigned">("unassigned");
  const [courierSearch, setCourierSearch] = useState("");

  const limit = 20;

  // Mock couriers
  const couriers = [
    {
      id: "c1",
      name: "Ayodele Muhammed",
      locations: "Agege / Ogba / Abulegba",
      status: "available" as const,
      assignments: 0,
    },
    {
      id: "c2",
      name: "Chukwudi Okeke",
      locations: "Ikeja / Alausa / Ojodu",
      status: "available" as const,
      assignments: 0,
    },
    {
      id: "c3",
      name: "Fatima Ibrahim",
      locations: "Surulere / Yaba / Ebute Metta",
      status: "busy" as const,
      assignments: 2,
    },
    {
      id: "c4",
      name: "Emeka Nwosu",
      locations: "Lekki Phase 1 / Phase 2",
      status: "available" as const,
      assignments: 0,
    },
    {
      id: "c5",
      name: "Aisha Bello",
      locations: "Victoria Island / Ikoyi",
      status: "available" as const,
      assignments: 1,
    },
  ];

  const filteredCouriers = useMemo(() => {
    let list = couriers;
    if (courierTab === "unassigned") {
      list = list.filter((c) => c.assignments === 0);
    }
    if (courierSearch.trim()) {
      const term = courierSearch.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.locations.toLowerCase().includes(term),
      );
    }
    return list;
  }, [courierTab, courierSearch]);

  const fetchOrder = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authenticatedFetch(`/admin/orders/${slug}`);
      const apiRes = await parseApiResponse(res);
      console.log("response is", apiRes);
      if (apiRes?.success) {
        setOrder(apiRes.data);
      } else {
        setError(apiRes?.message || "Failed to load order details");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!slug) return;
    fetchOrder();
  }, [slug]);

  const fetchLogs = async (page: number) => {
    if (!slug) return;
    setLogsLoading(true);
    try {
      const res = await authenticatedFetch(
        `/admin/orders/${slug}/activity?page=${page}&limit=${limit}`,
      );
      const apiRes = await parseApiResponse(res);
      if (apiRes?.success) {
        setActivityLogs(apiRes.data.activities);
        setLogsTotalPages(apiRes.data.totalPages);
        setLogsPage(apiRes.data.page);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (isActivityLogsOpen) {
      fetchLogs(logsPage);
    }
  }, [isActivityLogsOpen, logsPage]);

  // Actions
  const submitCancelOrder = async () => {
    setCancelPasswordError(null);
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }
    if (!cancelPassword.trim()) {
      setCancelPasswordError("Password is required");
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(cancelPassword)) {
      setCancelPasswordError(
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
      );
      return;
    }

    setIsCancelling(true);
    try {
      const token = typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("accessToken") || "{}").value
          : null;
      const API_BASE = process.env.NEXT_PUBLIC_BASE_URL || "";
      const API_KEY = process.env.NEXT_PUBLIC_MUNCHSPACE_API_KEY || "";

      const response = await fetch(
        `${API_BASE}/admin/orders/${order?.orderId}/cancel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: cancelReason.trim(),
            password: cancelPassword.trim(),
          }),
        },
      );

      const result = await parseApiResponse(response);

      if (response.status === 401) {
        setCancelPasswordError("Incorrect password");
        setIsCancelling(false);
        return;
      }

      if (result?.success) {
        toast.success("Order cancelled successfully");
        setCancelOrderOpen(false);
        setCancelReason("");
        setCancelPassword("");
        setCancelPasswordError(null);
        fetchOrder();
      } else {
        toast.error(result?.error || result?.message || "Failed to cancel order");
      }
    } catch (err) {
      toast.error("An error occurred while cancelling the order");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-screen">
        <span className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading order details...
        </span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-screen gap-4">
        <span className="text-red-500">{error || "Order not found"}</span>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const orderDateFormatted = new Date(order.placedAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const filteredLogs = activityLogs.filter((log) =>
    log.note.toLowerCase().includes(logsSearchQuery.toLowerCase()),
  );

  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const dateObj = new Date(log.createdDate);
    const dateStr = dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(log);
    return acc;
  }, {} as Record<string, ActivityLog[]>);

  return (
    <div className="flex flex-col gap-6 p-8 bg-[#F9FAFB] min-h-screen overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="rounded-md bg-white border-gray-200"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 text-gray-700" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{order.orderCode}</h1>
            <p className="text-sm text-muted-foreground">{orderDateFormatted}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-[#B64A26] hover:bg-[#963d1f] rounded-md text-white font-semibold"
            onClick={() => {
              setSelectedStatusKey("");
              setStatusChangeReason("");
              setStatusChangePassword("");
              setStatusChangeError(null);
              setMarkOrderAsOpen(true);
            }}
          >
            Mark Order as...
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-md bg-white border-gray-200 text-gray-700 font-semibold">
                More actions <MoreHorizontal className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-md w-48">
              <DropdownMenuItem
                className="gap-2 py-2.5 text-green-600 cursor-pointer"
                onClick={() => {
                  setCustomMessage("");
                  setNotifyVendorOpen(true);
                }}
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-4 h-4" alt="" />
                Notify Vendor...
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 py-2.5 text-blue-500 cursor-pointer"
                onClick={() => {
                  setCustomMessage("");
                  setNotifyCustomerOpen(true);
                }}
              >
                <MessageSquare size={16} /> Notify Customer...
              </DropdownMenuItem>
              <div className="h-px bg-gray-100 my-1" />
              <DropdownMenuItem
                className="gap-2 py-2.5 text-red-500 cursor-pointer"
                onClick={() => {
                  setCancelReason("");
                  setCancelPassword("");
                  setCancelOrderOpen(true);
                }}
              >
                <Ban size={16} /> Cancel Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Products & Payment */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-md overflow-hidden p-0 space-y-0 gap-0 shadow-sm border-gray-200">
            <div className="p-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
              <h3 className="font-semibold text-gray-900">Products</h3>
              <div
                className={cn(
                  "px-3 py-1 rounded text-sm font-semibold text-white",
                  order.status.key === "ready_for_pickup" && "bg-[#EB2F96]",
                  order.status.key === "out_for_delivery" && "bg-blue-500",
                  order.status.key === "completed" && "bg-green-500",
                  order.status.key === "pending_confirmation" && "bg-[#FDB022]",
                  !["ready_for_pickup", "out_for_delivery", "completed", "pending_confirmation"].includes(order.status.key) && "bg-gray-500"
                )}
              >
                {order.status.label}
              </div>
            </div>
            <CardContent className="p-0 bg-white">
              {order.status.key === "ready_for_pickup" && order.operations?.canAssignRider && (
                <div className="flex gap-4 bg-[#E6F4FF] m-4 p-4 rounded-md border border-[#91CAFF]">
                  <div className="mt-1">
                    <Info size={20} className="text-[#1677FF]" />
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    <h1 className="font-semibold text-[#1677FF] text-[15px]">
                      Assign Couriers for Order Delivery
                    </h1>
                    <p className="text-gray-600 text-[13px] leading-relaxed mb-1">
                      Select couriers to pick up and deliver this order from the vendor’s store/location to the customer’s shipping/delivery address.
                    </p>
                  </div>
                </div>
              )}

              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-4 px-0 mx-4 border-b border-gray-100 last:border-0",
                    order.status.key === "out_for_delivery" && "border border-gray-200 last:border-gray-200 my-3 rounded py-0",
                    order.status.key === "completed" && "border border-gray-200 last:border-gray-200 my-3 rounded py-0"
                  )}
                >
                  <div
                    className={cn(
                      "flex justify-between items-center",
                      order.status.key === "out_for_delivery" && "p-3",
                      order.status.key === "completed" && "p-3"
                    )}
                  >
                    <div className="flex gap-4">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-12 h-12 bg-gray-100 rounded-md object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-xs">No img</div>
                      )}
                      <div className="flex flex-col justify-center">
                        <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                        <p className="text-xs text-[#1677FF] hover:underline cursor-pointer mt-0.5">
                          {item.variantName || "Item"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-center">
                      <p className="text-[15px] font-semibold text-gray-900">
                        NGN {item.unitPrice?.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        x {item.quantity}
                      </p>
                    </div>
                  </div>

                  {order.status.key === "ready_for_pickup" && order.operations?.canAssignRider && (
                    <div className="flex justify-end mt-2 mb-2 mr-2">
                      <Button
                        variant={"outline"}
                        size={"sm"}
                        className="bg-white flex items-center text-[#1677FF] border-[#1677FF] hover:bg-[#E6F4FF] hover:text-[#1677FF] h-8 rounded px-3 font-semibold"
                        onClick={() => setAssignCourierOpen(true)}
                      >
                        <Plus size={16} strokeWidth={2.5} className="mr-1" />
                        <span>Assign Couriers</span>
                      </Button>
                    </div>
                  )}

                  {order.status.key === "out_for_delivery" && (
                    <div className="bg-[#FFF7E6] rounded-b border-t border-[#FFD591] p-2 px-3 flex justify-between items-center">
                      <p className="font-normal text-sm text-[#8C8C8C]">Delivery by</p>
                      <p className="flex items-center gap-2 text-sm text-gray-900">
                        <span className="font-semibold">
                          {order.riderPickup?.riderName || "Unknown Courier"}
                        </span>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info size={16} className="text-[#8C8C8C]" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-900 text-white border-none rounded shadow-md">
                            <p className="py-1 px-1 text-xs">
                              {order.riderPickup?.riderName} picked-up this <br />{" "}
                              order on: <br />{" "}
                              {order.riderPickup?.pickupDate} - {order.riderPickup?.pickupTime}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </p>
                    </div>
                  )}

                  {order.status.key === "completed" && (
                    <div className="bg-[#FFF7E6] rounded-b border-t border-[#FFD591] p-2 px-3 flex justify-between items-center">
                      <p className="font-normal text-sm text-[#8C8C8C]">Delivery by</p>
                      <p className="flex items-center gap-2 text-sm text-gray-900">
                        <span className="font-semibold">
                          {order.riderPickup?.riderName || "Unknown Courier"}
                        </span>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info size={16} className="text-[#8C8C8C]" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-900 text-white border-none rounded shadow-md">
                            <p className="py-1 px-1 text-center text-xs">
                              {order.riderPickup?.riderName} delivered this order
                              <br /> by: {order.riderPickup?.pickupDate} -{" "}
                              {order.riderPickup?.pickupTime}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payment Card */}
          <Card className="rounded-md p-0 gap-0 shadow-sm border-gray-200">
            <div className="p-4 py-3 font-semibold text-gray-900 border-b border-gray-100">Payment</div>
            <CardContent className="p-0">
              <div className="p-4 space-y-4 bg-[#FAFAFA] m-4 rounded border border-gray-100">
                <div className="flex justify-between text-[15px]">
                  <span className="text-gray-600 font-medium">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    N{order.summary?.subtotal?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-gray-600 font-medium">
                    Discount
                  </span>
                  <span className="font-semibold text-gray-900">
                    -N{order.summary?.discount?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-gray-600 font-medium">
                    Shipping or delivery
                  </span>
                  <span className="font-semibold text-gray-900">
                    N{order.summary?.deliveryFee?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between border-t border-dashed border-gray-300 pt-4 mt-2">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">
                    N{order.summary?.total?.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* View Activity Logs Link */}
          <div className="flex justify-center mt-6">
            <p className="text-sm text-gray-500 text-center">
              Want to know more about this order?<br />
              <button
                onClick={() => setIsActivityLogsOpen(true)}
                className="text-[#1677FF] hover:underline font-medium mt-1"
              >
                View activity logs.
              </button>
            </p>
          </div>
        </div>

        {/* Right Column: Customer & Timeline */}
        <div className="space-y-6">
          <Card className="rounded-md p-0 gap-0 shadow-sm border-gray-200">
            <div className="p-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
              <h3 className="font-semibold text-gray-900">Customer</h3>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
            <CardContent className="p-5 space-y-5">
              <div className="space-y-1.5">
                <p className="font-semibold text-[15px] text-gray-900 mb-2">Customer information</p>
                <p className="text-[14px] text-gray-700">{order.customer.name}</p>
                <p className="text-[14px] text-[#1677FF]">{order.customer.email}</p>
                <p className="text-[14px] text-gray-700">{order.customer.phoneNumber}</p>
              </div>
              <div className="space-y-1.5">
                <p className="font-semibold text-[15px] text-gray-900 mb-1">Shipping address</p>
                <p className="text-[14px] text-gray-700 leading-relaxed">{order.shippingAddress}</p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <div className="bg-white p-6 pt-0 rounded-md w-full max-w-md">
            <div className="relative flex flex-col pt-4">
              {order.timeline.map((step, index) => {
                const isCompleted = step.state === "completed";
                const isLast = index === order.timeline.length - 1;
                const isFirst = index === 0;
                
                const isActive = step.state === "active";
                const nextStepReached = !isLast && (order.timeline[index + 1]?.state === "completed" || order.timeline[index + 1]?.state === "active");

                const formattedDate = new Date(step.at).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }).toUpperCase();

                return (
                  <div key={index} className="relative pl-8 pb-10 last:pb-0 group">
                    {isFirst && (
                      <div className={cn("absolute left-[7px] -top-6 h-6 w-[2px]", isCompleted || isActive ? "bg-[#E66B3D]" : "bg-gray-200")} />
                    )}
                    {!isLast && (
                      <div className={cn("absolute left-[7px] top-4 h-full w-[2px]", nextStepReached ? "bg-[#E66B3D]" : "bg-gray-200")} />
                    )}
                    <div className={cn("absolute left-0 top-1 w-4 h-4 rounded-full border-[3px] border-white z-10 transition-colors duration-300", isCompleted || isActive ? "bg-[#E66B3D]" : "bg-gray-300")} />
                    <div className="flex flex-col -mt-1">
                      <span className={cn("text-[14px] font-semibold leading-tight transition-colors mb-0.5", isCompleted || isActive ? "text-gray-900" : "text-gray-400")}>
                        {step.label}
                      </span>
                      {step.at && (
                        <span className={cn("text-[12px]", isCompleted || isActive ? "text-gray-500" : "text-gray-400")}>
                          {formattedDate.replace(",", ".")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Logs Modal */}
      <CustomModal
        isOpen={isActivityLogsOpen}
        onClose={() => setIsActivityLogsOpen(false)}
        title="Activity logs"
      >
        <div className="space-y-6">
          <div className="relative w-full">
            <Input
              placeholder="Search logs by name or action"
              value={logsSearchQuery}
              onChange={(e) => setLogsSearchQuery(e.target.value)}
              className="h-11 pl-11 border-gray-200 rounded-md focus-visible:ring-gray-900 focus-visible:ring-1 text-gray-900"
            />
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
          <div className="space-y-8 min-h-[300px]">
            {logsLoading && activityLogs.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : Object.keys(groupedLogs).length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No activity logs found.
              </div>
            ) : (
              Object.entries(groupedLogs).map(([date, logs], dayIdx) => (
                <div key={dayIdx} className="relative">
                  <div className="flex items-center gap-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-600 whitespace-nowrap">{date}</h3>
                    <div className="w-full h-[1px] bg-gray-100" />
                  </div>
                  <div className="relative space-y-8 ml-2">
                    <div className="absolute left-[3px] top-2 bottom-2 w-[1.5px] bg-gray-200" />
                    {logs.map((log, logIdx) => {
                      const timeStr = new Date(log.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      });
                      return (
                        <div key={logIdx} className="relative pl-8 flex items-start gap-4">
                          <div className="absolute left-0 top-[6px] w-2 h-2 rounded-full bg-gray-300 ring-4 ring-white z-10" />
                          <div className="flex gap-4 items-baseline">
                            <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{timeStr}:</span>
                            <p className="text-[14px] text-gray-600 leading-relaxed">{log.note}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
          {logsTotalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Page {logsPage} of {logsTotalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                  disabled={logsPage === 1 || logsLoading}
                  className="bg-white"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogsPage(p => Math.min(logsTotalPages, p + 1))}
                  disabled={logsPage === logsTotalPages || logsLoading}
                  className="bg-white"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </CustomModal>

      {/* Notify Vendor Modal */}
      <CustomModal
        isOpen={notifyVendorOpen}
        onClose={() => {
          setNotifyVendorOpen(false);
          setCustomMessage("");
        }}
        title="Notify Vendor"
        maxWidth="sm:max-w-[500px]"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setNotifyVendorOpen(false);
                setCustomMessage("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={!customMessage.trim() || isSendingMessage}
              onClick={async () => {
                if (!customMessage.trim()) return;

                setIsSendingMessage(true);
                try {
                  const res = await authenticatedFetch(
                    `/admin/orders/${order?.orderId}/messages`,
                    {
                      method: "POST",
                      body: JSON.stringify({
                        recipient: "vendor",
                        message: customMessage.trim(),
                      }),
                    },
                  );
                  const result = await parseApiResponse(res);

                  if (result?.success) {
                    toast.success("Message sent to vendor successfully");
                  } else {
                    toast.error("Failed to send message to vendor");
                  }

                  setNotifyVendorOpen(false);
                  setCustomMessage("");
                } catch (err) {
                  toast.error("Failed to send message");
                } finally {
                  setIsSendingMessage(false);
                }
              }}
            >
              {isSendingMessage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Send a message to vendor.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={5}
              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
            />
          </div>
        </div>
      </CustomModal>

      {/* Notify Customer Modal */}
      <CustomModal
        isOpen={notifyCustomerOpen}
        onClose={() => {
          setNotifyCustomerOpen(false);
          setCustomMessage("");
        }}
        title="Notify Customer"
        maxWidth="sm:max-w-[500px]"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setNotifyCustomerOpen(false);
                setCustomMessage("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={!customMessage.trim() || isSendingMessage}
              onClick={async () => {
                if (!customMessage.trim()) return;

                setIsSendingMessage(true);
                try {
                  const res = await authenticatedFetch(
                    `/admin/orders/${order?.orderId}/messages`,
                    {
                      method: "POST",
                      body: JSON.stringify({
                        recipient: "customer",
                        message: customMessage.trim(),
                      }),
                    },
                  );
                  const result = await parseApiResponse(res);

                  if (result?.success) {
                    toast.success("Message sent to customer successfully");
                  } else {
                    toast.error("Failed to send message to customer");
                  }

                  setNotifyCustomerOpen(false);
                  setCustomMessage("");
                } catch (err) {
                  toast.error("Failed to send message");
                } finally {
                  setIsSendingMessage(false);
                }
              }}
            >
              {isSendingMessage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Send a message to customer:{" "}
            <span className="font-medium">
              {order?.customer.name || "Customer"}
            </span>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={5}
              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
            />
          </div>
        </div>
      </CustomModal>

      {/* Assign Courier Modal */}
      <CustomModal
        isOpen={assignCourierOpen}
        onClose={() => setAssignCourierOpen(false)}
        title={
          order?.status.key.includes("delivery")
            ? "Assign Couriers for Order Delivery"
            : "Assign Couriers for Order Pick-Up"
        }
        maxWidth="sm:max-w-[680px]"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setAssignCourierOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => {
                toast.success("Courier assigned successfully");
                setAssignCourierOpen(false);
              }}
            >
              Assign Couriers
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Shipping address
            </p>
            <p className="text-sm text-gray-600">
              {order?.shippingAddress}
            </p>
          </div>

          <div className="flex items-center gap-3 border-b pb-3">
            <Button
              variant={courierTab === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setCourierTab("all")}
            >
              All ({couriers.length})
            </Button>
            <Button
              variant={courierTab === "unassigned" ? "default" : "outline"}
              size="sm"
              onClick={() => setCourierTab("unassigned")}
            >
              Unassigned ({couriers.filter((c) => c.assignments === 0).length})
            </Button>
          </div>

          <Input
            placeholder="Search courier by name, email or by locations"
            value={courierSearch}
            onChange={(e) => setCourierSearch(e.target.value)}
            className="max-w-md"
          />

          <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2">
            {filteredCouriers.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p className="text-sm">
                  No {courierTab === "unassigned" ? "unassigned " : ""}courier
                  found for these locations
                </p>
                <Button
                  variant="link"
                  className="mt-2 text-orange-600"
                  onClick={() => {
                    setCourierSearch("");
                    setCourierTab("all");
                  }}
                >
                  Show All Couriers Instead
                </Button>
              </div>
            ) : (
              filteredCouriers.map((courier) => (
                <div
                  key={courier.id}
                  className="flex items-center justify-between py-3 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <input type="radio" name="courier" className="h-4 w-4" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {courier.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {courier.locations}
                      </p>
                      {courier.assignments > 0 && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          Assigned ({courier.assignments})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {courier.status === "busy" && (
                      <span className="text-xs text-orange-600 font-medium">
                        Busy
                      </span>
                    )}
                    <MoreHorizontal className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CustomModal>

      {/* Cancel Order Confirmation Modal */}
      <CustomModal
        isOpen={cancelOrderOpen}
        onClose={() => {
          if (!isCancelling) {
            setCancelOrderOpen(false);
            setCancelReason("");
            setCancelPassword("");
            setCancelPasswordError(null);
          }
        }}
        title="Cancel Order"
        maxWidth="sm:max-w-[480px]"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setCancelOrderOpen(false);
                setCancelReason("");
                setCancelPassword("");
              }}
              disabled={isCancelling}
            >
              Close
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={submitCancelOrder}
              disabled={
                isCancelling || !cancelReason.trim() || !cancelPassword.trim()
              }
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Confirm Cancel"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-700 mb-4">
              You are about to cancel order{" "}
              <span className="font-medium">{order?.orderCode}</span>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reason for cancellation
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter the reason for cancelling this order..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y min-h-[100px]"
                  disabled={isCancelling}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Enter your password to confirm
                </label>
                <div className="relative">
                  <Input
                    type={showCancelPassword ? "text" : "password"}
                    value={cancelPassword}
                    onChange={(e) => {
                      setCancelPassword(e.target.value);
                      if (cancelPasswordError) setCancelPasswordError(null);
                    }}
                    placeholder="Your account password"
                    className={cn(
                      "h-11 pr-10",
                      cancelPasswordError &&
                        "border-red-500 focus:ring-red-500",
                    )}
                    disabled={isCancelling}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCancelPassword(!showCancelPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isCancelling}
                  >
                    {showCancelPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {cancelPasswordError && (
                  <p className="text-sm text-red-500 mt-1">
                    {cancelPasswordError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CustomModal>

      {/* Mark Order As Modal */}
      <CustomModal
        isOpen={markOrderAsOpen}
        onClose={() => {
          if (!isChangingStatus) {
            setMarkOrderAsOpen(false);
            setSelectedStatusKey("");
            setStatusChangeReason("");
            setStatusChangePassword("");
            setStatusChangeError(null);
          }
        }}
        title="Mark Order As"
        maxWidth="sm:max-w-[500px]"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setMarkOrderAsOpen(false);
                setSelectedStatusKey("");
                setStatusChangeReason("");
                setStatusChangePassword("");
              }}
              disabled={isChangingStatus}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={async () => {
                if (!selectedStatusKey || !statusChangePassword.trim()) return;

                setIsChangingStatus(true);
                setStatusChangeError(null);

                try {
                  const token = typeof window !== "undefined"
                      ? JSON.parse(localStorage.getItem("accessToken") || "{}").value
                      : null;
                  const API_BASE = process.env.NEXT_PUBLIC_BASE_URL || "";
                  const API_KEY = process.env.NEXT_PUBLIC_MUNCHSPACE_API_KEY || "";

                  const response = await fetch(
                    `${API_BASE}/admin/orders/${order?.orderId}/status`,
                    {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                        "x-api-key": API_KEY,
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        statusKey: selectedStatusKey,
                        reason: statusChangeReason.trim(),
                        password: statusChangePassword.trim(),
                      }),
                    },
                  );

                  const result = await parseApiResponse(response);
                  
                  if (response.status === 401) {
                    setStatusChangeError("Incorrect password");
                    setIsChangingStatus(false);
                    return;
                  }

                  if (result?.success) {
                    toast.success("Order status updated successfully");
                    setMarkOrderAsOpen(false);
                    setSelectedStatusKey("");
                    setStatusChangeReason("");
                    setStatusChangePassword("");
                    setStatusChangeError(null);
                    fetchOrder();
                  } else {
                    const errorMessage =
                      result?.error ||
                      result?.message ||
                      "Failed to update order status";
                    toast.error(errorMessage);
                  }
                } catch (err) {
                  toast.error("Failed to update order status");
                } finally {
                  setIsChangingStatus(false);
                }
              }}
            >
              {isChangingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Change status for order:{" "}
            <span className="font-medium">
              {order?.orderCode}
            </span>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status
            </label>
            <Select
              value={selectedStatusKey}
              onValueChange={setSelectedStatusKey}
              disabled={isChangingStatus}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {order?.allowedTransitions && order.allowedTransitions.length > 0 ? (
                  order.allowedTransitions.map((transition) => (
                    <SelectItem
                      key={transition.key}
                      value={transition.key}
                    >
                      {transition.label}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    No status changes available for this order
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason
            </label>
            <textarea
              value={statusChangeReason}
              onChange={(e) => setStatusChangeReason(e.target.value)}
              placeholder="Enter reason for status change..."
              rows={3}
              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
              disabled={isChangingStatus}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your password to confirm
            </label>
            <div className="relative">
              <Input
                type={showStatusChangePassword ? "text" : "password"}
                value={statusChangePassword}
                onChange={(e) => {
                  setStatusChangePassword(e.target.value);
                  if (statusChangeError) setStatusChangeError(null);
                }}
                placeholder="Your account password"
                className={cn(
                  "h-11 pr-10",
                  statusChangeError &&
                    "border-red-500 focus:ring-red-500",
                )}
                disabled={isChangingStatus}
              />
              <button
                type="button"
                onClick={() =>
                  setShowStatusChangePassword(!showStatusChangePassword)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isChangingStatus}
              >
                {showStatusChangePassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
            {statusChangeError && (
              <p className="text-sm text-red-500 mt-1">
                {statusChangeError}
              </p>
            )}
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
