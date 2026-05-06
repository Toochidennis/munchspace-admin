"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Calendar, ChevronLeft, ChevronRight, MoreHorizontal, Loader2, Copy, Download, RotateCcw, X } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import { format } from "date-fns";
import { toast } from "sonner";

interface BalanceData {
  balance: number;
  totalCompletedDeliveries: number;
  upcomingPaymentAmount: number;
  nextPaymentAmount: number;
  daysToNextPayment: number;
}

interface Payout {
  payoutId: string;
  payoutCode: string;
  amountPaid: number;
  status: string;
  payoutType: string;
  date: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const RANGE_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "last_7_days" },
  { label: "Last Week", value: "last_week" },
  { label: "Last 30 Days", value: "last_30_days" },
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

export default function RemittanceTab({ riderId }: { riderId: string }) {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRange, setSelectedRange] = useState("last_30_days");
  const [currentPage, setCurrentPage] = useState(1);
  const [metadataModalOpen, setMetadataModalOpen] = useState(false);
  const [metadataContent, setMetadataContent] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!riderId) return;
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        range: selectedRange,
        ...(searchQuery && { search: searchQuery }),
      });

      const res = await authenticatedFetch(`/admin/payouts/riders/${riderId}?${queryParams.toString()}`);
      const apiRes = await parseApiResponse(res);
      console.log(apiRes)

      if (apiRes) {
        // The actual payload is inside apiRes.data if the request was successful
        const payload = apiRes.success && apiRes.data ? apiRes.data : apiRes;

        setBalance(payload.balance || null);
        setPayouts(Array.isArray(payload.data) ? payload.data : []);
        setMeta(payload.meta || null);
      }
    } catch (error) {
      console.error("Failed to fetch payout data:", error);
      setPayouts([]);
    } finally {
      setIsLoading(false);
    }
  }, [riderId, currentPage, selectedRange, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const metrics = [
    { label: "Balance", value: `N ${balance?.balance?.toLocaleString() || 0}` },
    { label: "Number of Completed Deliveries", value: balance?.totalCompletedDeliveries?.toString() || "0" },
    { label: "Upcoming payment", value: `N ${balance?.upcomingPaymentAmount?.toLocaleString() || 0}` },
    { 
      label: "Next Payment", 
      value: `N ${balance?.nextPaymentAmount?.toLocaleString() || 0}`, 
      badge: balance?.daysToNextPayment !== undefined ? `due in ${balance.daysToNextPayment} days` : null
    },
  ];

  const handleViewMetadata = (payout: any) => {
    setMetadataContent(payout);
    setMetadataModalOpen(true);
  };

  const handleCopyMetadata = () => {
    if (metadataContent) {
      navigator.clipboard.writeText(JSON.stringify(metadataContent, null, 2));
      toast.success("Metadata copied to clipboard");
    }
  };

  const gridLayout = "grid grid-cols-[160px_1fr_1fr_130px_150px_150px_60px]";

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((item, i) => (
          <Card key={i} className="p-6 border border-gray-100 rounded-xl bg-white space-y-3">
            <p className="text-[11px] tracking-wider text-gray-400 font-bold uppercase">{item.label}</p>
            <div className="flex items-center gap-3">
              <p className="text-xl font-bold text-gray-900">{item.value}</p>
              {item.badge && (
                <span className="text-[10px] bg-orange-50 text-[#E86B35] px-2 py-0.5 rounded-full border border-orange-100 font-bold italic">
                  {item.badge}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* History Table */}
      <Card className="border border-gray-100 rounded-xl bg-white p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900 font-inter">History</h2>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 border-gray-200 bg-white rounded-lg pr-10 focus-visible:ring-1 focus-visible:ring-orange-500"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            
            <Select value={selectedRange} onValueChange={(v) => {
              setSelectedRange(v);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[180px] h-10 border-gray-200 text-gray-600 font-bold rounded-lg whitespace-nowrap">
                <Calendar size={16} className="mr-2 text-gray-400" />
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-0 border border-gray-100 rounded-md overflow-hidden">
          <div
            className={cn(
              gridLayout,
              "bg-[#F9FAFB] text-gray-900 border-b border-gray-100 text-sm font-medium",
            )}
          >
            <div className="py-3 pl-4 border-r border-gray-100 flex items-center gap-3">
              <input type="checkbox" className="rounded" />
              Amount
            </div>
            <div className="py-3 pl-4 border-r border-gray-100 flex items-center">Recipient</div>
            <div className="py-3 pl-4 border-r border-gray-100 flex items-center">Type</div>
            <div className="py-3 pl-4 border-r border-gray-100 flex items-center">Status</div>
            <div className="py-3 pl-4 border-r border-gray-100 flex items-center">Payout ID</div>
            <div className="py-3 pl-4 border-r border-gray-100 flex items-center">Date</div>
            <div className="flex justify-center items-center py-3">-</div>
          </div>

          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="py-20 text-center bg-white border-t border-gray-100">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-[#E86B35]" />
                  <p className="text-gray-500 font-medium text-sm italic">Loading payout history...</p>
                </div>
              </div>
            ) : !Array.isArray(payouts) || payouts.length === 0 ? (
              <div className="py-20 text-center text-gray-500 font-medium bg-white border-t border-gray-100 text-sm">
                No payout history found.
              </div>
            ) : (
              payouts.map((payout, idx) => (
                <div
                  key={payout.payoutId}
                  className={cn(gridLayout, "text-sm items-stretch bg-white transition-colors hover:bg-gray-50/30")}
                >
                  <div className="flex items-center gap-3 border-r border-gray-100 py-4 pl-4 font-bold text-gray-900">
                    <input type="checkbox" className="rounded" />
                    NGN {payout.amountPaid.toLocaleString()}
                  </div>
                  <div className="flex items-center pl-4 border-r border-gray-100">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">This Rider</span>
                      <span className="text-[10px] text-gray-500 uppercase">RIDER</span>
                    </div>
                  </div>
                  <div className="flex items-center pl-4 text-gray-500 border-r border-gray-100 capitalize">
                    {payout.payoutType}
                  </div>
                  <div className="flex items-center border-r border-gray-100 px-4">
                    <span className={cn(
                      "px-3 py-1 rounded text-[11px] font-bold whitespace-nowrap w-full text-center uppercase",
                      payout.status.toLowerCase() === "paid" ? "bg-green-100 text-green-700" : 
                      payout.status.toLowerCase() === "pending" || payout.status.toLowerCase() === "processing" ? "bg-yellow-100 text-yellow-700" : 
                      "bg-red-100 text-red-700"
                    )}>
                      {payout.status}
                    </span>
                  </div>
                  <div className="flex items-center pl-4 text-gray-500 border-r border-gray-100 font-bold">
                    {payout.payoutCode}
                  </div>
                  <div className="flex items-center pl-4 text-gray-500 border-r border-gray-100 truncate">
                    {format(new Date(payout.date), "MMM d, yyyy h:mm a")}
                  </div>
                  <div className="flex justify-center items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal size={18} className="text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-md w-48">
                        <DropdownMenuItem 
                          className="flex items-center gap-2 py-2.5 w-full cursor-pointer"
                          onClick={() => handleViewMetadata(payout)}
                        >
                          <Copy size={16} /> View Metadata
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2 py-2.5 w-full cursor-pointer"
                        >
                          <Download size={16} /> Export Receipt
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-6 text-sm mt-8">
            <p className="text-gray-500 font-medium">
              Total <span className="text-gray-900 font-bold">{meta.total} items</span>
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-gray-400" 
                disabled={!meta.hasPreviousPage}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft size={18} />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "outline" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 w-8 rounded-md font-bold text-xs transition-all",
                      page === currentPage ? "border-[#E86B35] text-[#E86B35]" : "text-gray-400"
                    )}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-gray-400"
                disabled={!meta.hasNextPage}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Metadata Modal */}
      <CustomModal
        isOpen={metadataModalOpen}
        onClose={() => setMetadataModalOpen(false)}
        title="Payout Metadata"
        maxWidth="sm:max-w-[680px]"
        footer={
          <Button
            variant="outline"
            onClick={() => fetchData()}
          >
            <RotateCcw size={16} className="mr-2" />
            Recheck Status
          </Button>
        }
      >
        <div className="bg-[#111827] rounded-md p-6 relative min-h-[400px] flex flex-col justify-center">
          {metadataContent ? (
            <>
              <button 
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                onClick={handleCopyMetadata}
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
