"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  RotateCcw,
  Calendar as CalendarIcon,
  ChevronDown,
  Search,
  Download,
  Filter,
  X,
  MoreHorizontal,
  Eye,
  EyeOff,
  MessageSquare,
  UserPlus,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import Image from "next/image";

// API Types
interface OrderStatus {
  key: string;
  label: string;
}

interface OrderItem {
  name: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PaymentStatus {
  key: string;
  label: string;
}

interface OrderLink {
  rel: string;
  method: string;
  href: string;
  label?: string;
  targetStatus?: OrderStatus;
}

interface StatusTransition {
  key: string;
  label: string;
}

interface ApiOrder {
  orderId: string;
  orderCode: string;
  createdAt: string;
  customerName: string;
  businessName: string;
  status: OrderStatus;
  availableStatusTransitions: StatusTransition[];
  links: OrderLink[];
  paymentStatus: PaymentStatus | null;
  totalAmount: number;
  items: OrderItem[];
}

interface OrderGroup {
  status: OrderStatus;
  total: number;
  orders: ApiOrder[];
}

interface OrdersResponse {
  success: boolean;
  statusCode: number;
  data: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    groups: OrderGroup[];
  };
}

// Status key to UI label mapping
const statusKeyToLabel: Record<string, string> = {
  pending_payment: "Pending payment",
  payment_expired: "Payment expired",
  pending_confirmation: "Awaiting confirmation",
  preparing: "Preparing",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
  returned: "Returned",
};

// Tab labels matching API status keys
const tabLabels = [
  { label: "All", key: "all" },
  { label: "Pending Payment", key: "pending_payment" },
  { label: "Payment Expired", key: "payment_expired" },
  { label: "Awaiting Confirmation", key: "pending_confirmation" },
  { label: "Preparing", key: "preparing" },
  { label: "Ready for Pickup", key: "ready_for_pickup" },
  { label: "Out for Delivery", key: "out_for_delivery" },
  { label: "Delivered", key: "completed" },
  { label: "Cancelled", key: "cancelled" },
  { label: "Rejected", key: "rejected" },
  { label: "Returned", key: "returned" },
];

interface Order {
  id: string;
  orderId: string;
  date: string;
  customer: string;
  vendor: string;
  status: string;
  amount: string;
  products: {
    name: string;
    qty: number;
    price: string;
    category: string;
    image: string;
  }[];
  shippingAddress?: string;
  paymentStatus: string;
}

