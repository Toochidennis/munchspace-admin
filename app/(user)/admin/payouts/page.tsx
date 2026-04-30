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
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [metadataModalOpen, setMetadataModalOpen] = useState(false);
  const [metadataContent, setMetadataContent] = useState<Payout | null>(null);

  const fetchPayouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
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
  }, [currentPage, selectedRange, activeStatusTab, ownerTypeFilter, searchQuery, startDate, endDate]);

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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAFBFC]">
      <Header title="Payouts" />

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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            
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
            <div className="flex gap-6 overflow-x-auto border-b border-gray-100 scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.status.key}
                  onClick={() => {
                    setActiveStatusTab(tab.status.key);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "pb-3 text-sm font-bold relative whitespace-nowrap transition-all",
                    activeStatusTab === tab.status.key
                      ? "text-[#E86B35] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#E86B35]"
                      : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {tab.status.label} {tab.total > 0 ? `(${tab.total})` : ""}
                </button>
              ))}
            </div>

            {/* Selection Actions */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-900">
                Selected: {selectedIds.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedIds.length === 0}
                className="bg-gray-50 text-gray-400 border-gray-200 font-bold shadow-none h-8 text-[10px] uppercase disabled:opacity-50"
              >
                Recheck Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedIds.length === 0}
                className="bg-gray-50 text-gray-400 border-gray-100 font-bold shadow-none h-8 text-[10px] uppercase disabled:opacity-50"
              >
                Retry Payout
              </Button>
            </div>

            {/* Table */}
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8FAFC] border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 w-[40px]">
                      <Checkbox
                        checked={selectedIds.length === payouts.length && payouts.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="rounded border-gray-300 shadow-none"
                      />
                    </th>
                    <th className="px-4 py-3 border-r border-gray-100">Amount</th>
                    <th className="px-4 py-3 border-r border-gray-100">Recipient</th>
                    <th className="px-4 py-3 border-r border-gray-100">Type</th>
                    <th className="px-4 py-3 border-r border-gray-100">Status</th>
                    <th className="px-4 py-3 border-r border-gray-100">Payout ID</th>
                    <th className="px-4 py-3 border-r border-gray-100">Date</th>
                    <th className="px-4 py-3 w-[60px] text-center">-</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-[#E86B35]" />
                          <p className="text-gray-400 font-medium italic">Fetching payouts...</p>
                        </div>
                      </td>
                    </tr>
                  ) : payouts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center text-gray-500 font-medium italic">
                        No payouts found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    payouts.map((payout) => (
                      <tr key={payout.payoutId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4 border-r border-gray-100">
                          <Checkbox
                            checked={selectedIds.includes(payout.payoutId)}
                            onCheckedChange={(checked) => handleSelectOne(payout.payoutId, !!checked)}
                            className="rounded border-gray-300 shadow-none"
                          />
                        </td>
                        <td className="px-4 py-4 border-r border-gray-100 font-bold text-gray-900">
                          {payout.currency} {payout.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 border-r border-gray-100">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{payout.ownerName}</span>
                            <span className="text-[10px] text-gray-400 uppercase font-medium">{payout.ownerType}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 border-r border-gray-100 text-gray-500 capitalize">{payout.payoutType}</td>
                        <td className="px-4 py-4 border-r border-gray-100">
                          <Badge className={cn(
                            "border-none px-3 py-1 rounded-md text-[10px] font-bold uppercase",
                            payout.status.toLowerCase() === "paid" ? "bg-[#22C55E] text-white" : 
                            payout.status.toLowerCase() === "pending" || payout.status.toLowerCase() === "processing" ? "bg-[#FDB022] text-white" : 
                            "bg-[#F04438] text-white"
                          )}>
                            {payout.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 border-r border-gray-100 text-gray-500 font-medium">{payout.code}</td>
                        <td className="px-4 py-4 border-r border-gray-100 text-gray-500">
                          {format(new Date(payout.createdAt), "MMM d, yyyy h:mm a")}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                                <MoreHorizontal size={18} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem 
                                onClick={() => handleViewMetadata(payout)}
                                className="text-xs font-semibold cursor-pointer"
                              >
                                View Metadata
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-xs font-semibold cursor-pointer">
                                Export Receipt
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
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-6 text-sm py-4">
                <p className="text-gray-500 font-medium">
                  Total <span className="text-gray-900 font-bold">{totalCount} items</span>
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-gray-400 hover:text-orange-500" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    <ChevronLeft size={18} />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                    className="h-8 w-8 text-gray-400 hover:text-orange-500"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    <ChevronRight size={18} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metadata Modal */}
      {metadataModalOpen && metadataContent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Payout Metadata</h3>
                <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-wider">
                  Reference: {metadataContent.code}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMetadataModalOpen(false)}
                className="rounded-full hover:bg-gray-100"
              >
                <X size={20} className="text-gray-400" />
              </Button>
            </div>
            <div className="p-6 bg-[#111827]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">JSON Payload</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopyMetadata}
                  className="h-8 text-gray-400 hover:text-white hover:bg-white/10 text-[10px] font-bold uppercase gap-2"
                >
                  <Copy size={14} /> Copy to clipboard
                </Button>
              </div>
              <pre className="text-[#9CA3AF] text-xs font-mono overflow-x-auto h-[400px] scrollbar-hide p-4 bg-black/20 rounded-xl leading-relaxed">
                {JSON.stringify(metadataContent, null, 2)}
              </pre>
            </div>
            <div className="p-6 bg-white border-t border-gray-100 flex justify-end">
              <Button 
                onClick={() => setMetadataModalOpen(false)}
                className="bg-[#E86B35] hover:bg-[#D15A2A] text-white font-bold px-8 h-11 rounded-lg transition-colors"
              >
                Close Metadata View
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
