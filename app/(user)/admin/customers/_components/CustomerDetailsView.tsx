"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Calendar,
  ChevronRight,
  Search,
  X,
  Mail,
  AlertCircle,
  ShoppingBag,
  CheckCircle2,
  Ban,
  Loader2,
} from "lucide-react";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CartItem {
  menuItemId: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
  total: number;
}

interface Cart {
  cartId: string;
  business: {
    id: string;
    name: string;
    logo: string;
  };
  items: CartItem[];
  cartTotalAmount: number;
}

const CustomDialog = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
          >
            <X size={20} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default function CustomerDetailsView({ customer, onBack }: any) {
  const [activePurchaseTab, setActivePurchaseTab] = React.useState("ALL");
  const [purchaseTime, setPurchaseTime] = React.useState("7");
  const [expandedPurchases, setExpandedPurchases] = React.useState<string[]>(
    [],
  );
  const [isLogsOpen, setIsLogsOpen] = React.useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = React.useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = React.useState(false);
  const [logSearch, setLogSearch] = React.useState("");
  const [logTime, setLogTime] = React.useState("7");
  const [notificationOption, setNotificationOption] = React.useState<
    "predefined" | "custom" | null
  >(null);
  const [customMessage, setCustomMessage] = React.useState("");
  const [suspendReason, setSuspendReason] = React.useState("");
  const [suspendNote, setSuspendNote] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);

  // Cart Data
  const [cartData, setCartData] = React.useState<Cart[]>([]);
  const [isCartLoading, setIsCartLoading] = React.useState(true);

  // Purchases Data
  const [purchasesData, setPurchasesData] = React.useState<any[]>([]);
  const [isPurchasesLoading, setIsPurchasesLoading] = React.useState(false);
  const [totalPurchasePages, setTotalPurchasePages] = React.useState(1);
  const [totalPurchaseCount, setTotalPurchaseCount] = React.useState(0);
  const [purchaseCounts, setPurchaseCounts] = React.useState<
    Record<string, number>
  >({});

  const fetchCartData = React.useCallback(async () => {
    if (!customer?.id) return;
    try {
      setIsCartLoading(true);
      const res = await authenticatedFetch(
        `/admin/customers/${customer.id}/carts`,
      );
      const apiRes = await parseApiResponse(res);
      if (apiRes?.success) {
        setCartData(apiRes.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch cart data:", err);
    } finally {
      setIsCartLoading(false);
    }
  }, [customer?.id]);

  const fetchPurchases = React.useCallback(async () => {
    if (!customer?.id) return;
    try {
      setIsPurchasesLoading(true);
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", "5");

      if (activePurchaseTab !== "ALL") {
        params.set("status", activePurchaseTab);
      }

      if (purchaseTime && purchaseTime !== "all") {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - parseInt(purchaseTime));
        params.set("startDate", start.toISOString());
        params.set("endDate", end.toISOString());
      }

      const res = await authenticatedFetch(
        `/admin/customers/${customer.id}/orders?${params.toString()}`,
      );
      const apiRes = await parseApiResponse(res);

      if (apiRes?.success) {
        const data = apiRes.data;
        let ordersList = [];

        if (
          Array.isArray(data?.data) &&
          data.data.length > 0 &&
          data.data[0].orders
        ) {
          // Flatten groups from data.data
          ordersList = data.data.flatMap((g: any) => g.orders || []);
        } else if (data?.groups) {
          // Flatten groups from data.groups
          ordersList = data.groups.flatMap((g: any) => g.orders || []);
        } else if (Array.isArray(data?.data)) {
          // Direct array
          ordersList = data.data;
        } else if (Array.isArray(data)) {
          // Direct array at root
          ordersList = data;
        }

        setPurchasesData(ordersList);
        setTotalPurchasePages(data?.meta?.totalPages || 1);

        if (activePurchaseTab === "ALL") {
          setTotalPurchaseCount(data?.meta?.total || 0);
        }

        if (data?.groups) {
          setPurchaseCounts((prev) => {
            const newCounts = activePurchaseTab === "ALL" ? {} : { ...prev };
            data.groups.forEach((g: any) => {
              if (g.status?.key) {
                newCounts[g.status.key] = g.total || 0;
              }
            });
            return newCounts;
          });
        }
      } else {
        toast.error(apiRes?.message || "Failed to fetch purchases");
      }
    } catch (err) {
      console.error("Failed to fetch purchases:", err);
      toast.error("An error occurred while fetching purchases");
    } finally {
      setIsPurchasesLoading(false);
    }
  }, [customer?.id, currentPage, activePurchaseTab, purchaseTime]);

  React.useEffect(() => {
    fetchCartData();
  }, [fetchCartData]);

  React.useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleNotify = async () => {
    let finalMessage = "";
    if (notificationOption === "predefined") {
      finalMessage =
        "Notify customer to clear their cart before items run out of stock";
    } else if (notificationOption === "custom") {
      if (!customMessage.trim()) {
        toast.error("Please provide a custom message.");
        return;
      }
      finalMessage = customMessage;
    } else {
      toast.error("Please select a notification option.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await authenticatedFetch(
        `/admin/customers/${customer.id}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ message: finalMessage }),
        },
      );
      const apiRes = await parseApiResponse(res);
      if (apiRes?.success) {
        toast.success("Notification sent successfully");
        setIsNotifyOpen(false);
        setCustomMessage("");
        setNotificationOption(null);
      } else {
        toast.error(apiRes?.message || "Failed to send notification");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim() || !suspendNote.trim()) {
      toast.error("Reason and note are mandatory.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await authenticatedFetch(
        `/admin/customers/${customer.id}/suspend`,
        {
          method: "PATCH",
          body: JSON.stringify({
            reason: suspendReason.trim(),
            note: suspendNote.trim(),
          }),
        },
      );
      const apiRes = await parseApiResponse(res);
      if (apiRes?.success) {
        toast.success("Customer suspended successfully");
        setIsSuspendOpen(false);
        setSuspendReason("");
        setSuspendNote("");
        window.location.reload();
      } else {
        toast.error(apiRes?.message || "Failed to suspend customer");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnsuspend = async () => {
    setIsProcessing(true);
    try {
      const res = await authenticatedFetch(
        `/admin/customers/${customer.id}/unsuspend`,
        {
          method: "PATCH",
          body: JSON.stringify({}),
        },
      );
      const apiRes = await parseApiResponse(res);
      if (apiRes?.success) {
        toast.success("Customer unsuspended successfully");
        window.location.reload();
      } else {
        toast.error(apiRes?.message || "Failed to unsuspend customer");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleAccordion = (id: string) => {
    setExpandedPurchases((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "OUT_FOR_DELIVERY":
        return "bg-blue-100 text-blue-700";
      case "CANCELLED":
      case "REJECTED":
      case "PAYMENT_EXPIRED":
        return "bg-red-100 text-red-700";
      case "RETURNED":
        return "bg-orange-100 text-orange-700";
      case "READY_FOR_PICKUP":
        return "bg-pink-100 text-pink-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const formatStatusText = (status: string) => {
    return status.replace(/_/g, " ");
  };

  const getPaginationRange = () => {
    const range = [];
    if (totalPurchasePages <= 7) {
      for (let i = 1; i <= totalPurchasePages; i++) range.push(i);
    } else {
      if (currentPage <= 4) {
        range.push(1, 2, 3, 4, 5, "...", totalPurchasePages);
      } else if (currentPage >= totalPurchasePages - 3) {
        range.push(
          1,
          "...",
          totalPurchasePages - 4,
          totalPurchasePages - 3,
          totalPurchasePages - 2,
          totalPurchasePages - 1,
          totalPurchasePages,
        );
      } else {
        range.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPurchasePages,
        );
      }
    }
    return range;
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-1 hover:bg-slate-100 rounded text-slate-500"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {customer?.fullName || "Unknown Name"}
              </h1>
              <span
                className={cn(
                  "text-white font-bold px-2 py-0.5 rounded text-[10px]",
                  customer?.status === "ACTIVE" ? "bg-[#50C828]" : "bg-red-500",
                )}
              >
                {customer?.status || "UNKNOWN"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Registered on:{" "}
              {customer?.registeredAt
                ? format(
                    new Date(customer.registeredAt),
                    "do MMM, yyyy - h:mm a",
                  )
                : "Unknown"}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-9 text-xs border-slate-200 gap-2 font-bold text-slate-600 shadow-none"
            >
              More actions <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 p-1 rounded-xl shadow-xl border-slate-100"
          >
            <DropdownMenuItem
              onClick={() => setIsNotifyOpen(true)}
              className="gap-3 py-3 text-xs font-normal cursor-pointer"
            >
              <Mail size={16} className="text-slate-500" /> Notify Customer...
            </DropdownMenuItem>
            {customer?.isActive ? (
              <DropdownMenuItem
                onClick={() => setIsSuspendOpen(true)}
                className="gap-3 py-3 text-xs font-normal text-red-600 border-t border-slate-50 cursor-pointer focus:text-red-700"
              >
                <AlertCircle size={16} /> Suspend Customer
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={handleUnsuspend}
                className="gap-3 py-3 text-xs font-normal text-green-600 border-t border-slate-50 cursor-pointer focus:text-green-700"
              >
                <CheckCircle2 size={16} /> Unsuspend Customer
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <Card className="border-slate-200 shadow-none p-5 space-y-6">
            <h3 className="font-bold text-sm border-b pb-2 -mx-5 px-5">
              Customer information
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-[11px] font-bold text-slate-900 mb-2 uppercase tracking-wide">
                  Personal details
                </h4>
                <div className="space-y-1">
                  <p className="text-sm text-slate-600 font-medium">
                    {customer?.fullName || "N/A"}
                  </p>
                  <p className="text-sm text-blue-500 underline font-medium cursor-pointer">
                    {customer?.email || "N/A"}
                  </p>
                  <p className="text-sm text-slate-600 font-medium">
                    {customer?.phoneNumber || "N/A"}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-slate-900 mb-2 uppercase tracking-wide">
                  Shipping address
                </h4>
                <p className="text-sm text-slate-600 font-medium">
                  {customer?.shippingAddress
                    ? `${customer.shippingAddress.streetName}, ${customer.shippingAddress.city}${customer.shippingAddress.state ? `, ${customer.shippingAddress.state}` : ""}`
                    : "No address provided"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="mkt"
                  checked
                  className="data-[state=checked]:bg-[#E86B35] border-slate-300"
                />
                <label
                  htmlFor="mkt"
                  className="text-sm text-slate-600 font-medium cursor-pointer"
                >
                  Subscribe to email updates
                </label>
              </div>
            </div>
          </Card>

          <Card className="border-slate-200 shadow-none p-5">
            <h3 className="font-bold text-sm border-b pb-2 -mx-5 px-5 mb-4">
              Shopping Cart
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {isCartLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-[#E86B35]" />
                  <p className="text-xs text-slate-400 font-medium">
                    Loading cart items...
                  </p>
                </div>
              ) : cartData.length > 0 ? (
                cartData.map((cart) => (
                  <div key={cart.cartId} className="space-y-2">
                    {cart.items.map((item) => (
                      <div
                        key={item.menuItemId}
                        className="flex gap-4 p-3 border border-slate-100 rounded-xl bg-white"
                      >
                        <div className="w-14 h-14 bg-slate-50 rounded-lg flex-shrink-0 overflow-hidden border border-slate-100">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://placehold.co/100x100?text=Food";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {item.name}
                          </h4>
                          <p className="text-[10px] text-blue-500 underline font-medium truncate">
                            {cart.business.name}
                          </p>
                          <div className="flex justify-between items-end mt-2 font-bold">
                            <span className="text-[11px] text-slate-400">
                              X {item.quantity}
                            </span>
                            <span className="text-xs text-[#E86B35]">
                              ₦{(item.price / 100).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingBag className="text-slate-200 mb-3" size={32} />
                  <p className="text-xs font-bold text-slate-900">
                    Cart is empty
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[150px]">
                    This customer currently has no items in their shopping cart.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Purchases */}
        <div className="col-span-12 lg:col-span-7">
          <Card className="border-slate-200 shadow-none p-5 flex flex-col min-h-[600px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm">Purchases</h3>
              <Select
                value={purchaseTime}
                onValueChange={(val) => {
                  setPurchaseTime(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-36 h-8 text-[11px] font-bold border-slate-200 focus:ring-0">
                  <Calendar size={14} className="mr-2 text-slate-400" />
                  <SelectValue placeholder="Last 7 Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs
              value={activePurchaseTab}
              onValueChange={(val) => {
                setActivePurchaseTab(val);
                setCurrentPage(1);
              }}
              className="flex-1"
            >
              <div className="overflow-x-auto custom-scrollbar">
                <TabsList className="bg-transparent border-b border-slate-100 w-max min-w-full justify-start h-auto p-0 gap-6 rounded-none mb-6">
                  <TabsTrigger
                    value="ALL"
                    className="rounded-none border-0 border-b-2 border-transparent bg-transparent pb-3 font-bold text-[11px] data-[state=active]:border-[#E86B35] data-[state=active]:text-[#E86B35] text-slate-500 shadow-none"
                  >
                    All ({totalPurchaseCount})
                  </TabsTrigger>
                  <TabsTrigger
                    value="PENDING_CONFIRMATION"
                    className="rounded-none border-0 border-b-2 border-transparent bg-transparent pb-3 font-bold text-[11px] data-[state=active]:border-[#E86B35] data-[state=active]:text-[#E86B35] text-slate-500 shadow-none whitespace-nowrap"
                  >
                    Pending Confirmation (
                    {purchaseCounts["PENDING_CONFIRMATION"] || 0})
                  </TabsTrigger>
                  <TabsTrigger
                    value="OUT_FOR_DELIVERY"
                    className="rounded-none border-0 border-b-2 border-transparent bg-transparent pb-3 font-bold text-[11px] data-[state=active]:border-[#E86B35] data-[state=active]:text-[#E86B35] text-slate-500 shadow-none whitespace-nowrap"
                  >
                    Out for Delivery ({purchaseCounts["OUT_FOR_DELIVERY"] || 0})
                  </TabsTrigger>
                  <TabsTrigger
                    value="COMPLETED"
                    className="rounded-none border-0 border-b-2 border-transparent bg-transparent pb-3 font-bold text-[11px] data-[state=active]:border-[#E86B35] data-[state=active]:text-[#E86B35] text-slate-500 shadow-none"
                  >
                    Delivered ({purchaseCounts["COMPLETED"] || 0})
                  </TabsTrigger>
                  <TabsTrigger
                    value="CANCELLED"
                    className="rounded-none border-0 border-b-2 border-transparent bg-transparent pb-3 font-bold text-[11px] data-[state=active]:border-[#E86B35] data-[state=active]:text-[#E86B35] text-slate-500 shadow-none"
                  >
                    Cancelled ({purchaseCounts["CANCELLED"] || 0})
                  </TabsTrigger>
                  <TabsTrigger
                    value="RETURNED"
                    className="rounded-none border-0 border-b-2 border-transparent bg-transparent pb-3 font-bold text-[11px] data-[state=active]:border-[#E86B35] data-[state=active]:text-[#E86B35] text-slate-500 shadow-none whitespace-nowrap"
                  >
                    Returned & Refunded ({purchaseCounts["RETURNED"] || 0})
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="space-y-3">
                {isPurchasesLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-[#E86B35]" />
                    <p className="text-xs text-slate-400 font-medium">
                      Loading purchases...
                    </p>
                  </div>
                ) : purchasesData.length > 0 ? (
                  purchasesData.map((p) => {
                    const orderId = p.orderId || p.orderCode;
                    return (
                      <div
                        key={orderId}
                        className="border border-slate-100 rounded-lg overflow-hidden"
                      >
                        <div className="p-4 flex justify-between bg-white items-start">
                          <div>
                            <p className="text-xs font-bold text-blue-500">
                              {p.orderCode || orderId}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              Created on{" "}
                              {p.placedAt
                                ? format(new Date(p.placedAt), "do MMM, yyyy")
                                : "Unknown date"}
                              .
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold">
                              ₦
                              {(
                                Number(p.totalAmount || 0) / 100
                              ).toLocaleString()}
                            </p>
                            <span
                              className={cn(
                                "font-bold px-2 py-0.5 rounded text-[9px] uppercase mt-1 inline-block whitespace-nowrap",
                                getStatusColor(p.status?.key || p.status),
                              )}
                            >
                              {p.status?.label ||
                                formatStatusText(p.status || "UNKNOWN")}
                            </span>
                          </div>
                        </div>

                        {/* Collapse Button (Before Expanded Section) */}
                        <div className="px-4 py-2 bg-[#F8FAFC] border-t border-slate-50 flex justify-between items-center">
                          <p className="text-[10px] text-slate-500 font-bold">
                            Includes {p.items?.length || 0} product
                            {p.items?.length !== 1 ? "s" : ""} from{" "}
                            {p.business?.name || "Vendor"}
                          </p>
                          <button
                            onClick={() => toggleAccordion(orderId)}
                            className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5 hover:text-[#E86B35]"
                          >
                            {expandedPurchases.includes(orderId)
                              ? "Collapse"
                              : "Expand"}
                            {expandedPurchases.includes(orderId) ? (
                              <ChevronUp size={12} />
                            ) : (
                              <ChevronDown size={12} />
                            )}
                          </button>
                        </div>

                        {/* Expanded Details Section */}
                        {expandedPurchases.includes(orderId) && (
                          <div className="px-4 pb-4 bg-white border-t border-slate-50 animate-in fade-in slide-in-from-top-1 duration-200">
                            {(p.items || []).map((item: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0"
                              >
                                <div className="flex gap-3 items-center">
                                  <div className="w-10 h-10 bg-slate-100 rounded-md flex-shrink-0 overflow-hidden border border-slate-100">
                                    <img
                                      src={item.imageUrl || item.image}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          "https://placehold.co/100x100?text=Food";
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-bold text-slate-900">
                                      {item.name}
                                    </p>
                                    <p className="text-[10px] text-blue-500 underline font-medium">
                                      {p.business?.name || "Vendor"}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[11px] font-bold text-slate-900">
                                    ₦
                                    {(
                                      (item.totalPrice || item.price || 0) / 100
                                    ).toLocaleString()}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-bold">
                                    X {item.quantity || 1}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <ShoppingBag className="text-slate-300" size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-900">
                      No purchases found
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 text-center max-w-[200px]">
                      There are no items in this category for the selected
                      timeframe.
                    </p>
                  </div>
                )}
              </div>
            </Tabs>

            {/* PURCHASE PAGINATION */}
            {totalPurchasePages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-slate-50">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1 || isPurchasesLoading}
                  className={cn(
                    "p-1.5 rounded hover:bg-slate-100 text-slate-400 transition-colors",
                    currentPage > 1 && "text-slate-600",
                  )}
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-1.5">
                  {getPaginationRange().map((page, idx) => (
                    <button
                      key={idx}
                      disabled={isPurchasesLoading}
                      onClick={() =>
                        typeof page === "number" && setCurrentPage(page)
                      }
                      className={cn(
                        "min-w-[32px] h-8 text-[11px] font-bold rounded-md transition-all",
                        currentPage === page
                          ? "border-2 border-[#E86B35] text-[#E86B35]"
                          : "text-slate-500 hover:bg-slate-50",
                        typeof page !== "number" &&
                          "cursor-default hover:bg-transparent",
                      )}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(totalPurchasePages, prev + 1),
                    )
                  }
                  disabled={
                    currentPage === totalPurchasePages || isPurchasesLoading
                  }
                  className={cn(
                    "p-1.5 rounded hover:bg-slate-100 text-slate-400 transition-colors",
                    currentPage < totalPurchasePages && "text-slate-600",
                  )}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            <div className="text-center mt-12 mb-4">
              <p className="text-[11px] text-slate-400 font-medium">
                Want to know more about this customer?
              </p>
              <button
                onClick={() => setIsLogsOpen(true)}
                className="text-[11px] text-blue-600 font-bold hover:underline transition-all"
              >
                View activity logs.
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Notify Modal */}
      <CustomDialog
        isOpen={isNotifyOpen}
        onClose={() => {
          setIsNotifyOpen(false);
          setNotificationOption(null);
          setCustomMessage("");
        }}
        title="Notify Customer..."
      >
        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-600">
            Send a <span className="font-bold text-slate-900">Email</span>{" "}
            notification to{" "}
            <span className="font-bold text-slate-900">
              {customer?.fullName}
            </span>
            :
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 border border-slate-100 rounded-lg bg-slate-50/30">
              <Checkbox
                id="n1"
                checked={notificationOption === "predefined"}
                onCheckedChange={() => setNotificationOption("predefined")}
                className="mt-0.5 data-[state=checked]:bg-[#E86B35] border-slate-300"
              />
              <label
                htmlFor="n1"
                className="text-xs font-bold text-slate-700 cursor-pointer leading-tight"
              >
                Notify customer to clear their cart before items run out of
                stock
              </label>
            </div>
            <div className="flex items-start gap-3 p-4 border border-slate-100 rounded-lg bg-slate-50/30">
              <Checkbox
                id="n2"
                checked={notificationOption === "custom"}
                onCheckedChange={() => setNotificationOption("custom")}
                className="mt-0.5 data-[state=checked]:bg-[#E86B35] border-slate-300"
              />
              <label
                htmlFor="n2"
                className="text-xs font-bold text-slate-700 cursor-pointer"
              >
                Custom Message
              </label>
            </div>
            {notificationOption === "custom" && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="text-xs border-slate-200 min-h-[100px] focus-visible:ring-1 focus-visible:ring-[#E86B35] focus:border-[#E86B35]"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsNotifyOpen(false)}
              className="h-10 text-xs font-bold rounded-lg px-6 border-slate-200 text-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleNotify}
              disabled={isProcessing}
              className="h-10 text-xs font-bold bg-[#E86B35] hover:bg-[#d15d2c] text-white rounded-lg px-6 shadow-lg shadow-orange-100/50"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Send Message
            </Button>
          </div>
        </div>
      </CustomDialog>

      {/* Suspend Modal */}
      <CustomDialog
        isOpen={isSuspendOpen}
        onClose={() => {
          if (!isProcessing) {
            setIsSuspendOpen(false);
            setSuspendReason("");
            setSuspendNote("");
          }
        }}
        title="Suspend Customer"
      >
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <div className="space-y-1">
                <p className="text-sm font-bold text-red-900">
                  Suspension Action
                </p>
                <p className="text-xs text-red-700 leading-relaxed">
                  Suspending this customer will prevent them from placing new
                  orders or accessing their account until unsuspended.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Reason for Suspension
                </label>
                <Select value={suspendReason} onValueChange={setSuspendReason}>
                  <SelectTrigger className="w-full h-11 border-slate-200 bg-white text-sm focus:ring-[#E86B35]">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent className="z-[150]">
                    <SelectItem value="Repeated cancellation of orders">
                      Repeated cancellation of orders
                    </SelectItem>
                    <SelectItem value="Fraudulent activity detected">
                      Fraudulent activity detected
                    </SelectItem>
                    <SelectItem value="Payment issues/disputes">
                      Payment issues/disputes
                    </SelectItem>
                    <SelectItem value="Inappropriate behavior/harassment">
                      Inappropriate behavior/harassment
                    </SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Administrative Note
                </label>
                <Textarea
                  value={suspendNote}
                  onChange={(e) => setSuspendNote(e.target.value)}
                  placeholder="Provide detailed internal notes about this suspension..."
                  className="min-h-[120px] border-slate-200 focus:border-[#E86B35] focus:ring-[#E86B35] text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              disabled={isProcessing}
              onClick={() => setIsSuspendOpen(false)}
              className="h-11 px-8 text-xs font-bold border-slate-200 text-slate-600 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              disabled={isProcessing || !suspendReason || !suspendNote.trim()}
              onClick={handleSuspend}
              className="h-11 px-8 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-100/50"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm Suspension
            </Button>
          </div>
        </div>
      </CustomDialog>

      {/* Activity Logs Modal */}
      <CustomDialog
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        title="Activity logs"
      >
        <div className="p-5 space-y-5 bg-white">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search logs by name or action"
                className="w-full pl-9 h-10 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#E86B35] transition-colors"
              />
            </div>
            <Select value={logTime} onValueChange={setLogTime}>
              <SelectTrigger className="w-36 h-10 text-xs font-bold border-slate-200 focus:ring-0">
                <Calendar size={14} className="mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-xl">
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-6 pt-4 pb-6 max-h-[400px] overflow-y-auto custom-scrollbar">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Tuesday, 28 Sep 2024
            </h4>
            <div className="relative pl-6 space-y-8 before:absolute before:left-[3px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-100">
              {[
                {
                  time: "12:00 PM",
                  text: "Order #1054 delivered by Courier (Ibrahim Lookman).",
                },
                {
                  time: "01:10 PM",
                  text: "Customer logged in from a new device (IP: 192.168.1.2).",
                },
                {
                  time: "01:15 PM",
                  text: "Account activated by admin (Mandy Lastina).",
                },
                {
                  time: "02:30 PM",
                  text: "Order #1054 shipped via Courier XYZ.",
                },
              ]
                .filter((l) =>
                  l.text.toLowerCase().includes(logSearch.toLowerCase()),
                )
                .map((log, i) => (
                  <div
                    key={i}
                    className="relative flex gap-4 animate-in slide-in-from-left-1 duration-200"
                  >
                    <div className="absolute -left-[27.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white shadow-sm" />
                    <span className="text-[11px] font-bold text-slate-900 w-16">
                      {log.time}:
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium leading-relaxed">
                      {log.text}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </CustomDialog>
    </div>
  );
}