interface Courier {
  id: string;
  name: string;
  locations: string;
  status: "available" | "busy";
  assignments: number;
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
          "relative w-full bg-white shadow-xl overflow-hidden rounded animate-in zoom-in-95 duration-200",
          maxWidth,
        )}
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
        <div className="p-6">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filters
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [amountQuery, setAmountQuery] = useState("");
  const [dateRange, setDateRange] = useState<string>("");

  // API Data
  const [ordersData, setOrdersData] = useState<OrdersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [notifyVendorOpen, setNotifyVendorOpen] = useState(false);
  const [notifyCustomerOpen, setNotifyCustomerOpen] = useState(false);
  const [assignCourierOpen, setAssignCourierOpen] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<
    string | null
  >(null);
  const [notificationOption, setNotificationOption] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [courierTab, setCourierTab] = useState<"all" | "unassigned">(
    "unassigned",
  );
  const [courierSearch, setCourierSearch] = useState("");

  // Cancel Order Modal State
  const [cancelOrderOpen, setCancelOrderOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelPassword, setCancelPassword] = useState("");
  const [cancelPasswordError, setCancelPasswordError] = useState<string | null>(
    null,
  );
  const [showCancelPassword, setShowCancelPassword] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", itemsPerPage.toString());

      if (dateRange) {
        params.set("range", dateRange);
      }

      if (startDate && endDate) {
        params.set("startDate", startDate.toISOString());
        params.set("endDate", endDate.toISOString());
      }

      if (paymentStatus !== "all") {
        params.set("paymentStatus", paymentStatus);
      }

      if (amountQuery) {
        const amount = parseFloat(amountQuery);
        if (!isNaN(amount)) {
          params.set("amount", amount.toString());
        }
      }

      const res = await authenticatedFetch(
        `/admin/orders?${params.toString()}`,
      );
      const apiRes = await parseApiResponse(res);

      if (!apiRes?.success) {
        setError(apiRes?.message || "Failed to fetch orders");
        return;
      }

      setOrdersData(apiRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    dateRange,
    startDate,
    endDate,
    paymentStatus,
    amountQuery,
  ]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, paymentStatus, startDate, endDate, amountQuery, dateRange]);

  // Convert API orders to UI format
  const allOrders: Order[] = useMemo(() => {
    if (!ordersData?.data?.groups) return [];

    const orders: Order[] = [];
    for (const group of ordersData.data.groups) {
      for (const apiOrder of group.orders) {
        orders.push({
          id: apiOrder.orderCode,
          orderId: apiOrder.orderId,
          date: new Date(apiOrder.createdAt).toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          }),
          customer: apiOrder.customerName,
          vendor: apiOrder.businessName,
          status:
            statusKeyToLabel[apiOrder.status.key] || apiOrder.status.label,
          amount: `₦${apiOrder.totalAmount.toLocaleString("en-NG")}`,
          paymentStatus: apiOrder.paymentStatus?.key || "unknown",
          products: apiOrder.items.map((item) => ({
            name: item.name,
            qty: item.quantity,
            price: `₦${item.totalPrice.toLocaleString("en-NG")}`,
            category: "",
            image: item.imageUrl,
          })),
        });
      }
    }
    return orders;
  }, [ordersData]);

  // Build dynamic tabs from API response
  const tabs = useMemo(() => {
    if (!ordersData?.data?.groups) {
      return [{ label: "All", key: "all", count: 0 }];
    }

    const groups = ordersData.data.groups;
    const total = groups.reduce((sum, g) => sum + g.total, 0);

    // Build tabs from API groups - only show statuses that have orders
    const apiTabs = groups
      .filter((g) => g.total > 0)
      .map((g) => ({
        label: g.status.label,
        key: g.status.key,
        count: g.total,
      }));

    // Always show "All" first
    return [{ label: "All", key: "all", count: total }, ...apiTabs];
  }, [ordersData]);

  // Map tab label to status key for filtering
  const labelToStatusKey: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = { All: "all" };
    for (const tab of tabs) {
      map[tab.label] = tab.key;
    }
    return map;
  }, [tabs]);

  useEffect(() => {
    setActiveTab("All");
    setCurrentPage(1);
  }, [searchQuery, paymentStatus, startDate, endDate, amountQuery, dateRange]);

  // Apply search and tab filter client-side
  const filteredOrders = useMemo(() => {
    if (!allOrders.length) return [];

    let result = allOrders;

    // Filter by active tab
    if (activeTab !== "All") {
      const targetStatusKey = labelToStatusKey[activeTab];
      if (targetStatusKey) {
        result = result.filter((order) => {
          const orderStatusKey = Object.entries(statusKeyToLabel).find(
            ([, label]) => label === order.status,
          )?.[0];
          return orderStatusKey === targetStatusKey;
        });
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((order) =>
        [
          order.id,
          order.customer,
          order.vendor,
          order.status,
          order.amount,
        ].some((field) => field.toLowerCase().includes(query)),
      );
    }

    return result;
  }, [allOrders, searchQuery, activeTab, labelToStatusKey]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const displayedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const gridLayout = "grid grid-cols-[160px_1fr_1fr_1fr_150px_130px_60px]";

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Payment expired":
        return "bg-red-100 text-red-700";
      case "Out for delivery":
        return "bg-blue-100 text-blue-700";
      case "Delivered":
        return "bg-green-100 text-green-700";
      case "Cancelled":
        return "bg-gray-100 text-gray-700";
      case "Rejected":
        return "bg-orange-100 text-orange-700";
      case "Pending payment":
        return "bg-yellow-100 text-yellow-700";
      case "Awaiting confirmation":
        return "bg-purple-100 text-purple-700";
      case "Preparing":
        return "bg-indigo-100 text-indigo-700";
      case "Ready for pickup":
        return "bg-pink-100 text-pink-700";
      case "Returned":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-[#FDB022] text-white";
    }
  };

  // Mock couriers for now - would come from API
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

  const handleCancelOrderClick = (orderId: string, orderDbId: string) => {
    setCancelOrderId(orderDbId);
    setCancelReason("");
    setCancelPassword("");
    setCancelOrderOpen(true);
  };

  const handleBulkCancelOrderClick = () => {
    if (selectedOrders.length === 1) {
      // Find the order's orderId
      const order = allOrders.find((o) => o.id === selectedOrders[0]);
      if (order) {
        handleCancelOrderClick(order.id, order.orderId);
      }
    } else if (selectedOrders.length > 1) {
      toast.error(
        "Bulk cancellation is not supported. Please cancel one order at a time.",
      );
    }
  };

  const submitCancelOrder = async () => {
    // Client-side validation
    setCancelPasswordError(null);

    if (!cancelOrderId) {
      toast.error("No order selected");
      return;
    }

    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    if (!cancelPassword.trim()) {
      setCancelPasswordError("Password is required");
      return;
    }

    // Password validation (same as login)
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(cancelPassword)) {
      setCancelPasswordError(
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
      );
      return;
    }

    setIsCancelling(true);

    try {
      // Use direct fetch instead of authenticatedFetch to handle 401 properly
      // (401 here means wrong password, not token expiration)
      const token =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("accessToken") || "{}").value
          : null;

      const API_BASE = process.env.NEXT_PUBLIC_BASE_URL || "";
      const API_KEY = process.env.NEXT_PUBLIC_MUNCHSPACE_API_KEY || "";

      const response = await fetch(
        `${API_BASE}/admin/orders/${cancelOrderId}/cancel`,
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

      // Handle 401 Unauthorized - incorrect password
      if (response.status === 401) {
        setCancelPasswordError("Incorrect password");
        setIsCancelling(false);
        return;
      }

      if (result?.success) {
        toast.success("Order cancelled successfully");
        setCancelOrderOpen(false);
        setCancelOrderId(null);
        setCancelReason("");
        setCancelPassword("");
        setCancelPasswordError(null);

        // Clear selection if the cancelled order was selected
        setSelectedOrders((prev) => prev.filter((id) => id !== cancelOrderId));

        // Refresh orders list
        fetchOrders();
      } else {
        // Show the error message from the API response
        const errorMessage =
          result?.error || result?.message || "Failed to cancel order";
        toast.error(errorMessage);
      }
    } catch (err) {
      toast.error("An error occurred while cancelling the order");
    } finally {
      setIsCancelling(false);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (currentPage > 3) pages.push("...");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push("...");

    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  return (
    <div className="p-8 bg-[#F9FAFB] min-h-screen overflow-auto">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading...
              </span>
            ) : error ? (
              <span className="text-red-500">{error}</span>
            ) : (
              `Total (${ordersData?.data?.total || filteredOrders.length})`
            )}
          </h1>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="border border-gray-200 bg-white rounded-md"
              onClick={() => fetchOrders()}
              disabled={isLoading}
            >
              <RotateCcw
                size={18}
                className={isLoading ? "animate-spin" : ""}
              />
            </Button>
            <Select
              value={dateRange || "all"}
              onValueChange={(val) => {
                setDateRange(val === "all" ? "" : val);
                setStartDate(undefined);
                setEndDate(undefined);
              }}
            >
              <SelectTrigger className="w-[180px] gap-2 border-gray-200 text-gray-700 rounded-md font-normal h-10">
                <CalendarIcon size={18} className="text-gray-400" />
                <SelectValue placeholder="Last 30 days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last_7_days">Last 7 days</SelectItem>
                <SelectItem value="last_week">Last week</SelectItem>
                <SelectItem value="last_30_days">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border border-gray-200 rounded-md p-6 shadow-sm space-y-6 bg-white">
          {/* Search + Filter Bar */}
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
              <Button
                variant={isFilterOpen ? "default" : "outline"}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filter {isFilterOpen && <X className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Filters */}
          {isFilterOpen && (
            <div className="border-b pb-6 space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 px-3 h-10 bg-gray-50 border rounded-md text-sm text-gray-600">
                  <Filter size={16} /> Filter
                </div>

                <Select
                  value={dateRange || "all"}
                  onValueChange={(val) => {
                    setDateRange(val === "all" ? "" : val);
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="last_7_days">Last 7 days</SelectItem>
                    <SelectItem value="last_week">Last week</SelectItem>
                    <SelectItem value="last_30_days">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="INITIATED">Initiated</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Amount (₦)"
                  value={amountQuery}
                  onChange={(e) => setAmountQuery(e.target.value)}
                  className="w-[180px]"
                />

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[200px] justify-start"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate
                        ? format(startDate, "dd/MM/yyyy")
                        : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[200px] justify-start"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        if (startDate && date && date < startDate) {
                          toast.error("End date cannot be before start date");
                          return;
                        }
                        setEndDate(date);
                      }}
                      initialFocus
                      disabled={(date) =>
                        startDate ? date < startDate : false
                      }
                    />
                  </PopoverContent>
                </Popover>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setPaymentStatus("all");
                    setStartDate(undefined);
                    setEndDate(undefined);
                    setAmountQuery("");
                    setDateRange("");
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Clear
                </Button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-6 border-b overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={cn(
                  "pb-3 text-sm font-medium relative whitespace-nowrap",
                  activeTab === tab.label
                    ? "text-[#E86B35] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#E86B35]"
                    : "text-gray-500 hover:text-gray-700",
                )}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm">
              Selected: <strong>{selectedOrders.length}</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedOrders.length}
            >
              Mark Order As...
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedOrders.length}
              onClick={() => setNotifyVendorOpen(true)}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                className="w-4 h-4 mr-2"
                alt="WA"
              />
              Notify Vendor...
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedOrders.length}
              onClick={() => setNotifyCustomerOpen(true)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Notify Customer...
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedOrders.length}
              onClick={() => setAssignCourierOpen(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Assign Courier
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-400 border-gray-100"
              disabled={!selectedOrders.length}
              onClick={handleBulkCancelOrderClick}
            >
              Cancel Order
            </Button>
          </div>

          {/* Table Header */}
          <div className="space-y-0 border border-gray-200 rounded-md overflow-hidden">
            <div
              className={cn(
                gridLayout,
                "bg-[#F9FAFB] text-gray-900 border-b border-gray-200 text-sm font-medium",
              )}
            >
              <div className="flex items-center gap-3 border-r border-gray-200 py-3 pl-4">
                <Checkbox
                  className="rounded-sm"
                  onCheckedChange={(checked) =>
                    setSelectedOrders(
                      checked ? displayedOrders.map((o) => o.id) : [],
                    )
                  }
                />
                Order ID
              </div>
              <div className="py-3 pl-4 border-r border-gray-200">
                Date Created
              </div>
              <div className="py-3 pl-4 border-r border-gray-200">
                Customer Name
              </div>
              <div className="py-3 pl-4 border-r border-gray-200">
                Vendor Name
              </div>
              <div className="py-3 pl-4 border-r border-gray-200">Status</div>
              <div className="py-3 pl-4 border-r border-gray-200">
                Total Amount
              </div>
              <div className="flex justify-center items-center py-3">-</div>
            </div>

            {/* Table Rows */}
            {displayedOrders.map((order) => {
              const isExpanded = expandedRows.includes(order.id);
              return (
                <div
                  key={order.id}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <div
                    className={cn(gridLayout, "text-sm items-stretch bg-white")}
                  >
                    <div className="flex items-center gap-3 border-r border-gray-100 py-4 pl-4">
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={(c) =>
                          setSelectedOrders((p) =>
                            c
                              ? [...p, order.id]
                              : p.filter((i) => i !== order.id),
                          )
                        }
                        className="rounded-sm"
                      />
                      <span className="text-gray-600 font-normal">
                        {order.id}
                      </span>
                    </div>
                    <div className="flex items-center pl-4 text-gray-500 border-r border-gray-100 truncate">
                      {order.date}
                    </div>
                    <div className="flex items-center pl-4 text-gray-900 border-r border-gray-100">
                      {order.customer}
                    </div>
                    <div className="flex items-center pl-4 text-gray-500 border-r border-gray-100 truncate">
                      {order.vendor}
                    </div>
                    <div className="flex items-center border-r border-gray-100 px-4">
                      <span
                        className={cn(
                          "px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap w-full text-center",
                          getStatusColor(order.status),
                        )}
                      >
                        {order.status.slice(0, 14) +
                          (order.status.length > 14 ? "..." : "")}
                      </span>
                    </div>
                    <div className="flex items-center pl-4 text-gray-900 border-r border-gray-100 font-medium">
                      {order.amount}
                    </div>
                    <div className="flex justify-center items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal
                              size={18}
                              className="text-gray-400"
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="rounded-md w-48"
                        >
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/orders/${order.id.replace("#", "")}`}
                              className="flex items-center gap-2 py-2.5 w-full"
                            >
                              <Eye size={16} /> View More Info
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 py-2.5 text-green-600"
                            onClick={() => {
                              setSelectedOrderForAction(order.id);
                              setNotifyVendorOpen(true);
                            }}
                          >
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                              className="w-4 h-4"
                              alt=""
                            />
                            Notify Vendor...
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 py-2.5 text-blue-500"
                            onClick={() => {
                              setSelectedOrderForAction(order.id);
                              setNotifyCustomerOpen(true);
                            }}
                          >
                            <MessageSquare size={16} /> Notify Customer...
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 py-2.5">
                            <CheckCircle2 size={16} /> Mark Order as...
                          </DropdownMenuItem>
                          <div className="h-px bg-gray-100 my-1" />
                          <DropdownMenuItem
                            className="gap-2 py-2.5 text-red-500"
                            onClick={() =>
                              handleCancelOrderClick(order.id, order.orderId)
                            }
                          >
                            <Ban size={16} /> Cancel Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Expanded Products */}
                  <div
                    className={cn(
                      "transition-all duration-200",
                      isExpanded
                        ? "bg-[#F9FAFB] border-t border-gray-100"
                        : "bg-white",
                    )}
                  >
                    <div className="p-3 px-4">
                      <div className="flex justify-between items-center text-[13px] text-gray-500">
                        <span className="pl-1">
                          Includes {order.products.length} product
                          {order.products.length !== 1 ? "s" : ""}
                        </span>
                        <button
                          onClick={() =>
                            setExpandedRows((prev) =>
                              prev.includes(order.id)
                                ? prev.filter((r) => r !== order.id)
                                : [...prev, order.id],
                            )
                          }
                          className="flex items-center gap-1 text-gray-900 font-medium hover:underline"
                        >
                          {isExpanded ? "Collapse" : "Expand"}{" "}
                          <ChevronDown
                            size={16}
                            className={cn(
                              "transition-transform",
                              isExpanded && "rotate-180",
                            )}
                          />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-6 space-y-8 pb-6 animate-in fade-in slide-in-from-top-1 duration-200">
                          {order.products.map((p, idx) => (
                            <div
                              key={idx}
                              className="flex items-start justify-between max-w-4xl mx-auto px-10"
                            >
                              <div className="flex gap-4">
                                <div className="h-14 w-14 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                                  <Image
                                    src={p.image}
                                    alt={p.name}
                                    width={300}
                                    height={250}
                                    className="h-full w-full object-cover"
                                    priority
                                  />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-sm font-medium text-gray-900 leading-tight">
                                    {p.name}
                                  </h4>
                                  <p className="text-xs text-blue-500 hover:underline cursor-pointer font-medium">
                                    {p.category}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">
                                  {p.price}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1 font-bold">
                                  × {p.qty}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-6 text-sm border-t pt-6">
            <p className="text-gray-500">
              Total{" "}
              <span className="text-gray-900 font-medium">
                {filteredOrders.length} items
              </span>
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={18} />
              </Button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, i) => (
                  <Button
                    key={i}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 w-8 rounded font-medium min-w-[32px]",
                      currentPage === page
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "text-gray-500 hover:bg-gray-100",
                      typeof page === "string" &&
                        "cursor-default hover:bg-transparent",
                    )}
                    disabled={typeof page === "string"}
                    onClick={() =>
                      typeof page === "number" && setCurrentPage(page)
                    }
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                <ChevronRight size={18} />
              </Button>
            </div>

            <Select
              value={itemsPerPage.toString()}
              onValueChange={(v) => {
                setItemsPerPage(Number(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[110px] h-10 bg-gray-50 border-gray-200 text-xs font-medium rounded">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Notify Vendor Modal */}
      <CustomModal
        isOpen={notifyVendorOpen}
        onClose={() => {
          setNotifyVendorOpen(false);
          setNotificationOption("");
          setCustomMessage("");
        }}
        title="Notify Vendor..."
        maxWidth="sm:max-w-[580px]"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setNotifyVendorOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={!notificationOption}
              onClick={() => {
                toast.success("Notification sent to vendor");
                setNotifyVendorOpen(false);
                setNotificationOption("");
                setCustomMessage("");
              }}
            >
              Send Message
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-700 mb-4">
              Send a WhatsApp notification message to:{" "}
              <span className="font-medium">
                {selectedOrderForAction
                  ? allOrders.find((o) => o.id === selectedOrderForAction)
                      ?.vendor
                  : "Selected vendors"}
              </span>
            </p>

            <div className="space-y-3">
              {[
                { id: "new-order", label: "Notify of New Order Alert" },
                {
                  id: "prepare",
                  label: `Prepare Order ${selectedOrderForAction || "#XXXX"} for Pickup`,
                },
                {
                  id: "cancel",
                  label: `Inform About Order ${selectedOrderForAction || "#XXXX"} Cancellation`,
                },
                { id: "custom", label: "Custom Message" },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="notify-option"
                    checked={notificationOption === opt.id}
                    onChange={() => setNotificationOption(opt.id)}
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-800">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {notificationOption === "custom" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Type here..."
                rows={4}
                className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}
        </div>
      </CustomModal>

      {/* Notify Customer Modal */}
      <CustomModal
        isOpen={notifyCustomerOpen}
        onClose={() => {
          setNotifyCustomerOpen(false);
          setNotificationOption("");
          setCustomMessage("");
        }}
        title="Notify Customer..."
        maxWidth="sm:max-w-[580px]"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setNotifyCustomerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={!notificationOption}
              onClick={() => {
                toast.success("Notification sent to customer");
                setNotifyCustomerOpen(false);
                setNotificationOption("");
                setCustomMessage("");
              }}
            >
              Send Message
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-700 mb-4">
              Send a WhatsApp notification message to the customer:
            </p>
            <div className="space-y-3">
              {[
                { id: "order-confirmed", label: "Order Confirmed" },
                { id: "on-the-way", label: "Order is on the way" },
                { id: "delivered", label: "Order Delivered" },
                { id: "cancelled", label: "Order Cancelled" },
                { id: "custom", label: "Custom Message" },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="notify-customer"
                    checked={notificationOption === opt.id}
                    onChange={() => setNotificationOption(opt.id)}
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-800">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {notificationOption === "custom" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Type here..."
                rows={4}
                className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}
        </div>
      </CustomModal>

      {/* Assign Courier Modal */}
      <CustomModal
        isOpen={assignCourierOpen}
        onClose={() => setAssignCourierOpen(false)}
        title={
          selectedOrderForAction
            ? allOrders
                .find((o) => o.id === selectedOrderForAction)
                ?.status.includes("delivery")
              ? "Assign Couriers for Order Delivery"
              : "Assign Couriers for Order Pick-Up"
            : "Assign Couriers"
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
              {selectedOrderForAction
                ? allOrders.find((o) => o.id === selectedOrderForAction)
                    ?.shippingAddress
                : "No order selected"}
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
            setCancelOrderId(null);
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
                setCancelOrderId(null);
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
              <span className="font-medium">{cancelOrderId}</span>.
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
    </div>
  );
}
