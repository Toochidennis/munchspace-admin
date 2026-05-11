"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Calendar, ChevronLeft, ChevronRight, ChevronDown, MoreHorizontal, Loader2 } from "lucide-react";
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

interface DeliveryGroup {
  status: {
    key: string;
    label: string;
  };
  total: number;
}

interface Delivery {
  orderId: string;
  orderCode: string;
  customerFullName: string;
  status: {
    key: string;
    label: string;
  };
  timeLeftForDelivery: string | null;
  pickupAddress: string;
  dropoffAddress: string;
  startedAt: string;
  pickedUpAt: string;
  completedAt: string;
  expectedPickupTime: string;
  expectedDeliveryTime: string;
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

export default function DeliveriesTab({ riderId }: { riderId: string }) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [groups, setGroups] = useState<DeliveryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRange, setSelectedRange] = useState("last_7_days");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const fetchDeliveries = useCallback(async () => {
    if (!riderId) return;
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        range: selectedRange,
        ...(searchQuery && { search: searchQuery }),
        ...(activeTab !== "all" && { status: activeTab }),
      });

      const res = await authenticatedFetch(`/admin/fulfillments/deliveries?${queryParams.toString()}`);
      const apiRes = await parseApiResponse(res);
      console.log(apiRes, "apiRes");
      if (apiRes?.success) {
        setDeliveries(apiRes.data.deliveries);
        setGroups(apiRes.data.groups);
        setTotalPages(apiRes.data.totalPages);
        setTotalCount(apiRes.data.total);
      }
    } catch (error) {
      console.error("Failed to fetch deliveries:", error);
    } finally {
      setIsLoading(false);
    }
  }, [riderId, currentPage, selectedRange, searchQuery, activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDeliveries();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchDeliveries]);

  const toggleRow = (orderId: string) => {
    setExpandedRows(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return format(new Date(dateStr), "h:mm a");
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
      <Card className="border border-gray-100 rounded-xl bg-white p-6">
        
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900 font-inter">Total ({totalCount})</h2>
          
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

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-100 mb-6 overflow-x-auto scrollbar-hide">
          {[
            { status: { key: "all", label: "All" }, total: totalCount },
            ...groups.filter(g => g.total > 0)
          ].map((tab) => (
            <button
              key={tab.status.key}
              onClick={() => {
                setActiveTab(tab.status.key);
                setCurrentPage(1);
              }}
              className={cn(
                "pb-4 text-xs font-bold transition-all relative whitespace-nowrap",
                activeTab === tab.status.key ? "text-[#E86B35]" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {tab.status.label} {tab.total}
              {activeTab === tab.status.key && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E86B35]" />
              )}
            </button>
          ))}
        </div>

        {/* Table Content */}
        <div className="overflow-hidden border border-gray-100 rounded-md">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-[#F9FAFB] text-gray-900 border-b border-gray-100 font-bold">
              <tr>
                <th className="p-4 w-12"><input type="checkbox" className="rounded" /></th>
                <th className="p-4 border-r border-gray-100">Order ID</th>
                <th className="p-4 border-r border-gray-100">Customer Name</th>
                <th className="p-4 border-r border-gray-100">Time Left For Delivery</th>
                <th className="p-4 border-r border-gray-100">Status</th>
                <th className="p-4 text-center">-</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-[#E86B35]" />
                      <p className="text-gray-400 font-medium italic">Fetching deliveries...</p>
                    </div>
                  </td>
                </tr>
              ) : deliveries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-500 font-medium">
                    No deliveries found matching your criteria.
                  </td>
                </tr>
              ) : (
                deliveries.map((item, idx) => {
                  const isExpanded = expandedRows.includes(item.orderId);
                  return (
                    <React.Fragment key={item.orderId}>
                      <tr className={cn("hover:bg-gray-50/30 transition-colors", isExpanded && "bg-gray-50/50")}>
                        <td className="p-4 w-12 border-r border-gray-100"><input type="checkbox" className="rounded" /></td>
                        <td className="p-4 border-r border-gray-100 text-gray-500 font-medium">{item.orderCode}</td>
                        <td className="p-4 border-r border-gray-100 text-gray-900 font-bold">{item.customerFullName}</td>
                        <td className="p-4 border-r border-gray-100 text-gray-500">{item.timeLeftForDelivery || "-"}</td>
                        <td className="p-4 border-r border-gray-100">
                          <Badge className={cn(
                            "border-none px-3 py-1 rounded-md text-[10px] font-bold uppercase",
                            item.status.key === "completed" ? "bg-[#22C55E] text-white" : 
                            item.status.key === "ongoing" ? "bg-[#3B82F6] text-white" : "bg-gray-400 text-white"
                          )}>
                            {item.status.label}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                            <MoreHorizontal size={18} />
                          </Button>
                        </td>
                      </tr>
                      
                      {/* Expandable Info Row */}
                      <tr>
                        <td colSpan={6} className="p-0">
                          <div className="px-6 py-3 bg-white flex justify-between items-center border-t border-gray-50">
                            <span className="text-gray-400 text-xs">More delivery informations</span>
                            <button 
                              onClick={() => toggleRow(item.orderId)}
                              className="flex items-center gap-1 text-gray-900 text-xs font-normal hover:underline"
                            >
                              {isExpanded ? "Collapse" : "Expand"} <ChevronDown size={14} className={cn("transition-transform text-gray-400", isExpanded && "rotate-180")} />
                            </button>
                          </div>
                          
                          {isExpanded && (
                            <div className="px-6 lg:px-24 py-6 bg-white border-t border-gray-50 animate-in fade-in slide-in-from-top-1 duration-200">
                              <div className="max-w-3xl mx-auto space-y-4">
                                {/* Locations */}
                                <div className="space-y-2 pb-4 border-b border-gray-100">
                                  <div className="flex justify-between items-start gap-8">
                                    <span className="text-gray-400 text-xs flex-shrink-0">Pickup Location</span>
                                    <span className="text-gray-900 text-xs font-normal text-right">{item.pickupAddress}</span>
                                  </div>
                                  <div className="flex justify-between items-start gap-8">
                                    <span className="text-gray-400 text-xs flex-shrink-0">Delivery Location</span>
                                    <span className="text-gray-900 text-xs font-normal text-right">{item.dropoffAddress}</span>
                                  </div>
                                </div>

                                {/* Actual Timestamps */}
                                <div className="space-y-2 pb-4 border-b border-gray-100">
                                  <div className="flex justify-between items-center gap-8">
                                    <span className="text-gray-400 text-xs flex-shrink-0">Started at</span>
                                    <span className="text-gray-900 text-xs font-normal text-right">{formatDateTime(item.startedAt)}</span>
                                  </div>
                                  <div className="flex justify-between items-center gap-8">
                                    <span className="text-gray-400 text-xs flex-shrink-0">Pickup at</span>
                                    <span className="text-gray-900 text-xs font-normal text-right">{formatDateTime(item.pickedUpAt)}</span>
                                  </div>
                                  <div className="flex justify-between items-center gap-8">
                                    <span className="text-gray-400 text-xs flex-shrink-0">Completed at</span>
                                    <span className="text-gray-900 text-xs font-normal text-right">{formatDateTime(item.completedAt)}</span>
                                  </div>
                                </div>

                                {/* Expected SLA times */}
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center gap-8">
                                    <span className="text-gray-400 text-xs flex-shrink-0">Expected Pickup Time</span>
                                    <span className="text-gray-900 text-xs font-normal text-right">{formatDateTime(item.expectedPickupTime)}</span>
                                  </div>
                                  <div className="flex justify-between items-center gap-8">
                                    <span className="text-gray-400 text-xs flex-shrink-0">Expected Delivery Time</span>
                                    <span className="text-gray-900 text-xs font-normal text-right">{formatDateTime(item.expectedDeliveryTime)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-6 text-sm mt-8">
            <p className="text-gray-500 font-medium">
              Total <span className="text-gray-900 font-bold">{totalCount} items</span>
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-gray-400" 
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
                className="h-8 w-8 text-gray-400"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight size={18} />
              </Button>
            </div>
            <Select value="20">
              <SelectTrigger className="w-[100px] h-10 bg-white border-gray-200 text-xs font-bold rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
