"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Header from "@/components/layout/Header";
import {
  RotateCcw,
  Calendar as CalendarIcon,
  Search,
  Download,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Copy,
  X,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface PaymentStatus {
  key: string;
  label: string;
}

interface PaymentGroup {
  status: PaymentStatus;
  total: number;
}

interface Payment {
  paymentId: string;
  reference: string;
  orderId: string;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  businessName: string;
  amount: number;
  currency: string;
  provider: string;
  method: string;
  status: string;
  createdAt: string;
  verifiedAt: string | null;
}

const RANGE_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "last_7_days" },
  { label: "Last Week", value: "last_week" },
  { label: "Last 30 days", value: "last_30_days" },
  { label: "Last 90 Days", value: "last_90_days" },
  { label: "Last 6 Months", value: "last_6_months" },
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "This Year", value: "this_year" },
];

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

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statusGroups, setStatusGroups] = useState<PaymentGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeStatusTab, setActiveStatusTab] = useState("all");
  const [selectedRange, setSelectedRange] = useState("last_30_days");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState("20");
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals
  const [metadataModalOpen, setMetadataModalOpen] = useState(false);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const [metadataContent, setMetadataContent] = useState<any>(null);
  
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedPaymentForVerify, setSelectedPaymentForVerify] = useState<Payment | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize,
        status: activeStatusTab,
        ...(searchQuery && { search: searchQuery }),
      });

      if (startDate && endDate) {
        queryParams.set("startDate", startDate.toISOString());
        queryParams.set("endDate", endDate.toISOString());
      } else if (selectedRange && selectedRange !== "all") {
        queryParams.set("range", selectedRange);
      }

      const res = await authenticatedFetch(`/admin/payments?${queryParams.toString()}`);
      const apiRes = await parseApiResponse(res);

      if (apiRes?.success) {
        const payload = apiRes.data;
        setPayments(payload.payments || []);
        setStatusGroups(payload.groups || []);
        setTotalPages(payload.totalPages || 1);
        setTotalCount(payload.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, selectedRange, activeStatusTab, searchQuery, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchPayments]);

  const resetFilters = () => {
    setSelectedRange("last_30_days");
    setSearchQuery("");
    setStartDate(undefined);
    setEndDate(undefined);
    setActiveStatusTab("all");
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(payments.map((p) => p.paymentId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleVerifyPayment = (payment: Payment) => {
    setSelectedPaymentForVerify(payment);
    setVerifyModalOpen(true);
  };

  const submitVerifyPayment = async () => {
    if (!selectedPaymentForVerify) return;
    setIsVerifying(true);
    try {
      const res = await authenticatedFetch(
        `/admin/payments/${selectedPaymentForVerify.paymentId}/verify`,
        { method: "POST", body: JSON.stringify({}) },
      );
      const result = await parseApiResponse(res);
      console.log(result)
      if (result?.success) {
        toast.success(
          `Payment verified: ${result.data?.verificationResult || "Success"}`,
        );
        setVerifyModalOpen(false);
        setSelectedPaymentForVerify(null);
        fetchPayments();
      } else {
        toast.error(result?.message || "Failed to verify payment");
      }
    } catch (err) {
      toast.error("An error occurred while verifying payment");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleViewMetadata = async (paymentId: string) => {
    setMetadataModalOpen(true);
    setIsMetadataLoading(true);
    setMetadataContent(null);
    try {
      const res = await authenticatedFetch(`/admin/payments/${paymentId}/metadata`);
      const apiRes = await parseApiResponse(res);
      if (apiRes?.success) {
        setMetadataContent(apiRes.data);
      } else {
        toast.error("Failed to fetch metadata");
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
      toast.error("An error occurred while fetching metadata");
    } finally {
      setIsMetadataLoading(false);
    }
  };

  const tabs = useMemo(() => {
    // Only show statuses that have payments, but always show "All"
    const filteredGroups = statusGroups
      .filter((g) => g.status.key !== "all" && g.total > 0)
      .map((g) => ({
        key: g.status.key,
        label: g.status.label,
        count: g.total,
      }));

    return [{ key: "all", label: "All", count: totalCount }, ...filteredGroups];
  }, [statusGroups, totalCount]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAFBFC]">
      <Header title="Payments" />

      <div className="flex-1 overflow-y-auto p-6 md:p-8 font-inter">
        <div className="max-w-[1400px] mx-auto space-y-6">
          
          {/* Top Header Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Total ({totalCount})</h1>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-500 hover:bg-white"
                onClick={() => fetchPayments()}
              >
                <RotateCcw size={18} className={isLoading ? "animate-spin" : ""} />
              </Button>
              <Select value={selectedRange} onValueChange={(v) => {
                setSelectedRange(v);
                setStartDate(undefined);
                setEndDate(undefined);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[180px] h-11 border-gray-200 bg-white shadow-none rounded-lg text-gray-700">
                  <CalendarIcon size={18} className="mr-2 text-gray-400" />
                  <SelectValue placeholder="Last 30 days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  {RANGE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Card Container */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            
            {/* Search & Actions Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative w-full max-w-sm">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 h-11 bg-[#F9FAFB] border-gray-200 rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-orange-500"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="h-11 bg-[#F1F3F5] border-none text-gray-600 font-bold px-5 rounded-lg hover:bg-gray-200">
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={cn(
                    "h-11 bg-[#F1F3F5] border-none text-gray-600 font-bold px-5 rounded-lg hover:bg-gray-200 transition-all",
                    isFilterOpen && "bg-gray-900 text-white hover:bg-gray-800"
                  )}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filter {isFilterOpen ? <X size={16} className="ml-2" /> : <ChevronLeft size={16} className="ml-2 rotate-270" />}
                </Button>
              </div>
            </div>

            {/* Expanded Filters */}
            {isFilterOpen && (
              <div className="border-b border-gray-100 pb-6 space-y-4 animate-in slide-in-from-top-1 duration-200">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2 px-3 h-10 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500 font-bold">
                    <Filter size={16} /> Filter
                  </div>

                  <Select value={selectedRange} onValueChange={(v) => {
                    setSelectedRange(v);
                    setStartDate(undefined);
                    setEndDate(undefined);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-[180px] h-10 border-gray-200">
                      <SelectValue placeholder="Date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All time</SelectItem>
                      {RANGE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[180px] justify-start h-10 border-gray-200 text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                        {startDate ? format(startDate, "dd/MM/yyyy") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                        className="w-[180px] justify-start h-10 border-gray-200 text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                        {endDate ? format(endDate, "dd/MM/yyyy") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Button 
                    variant="ghost" 
                    onClick={resetFilters}
                    className="text-[#E86B35] hover:text-[#D15A2A] hover:bg-orange-50 font-bold text-sm"
                  >
                    Reset all filters
                  </Button>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-8 overflow-x-auto border-b border-gray-100 scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveStatusTab(tab.key);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "pb-3 text-sm font-bold relative whitespace-nowrap transition-all",
                    activeStatusTab === tab.key
                      ? "text-[#E86B35] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#E86B35]"
                      : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {tab.label} {tab.count > 0 ? tab.count : ""}
                </button>
              ))}
            </div>

            {/* Selection Actions */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-gray-900">
                Selected: {selectedIds.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedIds.length !== 1}
                className="bg-[#F1F3F5] text-gray-400 border-none font-bold h-10 px-4 rounded-lg disabled:opacity-50"
                onClick={() => {
                  const payment = payments.find((p) => p.paymentId === selectedIds[0]);
                  if (payment) handleVerifyPayment(payment);
                }}
              >
                Verify Payment
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedIds.length === 0}
                className="bg-[#F1F3F5] text-gray-400 border-none font-bold h-10 px-4 rounded-lg disabled:opacity-50"
              >
                Recheck Status
              </Button>
            </div>

            {/* Table */}
            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F1F3F5] text-xs font-bold text-gray-900">
                  <tr>
                    <th className="px-4 py-3 w-[40px] border-r border-white/50">
                      <Checkbox
                        checked={selectedIds.length === payments.length && payments.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 border-r border-white/50">Amount</th>
                    <th className="px-4 py-3 border-r border-white/50">Order ID</th>
                    <th className="px-4 py-3 border-r border-white/50">Gateway</th>
                    <th className="px-4 py-3 border-r border-white/50">Method</th>
                    <th className="px-4 py-3 border-r border-white/50">Date</th>
                    <th className="px-4 py-3 border-r border-white/50">Status</th>
                    <th className="px-4 py-3 w-[60px] text-center">-</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-[#E86B35]" />
                          <p className="text-gray-400 font-medium italic">Loading payments...</p>
                        </div>
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center text-gray-500 font-medium italic">
                        No payments found.
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.paymentId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4">
                          <Checkbox
                            checked={selectedIds.includes(payment.paymentId)}
                            onCheckedChange={(checked) => handleSelectOne(payment.paymentId, !!checked)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-4 text-gray-900">{payment.currency} {payment.amount.toLocaleString()}</td>
                        <td className="px-4 py-4 font-medium">
                          <Link href={`/admin/orders/${payment.orderId}`} className="text-[#3B82F6] underline">
                            {payment.orderCode}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-gray-900">{payment.provider}</td>
                        <td className="px-4 py-4 text-gray-900">{payment.method}</td>
                        <td className="px-4 py-4 text-gray-500">
                          {format(new Date(payment.createdAt), "MMM d, yyyy HH:mm")}
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn(
                            "px-3 py-1 rounded text-[10px] font-bold text-white uppercase",
                            payment.status.toLowerCase() === "success" ? "bg-[#4CAF50]" : 
                            payment.status.toLowerCase() === "pending" ? "bg-[#FF9800]" : 
                            "bg-[#F44336]"
                          )}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                                <MoreHorizontal size={18} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl border-gray-100">
                              <DropdownMenuItem 
                                className="flex items-center gap-3 py-2.5 px-3 text-sm font-medium text-gray-700 cursor-pointer rounded-lg hover:bg-gray-50"
                                onClick={() => fetchPayments()}
                              >
                                <RotateCcw size={16} /> Recheck Status
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-center gap-3 py-2.5 px-3 text-sm font-medium text-gray-700 cursor-pointer rounded-lg hover:bg-gray-50"
                                onClick={() => handleVerifyPayment(payment)}
                              >
                                <Check size={16} /> Verify Payment
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-center gap-3 py-2.5 px-3 text-sm font-medium text-gray-700 cursor-pointer rounded-lg hover:bg-gray-50"
                                onClick={() => handleViewMetadata(payment.paymentId)}
                              >
                                <Copy size={16} /> View Metadata
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && totalCount > 0 && (
              <div className="flex items-center justify-between py-6">
                <p className="text-sm text-gray-400 font-medium">
                  Total {totalCount} items
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-gray-600">
                    <ChevronLeft size={18} />
                  </Button>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5, "...", 50].map((page, i) => (
                      <button
                        key={i}
                        className={cn(
                          "h-9 w-9 rounded flex items-center justify-center text-sm font-bold transition-all",
                          page === currentPage 
                            ? "border border-[#E86B35] text-[#E86B35]" 
                            : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-gray-600">
                    <ChevronRight size={18} />
                  </Button>
                  
                  <Select value={pageSize} onValueChange={setPageSize}>
                    <SelectTrigger className="w-[120px] h-10 border-gray-200 text-gray-600 ml-4">
                      <SelectValue placeholder="10 / page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 / page</SelectItem>
                      <SelectItem value="20">20 / page</SelectItem>
                      <SelectItem value="50">50 / page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verify Payment Modal */}
      <CustomModal
        isOpen={verifyModalOpen && !!selectedPaymentForVerify}
        onClose={() => {
          if (!isVerifying) {
            setVerifyModalOpen(false);
            setSelectedPaymentForVerify(null);
          }
        }}
        title="Verify Payment"
        maxWidth="sm:max-w-[480px]"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setVerifyModalOpen(false);
                setSelectedPaymentForVerify(null);
              }}
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={submitVerifyPayment}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Payment"
              )}
            </Button>
          </>
        }
      >
        {selectedPaymentForVerify && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Verify payment for order <span className="font-medium">#{selectedPaymentForVerify.orderCode.replace("#", "")}</span>
            </p>
            <div className="bg-gray-50 rounded-md p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold text-gray-900">{selectedPaymentForVerify.currency} {selectedPaymentForVerify.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reference</span>
                <span className="font-medium text-gray-700 text-xs">{selectedPaymentForVerify.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Current Status</span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase",
                  selectedPaymentForVerify.status.toLowerCase() === "success" ? "bg-[#4CAF50]" : 
                  selectedPaymentForVerify.status.toLowerCase() === "pending" ? "bg-[#FF9800]" : 
                  "bg-[#F44336]"
                )}>
                  {selectedPaymentForVerify.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Gateway</span>
                <span className="font-medium text-gray-700">{selectedPaymentForVerify.provider}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              This will re-verify the payment status with the payment gateway.
            </p>
          </div>
        )}
      </CustomModal>

      {/* Metadata Modal */}
      <CustomModal
        isOpen={metadataModalOpen}
        onClose={() => setMetadataModalOpen(false)}
        title="Payment Metadata"
        maxWidth="sm:max-w-[680px]"
        footer={
          <Button
            variant="outline"
            onClick={() => metadataContent?.paymentId && handleViewMetadata(metadataContent.paymentId)}
            disabled={isMetadataLoading}
          >
            <RotateCcw size={16} className={cn("mr-2", isMetadataLoading && "animate-spin")} />
            Recheck Status
          </Button>
        }
      >
        <div className="bg-[#111827] rounded-md p-6 relative min-h-[400px] flex flex-col justify-center">
          {isMetadataLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-white/50" />
              <p className="text-white/50 text-sm font-medium">Fetching transaction logs...</p>
            </div>
          ) : metadataContent ? (
            <>
              <button 
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(metadataContent, null, 2));
                  toast.success("Metadata copied to clipboard");
                }}
              >
                <Copy size={20} />
              </button>
              <pre className="text-[#9CA3AF] text-sm font-mono overflow-x-auto h-[400px] scrollbar-hide leading-relaxed">
                {JSON.stringify(metadataContent, null, 2)}
              </pre>
            </>
          ) : (
            <p className="text-white/50 text-center">Failed to load metadata</p>
          )}
        </div>
      </CustomModal>
    </div>
  );
}
