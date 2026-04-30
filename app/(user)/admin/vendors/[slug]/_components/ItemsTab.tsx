"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PackageSearch,
  Loader2,
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
import { cn } from "@/lib/utils";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import { toast } from "sonner";

const TABS = [
  { label: "All", key: "all" },
  { label: "Available", key: "AVAILABLE" },
  { label: "Sold Out", key: "SOLD_OUT" },
  { label: "Unavailable", key: "UNAVAILABLE" },
];

export default function ItemsTab({ businessId }: { businessId?: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState<any>({});

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchItems = useCallback(async () => {
    if (!businessId) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (activeTab !== "all") {
        params.append("status", activeTab);
      }
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }
      if (dateFilter !== "all" && dateFilter !== "custom") {
        params.set("range", dateFilter);
      }

      const res = await authenticatedFetch(`/admin/businesses/${businessId}/menu-items?${params.toString()}`);
      const apiRes = await parseApiResponse(res);

      if (apiRes?.success) {
        setItems(apiRes.data.data || []);
        setTotalItems(apiRes.data.meta?.total || 0);
        setTotalPages(apiRes.data.meta?.totalPages || 1);
        setStatusCounts(apiRes.data.statusCounts || {});
      } else {
        toast.error(apiRes?.message || "Failed to fetch items");
      }
    } catch (err) {
      toast.error("An error occurred while fetching items");
    } finally {
      setIsLoading(false);
    }
  }, [businessId, currentPage, itemsPerPage, activeTab, debouncedSearch, dateFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeTab, dateFilter, itemsPerPage]);



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

  return (
    <div className="w-full">
      <Card className="border border-gray-100 shadow-none rounded-xl bg-white p-6">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading...
              </span>
            ) : (
              `Total (${totalItems})`
            )}
          </h2>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 border-gray-200 bg-white rounded-lg pr-10 focus-visible:ring-orange-500"
              />
              <Search
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>

            <Select
              value={dateFilter}
              onValueChange={setDateFilter}
            >
              <SelectTrigger className="w-[160px] h-10 border-gray-200 text-gray-600 font-medium rounded-lg">
                <Calendar size={16} className="mr-2" />
                <SelectValue placeholder="Select range" />
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
          </div>
        </div>

        {/* Tabs - Numbers displayed exactly as in your image */}
        <div className="flex items-center gap-6 border-b border-gray-100 mb-0 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            let count = tab.key === "all" ? Object.values(statusCounts).reduce((a: any, b: any) => a + b, 0) : statusCounts[tab.key] || 0;
            
            // Hide tabs with 0 count except 'all' and currently active
            if (count === 0 && tab.key !== "all" && activeTab !== tab.key)
              return null;
            
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "pb-4 text-sm font-medium transition-all relative whitespace-nowrap",
                  activeTab === tab.key
                    ? "text-[#E86B35]"
                    : "text-gray-400 hover:text-gray-600",
                )}
              >
                {tab.label} {count !== undefined ? `(${count})` : ""}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E86B35]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Table Content */}
        <div className="overflow-hidden min-h-[400px]">
          {isLoading && items.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#E86B35]" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <PackageSearch className="text-gray-200 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900">
                No items found
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                We couldn't find results for your current filters.
              </p>
              <Button
                variant="link"
                className="text-orange-500 mt-2"
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("all");
                  setDateFilter("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="p-4 font-semibold text-gray-900">Items</th>
                  <th className="p-4 font-semibold text-gray-900">
                    Selling Price (₦)
                  </th>
                  <th className="p-4 font-semibold text-gray-900">
                    Discount Price (₦)
                  </th>
                  <th className="p-4 font-semibold text-gray-900">Quantity Sold</th>
                  <th className="p-4 font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/30">
                    <td className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <PackageSearch className="text-gray-300" size={24} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium">
                      {item.price ? item.price.toLocaleString() : "-"}
                    </td>
                    <td className="p-4 font-medium">{item.discount || "-"}</td>
                    <td className="p-4 font-medium">{item.quantitySold}/{item.quantityInStock}</td>
                    <td className="p-4">
                      <Badge
                        className={cn(
                          "text-white border-none px-3 py-1 rounded text-[10px] font-medium uppercase",
                          item.status === "AVAILABLE"
                            ? "bg-[#66BB6A]"
                            : item.status === "SOLD_OUT"
                            ? "bg-orange-500"
                            : "bg-red-500",
                        )}
                      >
                        {item.status?.replace("_", " ") || "UNKNOWN"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Section */}
        {items.length > 0 && (
          <div className="flex items-center justify-center gap-6 text-sm border-t pt-6">
            <p className="text-gray-500">
              Total{" "}
              <span className="text-gray-900 font-medium">
                {totalItems} items
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
