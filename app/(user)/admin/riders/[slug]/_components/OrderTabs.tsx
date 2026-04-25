"use client";

import React, { useState, useMemo } from "react";
import { Search, Calendar, ChevronLeft, ChevronRight, ChevronDown, Filter, PackageSearch } from "lucide-react";
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

// Mock Data based on the image
const MOCK_ORDERS = Array.from({ length: 85 }, (_, i) => ({
  id: `#${1002 + i}`,
  date: "Today at 9:58 pm",
  customer: i % 3 === 0 ? "idrisjamo12@gmail.com" : "alex.smith@example.com",
  totalPrice: "N7,500",
  status: i === 1 ? "Completed" : i % 5 === 0 ? "Cancelled" : "Pending",
  tabStatus: i % 6 === 0 ? "Awaiting Confirmation" : i % 6 === 1 ? "Awaiting Pickup" : i % 6 === 2 ? "Out for Delivery" : i % 6 === 3 ? "Delivered" : "Cancelled",
  timestamp: new Date(Date.now() - (Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000)),
}));

const TABS = [
  "All",
  "Awaiting Confirmation",
  "Awaiting Pickup",
  "Out for Delivery",
  "Delivered",
  "Cancelled"
];

export default function OrdersTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [dateFilter, setDateFilter] = useState("7");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Dynamic counts for tabs based on search and date filter
  const tabCounts = useMemo(() => {
    const baseFiltered = MOCK_ORDERS.filter((order) => {
      const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           order.customer.toLowerCase().includes(searchQuery.toLowerCase());
      const daysAgo = (Date.now() - order.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      return matchesSearch && daysAgo <= parseInt(dateFilter);
    });

    return {
      All: baseFiltered.length,
      "Awaiting Confirmation": baseFiltered.filter(o => o.tabStatus === "Awaiting Confirmation").length,
      "Awaiting Pickup": baseFiltered.filter(o => o.tabStatus === "Awaiting Pickup").length,
      "Out for Delivery": baseFiltered.filter(o => o.tabStatus === "Out for Delivery").length,
      "Delivered": baseFiltered.filter(o => o.tabStatus === "Delivered").length,
      "Cancelled": baseFiltered.filter(o => o.tabStatus === "Cancelled").length,
    };
  }, [searchQuery, dateFilter]);

  const filteredOrders = useMemo(() => {
    return MOCK_ORDERS.filter((order) => {
      const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           order.customer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === "All" || order.tabStatus === activeTab;
      const daysAgo = (Date.now() - order.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      return matchesSearch && matchesTab && daysAgo <= parseInt(dateFilter);
    });
  }, [searchQuery, activeTab, dateFilter]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentItems = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) pages.push(1, 2, 3, 4, 5, "...", totalPages);
      else if (currentPage > totalPages - 4) pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      else pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  return (
    <div className="w-full">
      <Card className="border border-gray-100 shadow-none rounded-xl bg-white p-6">
        
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900">Total ({filteredOrders.length})</h2>
          
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="h-10 border-gray-200 bg-white rounded-lg pr-10 focus-visible:ring-orange-500"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            
            <Button variant="outline" className="h-10 border-gray-200 text-gray-600 gap-2 px-3 rounded-lg font-medium">
              <Filter size={16} /> Filter <ChevronDown size={16} />
            </Button>

            <Select value={dateFilter} onValueChange={(v) => { setDateFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px] h-10 border-gray-200 text-gray-600 font-medium rounded-lg">
                <Calendar size={16} className="mr-2" />
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dynamic Tabs - Matches Image Labels & Logic */}
        <div className="flex items-center gap-6 border-b border-gray-100 mb-0 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
              className={cn(
                "pb-4 text-sm font-medium transition-all relative whitespace-nowrap",
                activeTab === tab ? "text-[#E86B35]" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {tab} {tabCounts[tab as keyof typeof tabCounts]}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E86B35]" />
              )}
            </button>
          ))}
        </div>

        {/* Table Content */}
        <div className="overflow-hidden min-h-[400px]">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <PackageSearch className="text-gray-200 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900">No orders found</h3>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search terms.</p>
              <Button variant="link" className="text-orange-500 mt-2" onClick={() => {setSearchQuery(""); setActiveTab("All");}}>Clear filters</Button>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="p-4 font-semibold text-gray-900">Order ID</th>
                  <th className="p-4 font-semibold text-gray-900">Date</th>
                  <th className="p-4 font-semibold text-gray-900">Customer</th>
                  <th className="p-4 font-semibold text-gray-900">Total Price</th>
                  <th className="p-4 font-semibold text-gray-900">Payment status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentItems.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="p-4 text-gray-900">{order.id}</td>
                    <td className="p-4 text-gray-600">{order.date}</td>
                    <td className="p-4 text-gray-600">{order.customer}</td>
                    <td className="p-4 text-gray-900 font-medium">{order.totalPrice}</td>
                    <td className="p-4">
                      <Badge className={cn(
                        "border-none px-3 py-1 rounded text-[10px] font-medium transition-colors",
                        order.status === "Completed" ? "bg-green-500 text-white" : 
                        order.status === "Cancelled" ? "bg-red-500 text-white" : 
                        "bg-[#FFB74D] text-white" // Pending orange
                      )}>
                        {order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Section - Same Structure as Items */}
        {filteredOrders.length > 0 && (
          <div className="flex items-center justify-center gap-6 text-sm border-t pt-6">
            <p className="text-gray-500">
              Total <span className="text-gray-900 font-medium">{filteredOrders.length} items</span>
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <ChevronLeft size={18} />
              </Button>
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, i) => (
                  <Button
                    key={i}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    className={cn("h-8 w-8 rounded font-medium", currentPage === page ? "bg-orange-500 text-white hover:bg-orange-600" : "text-gray-500")}
                    onClick={() => typeof page === "number" && setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <ChevronRight size={18} />
              </Button>
            </div>
            <Select value={`${itemsPerPage}`} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
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