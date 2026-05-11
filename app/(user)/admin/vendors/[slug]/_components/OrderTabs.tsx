"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  PackageSearch,
  Loader2,
  X,
  Download,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import { format } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const TABS = [
  { label: "All", key: "all" },
  { label: "Pending Payment", key: "PENDING_PAYMENT" },
  { label: "Awaiting Confirmation", key: "PENDING_CONFIRMATION" },
  { label: "Preparing", key: "PREPARING" },
  { label: "Ready for Pickup", key: "READY_FOR_PICKUP" },
  { label: "Out for Delivery", key: "OUT_FOR_DELIVERY" },
  { label: "Delivered", key: "COMPLETED" },
  { label: "Cancelled", key: "CANCELLED" },
  { label: "Rejected", key: "REJECTED" },
  { label: "Returned", key: "RETURNED" },
];

export default function OrdersTab({ businessId }: { businessId?: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filters
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [amountQuery, setAmountQuery] = useState("");
  const [dateRange, setDateRange] = useState<string>("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusGroups, setStatusGroups] = useState<any[]>([]);

  const fetchOrders = useCallback(async () => {
    if (!businessId) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        businessId: businessId,
      });

      if (activeTab !== "all") {
        params.append("status", activeTab);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
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
      
      if (dateRange !== "all" && dateRange !== "" && dateRange !== "custom") {
        params.set("range", dateRange);
      } else if (startDate && endDate) {
        params.set("startDate", startDate.toISOString());
        params.set("endDate", endDate.toISOString());
      }

      const res = await authenticatedFetch(`/admin/orders?${params.toString()}`);
      const apiRes = await parseApiResponse(res);
      console.log(apiRes);

      if (apiRes?.success) {
        const fetchedOrders = apiRes.data.groups.flatMap((g: any) => g.orders);
        setOrders(fetchedOrders);
        setTotalOrders(apiRes.data.total || 0);
        setTotalPages(apiRes.data.totalPages || 1);
        setStatusGroups(apiRes.data.groups || []);
      } else {
        toast.error(apiRes?.message || "Failed to fetch orders");
      }
    } catch (err) {
      toast.error("An error occurred while fetching orders");
    } finally {
      setIsLoading(false);
    }
  }, [
    businessId,
    currentPage,
    itemsPerPage,
    activeTab,
    searchQuery,
    paymentStatus,
    amountQuery,
    dateRange,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, paymentStatus, amountQuery, dateRange, startDate, endDate]);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) pages.push(1, 2, 3, 4, 5, "...", totalPages);
      else if (currentPage > totalPages - 4)
        pages.push(
          1,
          "...",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      else
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
    }
    return pages;
  };

  const getTabCount = (key: string) => {
    if (key === "all") return totalOrders;
    const group = statusGroups.find(
      (g) => g.status.key.toUpperCase() === key.toUpperCase()
    );
    return group ? group.total : 0;
  };

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

  const getPaymentStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "paid" || s === "successful" || s === "success") return "bg-green-100 text-green-700";
    if (s === "failed" || s === "cancelled") return "bg-red-100 text-red-700";
    if (s === "pending" || s === "initiated") return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="w-full">
      <Card className="border border-gray-100 shadow-none rounded-xl bg-white p-6 space-y-6">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading...
              </span>
            ) : (
              `Total (${totalOrders})`
            )}
          </h2>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 border-gray-200 bg-white rounded-lg pl-10 focus-visible:ring-orange-500"
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="h-10 border-gray-200">
                <Download size={16} className="mr-2" /> Download
              </Button>
              <Button
                variant={isFilterOpen ? "default" : "outline"}
                className={cn(
                  "h-10 border-gray-200",
                  isFilterOpen && "bg-gray-900 text-white"
                )}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter size={16} className="mr-2" /> Filter{" "}
                {isFilterOpen && <X size={16} className="ml-2" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {isFilterOpen && (
          <div className="flex flex-wrap gap-3 items-center pb-4 border-b border-gray-100 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2 px-3 h-10 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 font-medium">
              <Filter size={16} /> Filter
            </div>

            <Select
              value={dateRange}
              onValueChange={(val) => {
                setDateRange(val);
                if (val !== "custom") {
                  setStartDate(undefined);
                  setEndDate(undefined);
                }
              }}
            >
              <SelectTrigger className="w-[180px] h-10 border-gray-200 bg-white">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last_7_days">Last 7 days</SelectItem>
                <SelectItem value="last_week">Last week</SelectItem>
                <SelectItem value="last_30_days">Last 30 days</SelectItem>
                <SelectItem value="last_90_days">Last 90 days</SelectItem>
                <SelectItem value="last_6_months">Last 6 months</SelectItem>
                <SelectItem value="this_month">This month</SelectItem>
                <SelectItem value="last_month">Last month</SelectItem>
                <SelectItem value="this_year">This year</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger className="w-[180px] h-10 border-gray-200 bg-white">
                <SelectValue placeholder="Payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Status</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Amount (₦)"
              value={amountQuery}
              onChange={(e) => setAmountQuery(e.target.value)}
              className="w-[180px] h-10 border-gray-200 bg-white"
            />

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[180px] h-10 border-gray-200 bg-white justify-start text-sm font-normal text-gray-500"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date);
                    setDateRange("custom");
                  }}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[180px] h-10 border-gray-200 bg-white justify-start text-sm font-normal text-gray-500"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    setEndDate(date);
                    setDateRange("custom");
                  }}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Dynamic Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-100 mb-0 overflow-x-auto no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TABS.map((tab) => {
            const count = getTabCount(tab.key);
            // Hide tabs with 0 count except 'all' and currently active
            if (count === 0 && tab.key !== "all" && activeTab !== tab.key)
              return null;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                }}
                className={cn(
                  "pb-4 text-sm font-medium transition-all relative whitespace-nowrap",
                  activeTab === tab.key
                    ? "text-[#E86B35]"
                    : "text-gray-400 hover:text-gray-600",
                )}
              >
                {tab.label} ({count})
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E86B35]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Table Content */}
        <div className="overflow-hidden min-h-[400px]">
          {isLoading && orders.length === 0 ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <PackageSearch className="text-gray-200 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900">
                No orders found
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Try adjusting your filters or search terms.
              </p>
              <Button
                variant="link"
                className="text-orange-500 mt-2"
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("all");
                  setPaymentStatus("all");
                  setAmountQuery("");
                  setDateRange("all");
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="p-4 font-semibold text-gray-900">Order ID</th>
                  <th className="p-4 font-semibold text-gray-900">Date</th>
                  <th className="p-4 font-semibold text-gray-900">Customer</th>
                  <th className="p-4 font-semibold text-gray-900">Total Price</th>
                  <th className="p-4 font-semibold text-gray-900">Order Status</th>
                  <th className="p-4 font-semibold text-gray-900">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr
                    key={order.orderId}
                    className="hover:bg-gray-50/30 transition-colors"
                  >
                    <td className="p-4 text-gray-900 font-medium">
                      {order.orderCode}
                    </td>
                    <td className="p-4 text-gray-600">
                      {format(new Date(order.createdAt), "eee, MMM d, yyyy, h:mm a")}
                    </td>
                    <td className="p-4 text-gray-600">{order.customerName}</td>
                    <td className="p-4 text-gray-900 font-medium">
                      ₦{order.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap block w-full text-center max-w-[140px]",
                          getStatusColor(order.status.label),
                        )}
                      >
                        {order.status.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap block w-full text-center max-w-[140px]",
                          getPaymentStatusColor(order.paymentStatus?.label || "unknown"),
                        )}
                      >
                        {order.paymentStatus?.label || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Section */}
        {orders.length > 0 && (
          <div className="flex items-center justify-center gap-6 text-sm border-t pt-6">
            <p className="text-gray-500">
              Total{" "}
              <span className="text-gray-900 font-medium">
                {totalOrders} items
              </span>
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
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
                      "h-8 w-8 rounded font-medium",
                      currentPage === page
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "text-gray-500",
                    )}
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
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight size={18} />
              </Button>
            </div>
            <Select
              value={`${itemsPerPage}`}
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
        )}
      </Card>
    </div>
  );
}