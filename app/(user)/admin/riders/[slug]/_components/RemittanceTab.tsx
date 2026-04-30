"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Calendar, ChevronLeft, ChevronRight, MoreHorizontal, Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import { format } from "date-fns";

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

export default function RemittanceTab({ riderId }: { riderId: string }) {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRange, setSelectedRange] = useState("last_30_days");
  const [currentPage, setCurrentPage] = useState(1);

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

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((item, i) => (
          <Card key={i} className="p-6 border border-gray-100 shadow-sm rounded-xl bg-white space-y-3">
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
      <Card className="border border-gray-100 shadow-sm rounded-xl bg-white p-6">
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

        <div className="overflow-hidden border border-gray-100 rounded-md">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-[#F9FAFB] text-gray-900 border-b border-gray-100 font-bold">
              <tr>
                <th className="p-4 w-12"><input type="checkbox" className="rounded" /></th>
                <th className="p-4 border-r border-gray-100">Amount Paid</th>
                <th className="p-4 border-r border-gray-100">Type</th>
                <th className="p-4 border-r border-gray-100">Status</th>
                <th className="p-4 border-r border-gray-100">Payout ID</th>
                <th className="p-4 border-r border-gray-100">Date</th>
                <th className="p-4 text-center">-</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-[#E86B35]" />
                      <p className="text-gray-400 font-medium italic">Loading payout history...</p>
                    </div>
                  </td>
                </tr>
              ) : !Array.isArray(payouts) || payouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-gray-500 font-medium">
                    No payout history found.
                  </td>
                </tr>
              ) : (
                payouts.map((payout, idx) => (
                  <tr key={payout.payoutId} className="hover:bg-gray-50/30 transition-colors">
                    <td className="p-4 w-12 border-r border-gray-100"><input type="checkbox" className="rounded" /></td>
                    <td className="p-4 border-r border-gray-100 text-gray-900 font-bold">NGN {payout.amountPaid.toLocaleString()}</td>
                    <td className="p-4 border-r border-gray-100 text-gray-500 capitalize">{payout.payoutType}</td>
                    <td className="p-4 border-r border-gray-100">
                      <Badge className={cn(
                        "border-none px-3 py-1 rounded-md text-[10px] font-bold uppercase",
                        payout.status === "Paid" ? "bg-[#22C55E] text-white" : "bg-[#FDB022] text-white"
                      )}>
                        {payout.status}
                      </Badge>
                    </td>
                    <td className="p-4 border-r border-gray-100 text-gray-500">{payout.payoutCode}</td>
                    <td className="p-4 border-r border-gray-100 text-gray-500">{format(new Date(payout.date), "MMM d, yyyy h:mm a")}</td>
                    <td className="p-4 text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                        <MoreHorizontal size={18} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
    </div>
  );
}
