"use client";

import React, { useState, useMemo } from "react";
import { Search, Calendar, ChevronLeft, ChevronRight, ChevronDown, Filter, PackageSearch, MoreHorizontal } from "lucide-react";
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
const MOCK_DELIVERIES = Array.from({ length: 26 }, (_, i) => ({
  id: `#1002`,
  customer: "Idris Bello",
  timeLeft: "20 min 54 sec",
  status: i === 0 ? "Ongoing" : "Completed",
  timestamp: new Date(),
}));

const TABS = [
  "All 26",
  "Ongoing 4",
  "Cancelled 0",
  "Completed 12"
];

export default function DeliveriesTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All 26");
  const [dateFilter, setDateFilter] = useState("7");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const toggleRow = (id: string, index: number) => {
    const rowKey = `${id}-${index}`;
    setExpandedRows(prev => 
      prev.includes(rowKey) ? prev.filter(r => r !== rowKey) : [...prev, rowKey]
    );
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
      <Card className="border border-gray-100 shadow-sm rounded-xl bg-white p-6">
        
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900 font-inter">Total (26)</h2>
          
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 border-gray-200 bg-white rounded-lg pr-10 focus-visible:ring-1 focus-visible:ring-orange-500"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[160px] h-10 border-gray-200 text-gray-600 font-bold rounded-lg">
                <Calendar size={16} className="mr-2" />
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-100 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-4 text-xs font-bold transition-all relative whitespace-nowrap",
                activeTab === tab ? "text-[#E86B35]" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {tab}
              {activeTab === tab && (
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
              {MOCK_DELIVERIES.map((item, idx) => {
                const isExpanded = expandedRows.includes(`${item.id}-${idx}`);
                return (
                  <React.Fragment key={idx}>
                    <tr className={cn("hover:bg-gray-50/30 transition-colors", isExpanded && "bg-gray-50/50")}>
                      <td className="p-4 w-12 border-r border-gray-100"><input type="checkbox" className="rounded" /></td>
                      <td className="p-4 border-r border-gray-100 text-gray-500">{item.id}</td>
                      <td className="p-4 border-r border-gray-100 text-gray-900 font-medium">{item.customer}</td>
                      <td className="p-4 border-r border-gray-100 text-gray-500">{item.timeLeft}</td>
                      <td className="p-4 border-r border-gray-100">
                        <Badge className={cn(
                          "border-none px-3 py-1 rounded-md text-[10px] font-bold uppercase",
                          item.status === "Completed" ? "bg-[#22C55E] text-white" : "bg-[#3B82F6] text-white"
                        )}>
                          {item.status}
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
                        <div className="px-4 py-3 bg-white flex justify-between items-center text-xs">
                          <span className="text-gray-500 font-medium italic">More delivery informations</span>
                          <button 
                            onClick={() => toggleRow(item.id, idx)}
                            className="flex items-center gap-1 text-gray-900 font-bold hover:underline"
                          >
                            {isExpanded ? "Collapse" : "Expand"} <ChevronDown size={14} className={cn("transition-transform", isExpanded && "rotate-180")} />
                          </button>
                        </div>
                        
                        {isExpanded && (
                          <div className="px-20 py-8 bg-[#F9FAFB] animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="max-w-2xl ml-auto space-y-6">
                              <div className="grid grid-cols-[1fr,2fr] gap-4">
                                <span className="text-gray-400 font-medium">Pickup Location</span>
                                <span className="text-gray-900 font-bold text-right">15 Admiralty Wy, Lekki Phase I, Lekki 106104, Lagos</span>
                              </div>
                              <div className="grid grid-cols-[1fr,2fr] gap-4">
                                <span className="text-gray-400 font-medium">Delivery Location</span>
                                <span className="text-gray-900 font-bold text-right">Plot 5, Ilupeju Street Lagos State</span>
                              </div>
                              <div className="grid grid-cols-[1fr,2fr] gap-4 border-t border-gray-100 pt-6">
                                <span className="text-gray-400 font-medium">Started at</span>
                                <span className="text-gray-900 font-bold text-right">3:12 PM</span>
                              </div>
                              <div className="grid grid-cols-[1fr,2fr] gap-4">
                                <span className="text-gray-400 font-medium">Pickup at</span>
                                <span className="text-gray-900 font-bold text-right">3:30 PM</span>
                              </div>
                              <div className="grid grid-cols-[1fr,2fr] gap-4 border-b border-gray-100 pb-6">
                                <span className="text-gray-400 font-medium">Completed at</span>
                                <span className="text-gray-900 font-bold text-right">4:00 PM</span>
                              </div>
                              <div className="grid grid-cols-[1fr,2fr] gap-4">
                                <span className="text-gray-400 font-medium">Expected Pickup Time</span>
                                <span className="text-gray-900 font-bold text-right">3:15 PM</span>
                              </div>
                              <div className="grid grid-cols-[1fr,2fr] gap-4">
                                <span className="text-gray-400 font-medium">Expected Delivery Time</span>
                                <span className="text-gray-900 font-bold text-right">4:05 PM</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-6 text-sm mt-8">
          <p className="text-gray-500 font-medium">
            Total <span className="text-gray-900 font-bold">85 items</span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" disabled>
              <ChevronLeft size={18} />
            </Button>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, "...", 50].map((page, i) => (
                <Button
                  key={i}
                  variant={page === 1 ? "outline" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 w-8 rounded-md font-bold text-xs transition-all",
                    page === 1 ? "border-[#E86B35] text-[#E86B35]" : "text-gray-400"
                  )}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
              <ChevronRight size={18} />
            </Button>
          </div>
          <Select value="10">
            <SelectTrigger className="w-[100px] h-10 bg-white border-gray-200 text-xs font-bold rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
    </div>
  );
}