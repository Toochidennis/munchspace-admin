"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Badge,
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

interface StatusGroup {
  status: {
    key: string;
    label: string;
  };
  total: number;
  amount: number;
}

interface OwnerGroup {
  ownerType: {
    key: string;
    label: string;
  };
  total: number;
  amount: number;
}

interface Payout {
  payoutId: string;
  code: string;
  reference: string;
  ownerType: string;
  ownerName: string;
  ownerEmail: string;
  amount: number;
  currency: string;
  payoutType: string;
  status: string;
  bankName: string;
  accountNumber: string;
  orderCodes: string[];
  createdAt: string;
  processedAt: string;
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

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [statusGroups, setStatusGroups] = useState<StatusGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeStatusTab, setActiveStatusTab] = useState("all");
  const [selectedRange, setSelectedRange] = useState("last_30_days");
  const [ownerTypeFilter, setOwnerTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState("10");
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [metadataModalOpen, setMetadataModalOpen] = useState(false);
  const [metadataContent, setMetadataContent] = useState<Payout | null>(null);

  const fetchPayouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize,
        status: activeStatusTab,
        ownerType: ownerTypeFilter,
        ...(searchQuery && { search: searchQuery }),
      });

      // Prefer explicit dates over range if provided
      if (startDate && endDate) {
        queryParams.set("startDate", startDate.toISOString());
        queryParams.set("endDate", endDate.toISOString());
      } else if (selectedRange && selectedRange !== "all") {
        queryParams.set("range", selectedRange);
      }

      const res = await authenticatedFetch(`/admin/payouts?${queryParams.toString()}`);
      const apiRes = await parseApiResponse(res);

      if (apiRes?.success) {
        const payload = apiRes.data;
        setPayouts(payload.payouts || []);
        setStatusGroups(payload.statusGroups || []);
        setTotalPages(payload.totalPages || 1);
        setTotalCount(payload.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch payouts:", error);
      toast.error("Failed to load payouts");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, selectedRange, activeStatusTab, ownerTypeFilter, searchQuery, startDate, endDate]);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayouts();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchPayouts]);

  const resetFilters = () => {
    setSelectedRange("last_30_days");
    setOwnerTypeFilter("all");
    setSearchQuery("");
    setStartDate(undefined);
    setEndDate(undefined);
    setActiveStatusTab("all");
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(payouts.map((p) => p.payoutId));
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

  const handleViewMetadata = (payout: Payout) => {
    setMetadataContent(payout);
    setMetadataModalOpen(true);
  };

  const handleCopyMetadata = () => {
    if (metadataContent) {
      navigator.clipboard.writeText(JSON.stringify(metadataContent, null, 2));
      toast.success("Metadata copied to clipboard");
    }
  };

  const tabs = useMemo(() => {
    const filteredGroups = statusGroups.filter(g => g.status.key !== "all" && g.total > 0);
    return [{ status: { key: "all", label: "All" }, total: totalCount }, ...filteredGroups];
  }, [statusGroups, totalCount]);

  const gridLayout = "grid grid-cols-[160px_1fr_1fr_130px_150px_150px_60px]";

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 md:p-8 font-inter">
        <div className="max-w-[1400px] mx-auto space-y-6">
          
          {/* Top Header Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Total ({totalCount})</h1>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="border border-gray-200 bg-white rounded-md h-10 w-10 shadow-sm"
                onClick={() => fetchPayouts()}
              >
                <RotateCcw size={18} className={isLoading ? "animate-spin" : ""} />
              </Button>
              <Select value={selectedRange} onValueChange={(v) => {
                setSelectedRange(v);
                setStartDate(undefined);
                setEndDate(undefined);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[180px] h-10 border-gray-200 bg-white shadow-sm rounded-md font-normal">
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
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            
            {/* Search & Actions Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative w-full max-w-md">
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
                  className="pl-10 h-10 border-gray-200 shadow-none focus-visible:ring-1 focus-visible:ring-orange-500"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="h-10 border-gray-200 text-gray-600 font-medium">
                  <Download className="mr-2 h-4 w-4 text-gray-400" /> Download
                </Button>
                <Button
                  variant={isFilterOpen ? "default" : "outline"}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={cn(
                    "h-10 font-medium",
                    isFilterOpen ? "bg-gray-900 text-white hover:bg-gray-800" : "border-gray-200 text-gray-600"
                  )}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filter {isFilterOpen && <X className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Expanded Filters */}
            {isFilterOpen && (
              <div className="border-b border-gray-100 pb-6 space-y-4 animate-in slide-in-from-top-1 duration-200">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2 px-3 h-10 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500 font-medium">
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

                  <Select value={ownerTypeFilter} onValueChange={(v) => {
                    setOwnerTypeFilter(v);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-[180px] h-10 border-gray-200">
                      <SelectValue placeholder="Owner Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Owners</SelectItem>
                      <SelectItem value="business">Businesses</SelectItem>
                      <SelectItem value="rider">Riders</SelectItem>
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

            {/* Status Tabs */}
            <div className="flex gap-6 border-b overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.status.key}
                  onClick={() => {
                    setActiveStatusTab(tab.status.key);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "pb-3 text-sm font-medium relative whitespace-nowrap",
                    activeStatusTab === tab.status.key
                      ? "text-[#E86B35] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#E86B35]"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {tab.status.label} ({tab.total})
                </button>
              ))}
            </div>

            {/* Selection Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm">
                Selected: <strong>{selectedIds.length}</strong>
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedIds.length === 0}
              >
                Recheck Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedIds.length === 0}
              >
                Retry Payout
              </Button>
            </div>

            {/* Table */}
            <div className="space-y-0 border border-gray-200 rounded-md overflow-hidden">
              <div
                className={cn(
                  gridLayout,
                  "bg-[#F9FAFB] text-gray-900 border-b border-gray-200 text-sm font-medium",
                )}
              >
                <div className="flex items-center gap-3 border-r border-gray-200 py-3 pl-4">
                  <Checkbox
                    checked={selectedIds.length === payouts.length && payouts.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="rounded-sm"
                  />
                  Amount
                </div>
                <div className="py-3 pl-4 border-r border-gray-200">Recipient</div>
                <div className="py-3 pl-4 border-r border-gray-200">Type</div>
                <div className="py-3 pl-4 border-r border-gray-200">Status</div>
                <div className="py-3 pl-4 border-r border-gray-200">Payout ID</div>
                <div className="py-3 pl-4 border-r border-gray-200">Date</div>
                <div className="flex justify-center items-center py-3">-</div>
              </div>

              {/* Table Rows */}
              {isLoading ? (
                <div className="py-20 text-center bg-white">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-[#E86B35]" />
                    <p className="text-gray-500 font-medium text-sm">Loading payouts...</p>
                  </div>
                </div>
              ) : payouts.length === 0 ? (
                <div className="py-20 text-center text-gray-500 font-medium bg-white text-sm">
                  No payouts found.
                </div>
              ) : (
                payouts.map((payout) => (
                  <div
                    key={payout.payoutId}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    <div className={cn(gridLayout, "text-sm items-stretch bg-white")}>
                      <div className="flex items-center gap-3 border-r border-gray-100 py-4 pl-4 font-medium text-gray-900">
                        <Checkbox
                          checked={selectedIds.includes(payout.payoutId)}
                          onCheckedChange={(checked) => handleSelectOne(payout.payoutId, !!checked)}
                          className="rounded-sm"
                        />
                        {payout.currency} {payout.amount.toLocaleString()}
                      </div>
                      <div className="flex items-center pl-4 border-r border-gray-100">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{payout.ownerName}</span>
                          <span className="text-[10px] text-gray-500 uppercase">{payout.ownerType}</span>
                        </div>
                      </div>
                      <div className="flex items-center pl-4 text-gray-500 border-r border-gray-100 capitalize">
                        {payout.payoutType}
                      </div>
                      <div className="flex items-center border-r border-gray-100 px-4">
                        <span className={cn(
                          "px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap w-full text-center",
                          payout.status.toLowerCase() === "paid" ? "bg-green-100 text-green-700" : 
                          payout.status.toLowerCase() === "pending" || payout.status.toLowerCase() === "processing" ? "bg-yellow-100 text-yellow-700" : 
                          "bg-red-100 text-red-700"
                        )}>
                          {payout.status}
                        </span>
                      </div>
                      <div className="flex items-center pl-4 text-gray-500 border-r border-gray-100 font-medium">
                        {payout.code}
                      </div>
                      <div className="flex items-center pl-4 text-gray-500 border-r border-gray-100 truncate">
                        {format(new Date(payout.createdAt), "MMM d, yyyy HH:mm")}
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
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {!isLoading && totalCount > 0 && (
              <div className="flex items-center justify-center gap-6 text-sm border-t pt-6 pb-6">
                <p className="text-gray-500">
                  Total{" "}
                  <span className="text-gray-900 font-medium">
                    {totalCount} items
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
                            "cursor-default hover:bg-transparent"
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
                  value={pageSize.toString()}
                  onValueChange={(v) => {
                    setPageSize(v);
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
          </div>
        </div>
      </div>

      {/* Metadata Modal */}
      <CustomModal
        isOpen={metadataModalOpen}
        onClose={() => setMetadataModalOpen(false)}
        title="Payout Metadata"
        maxWidth="sm:max-w-[680px]"
        footer={
          <Button
            variant="outline"
            onClick={() => fetchPayouts()}
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
