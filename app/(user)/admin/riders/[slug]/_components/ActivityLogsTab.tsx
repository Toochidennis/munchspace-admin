"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Calendar, ChevronDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Activity {
  note: string;
  createdAt: string;
  time: string;
}

interface ActivityGroup {
  date: string;
  activities: Activity[];
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
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

export default function ActivityLogsTab({ riderId }: { riderId: string }) {
  const [activities, setActivities] = useState<ActivityGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRange, setSelectedRange] = useState("last_7_days");

  const fetchActivities = useCallback(async (page = 1, append = false) => {
    if (!riderId) return;
    
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        range: selectedRange,
        ...(searchQuery && { keyword: searchQuery }),
      });

      const res = await authenticatedFetch(`/admin/riders/${riderId}/activity?${queryParams.toString()}`);
      const apiRes = await parseApiResponse(res);

      if (apiRes?.success) {
        if (append) {
          // Merge logic for grouped dates
          setActivities(prev => {
            const newGroups = [...prev];
            apiRes.data.data.forEach((newGroup: ActivityGroup) => {
              const existingGroup = newGroups.find(g => g.date === newGroup.date);
              if (existingGroup) {
                existingGroup.activities = [...existingGroup.activities, ...newGroup.activities];
              } else {
                newGroups.push(newGroup);
              }
            });
            return newGroups;
          });
        } else {
          setActivities(apiRes.data.data);
        }
        setMeta(apiRes.data.meta);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [riderId, selectedRange, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActivities(1, false);
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchActivities]);

  const loadMore = () => {
    if (meta && meta.hasNextPage) {
      fetchActivities(meta.page + 1, true);
    }
  };

  const getRangeLabel = () => {
    return RANGE_OPTIONS.find(o => o.value === selectedRange)?.label || "Filter by Date";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Search and Filter Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Input
            placeholder="Search logs by name or action"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 pl-11 border-gray-200 bg-white rounded-lg focus-visible:ring-1 focus-visible:ring-gray-200"
          />
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-11 gap-2 border-gray-200 text-gray-600 font-bold px-5 rounded-lg whitespace-nowrap min-w-[160px]"
            >
              <Calendar size={18} className="text-gray-400" />
              {getRangeLabel()}
              <ChevronDown size={16} className="text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 shadow-xl border-gray-100 rounded-xl max-h-[300px] overflow-y-auto">
            {RANGE_OPTIONS.map((opt) => (
              <DropdownMenuItem 
                key={opt.value} 
                className={cn("font-medium py-3 cursor-pointer", selectedRange === opt.value && "text-[#E86B35] bg-orange-50")}
                onClick={() => setSelectedRange(opt.value)}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Timeline Section */}
      <div className="space-y-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#E86B35]" />
            <p className="text-sm text-gray-400 font-medium italic">Loading activity history...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-medium">
            No activity logs found for this period.
          </div>
        ) : (
          activities.map((day, dayIdx) => (
            <div key={dayIdx}>
              {/* Date Header with Line */}
              <div className="flex items-center gap-4 mb-8">
                <h3 className="text-sm font-bold text-gray-400 whitespace-nowrap uppercase tracking-wider">
                  {format(new Date(day.date), "EEEE, do MMM yyyy")}
                </h3>
                <div className="w-full h-[1px] bg-gray-100" />
              </div>

              {/* Logs List */}
              <div className="relative space-y-12 ml-4">
                {/* Vertical Line Connector */}
                <div className="absolute left-0 top-2 bottom-2 w-[1px] bg-gray-100" />

                {day.activities.map((log, logIdx) => (
                  <div
                    key={logIdx}
                    className="relative pl-10 flex items-start"
                  >
                    {/* Timeline Dot */}
                    <div className="absolute left-[-4.5px] top-[6px] w-2.5 h-2.5 rounded-full bg-gray-300 ring-4 ring-white z-10" />

                    <div className="flex gap-4 items-baseline">
                      <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                        {format(new Date(log.createdAt), "hh:mm a")}:
                      </span>
                      <p className="text-sm text-gray-500 font-medium leading-relaxed">
                        {log.note}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {meta && meta.hasNextPage && (
        <div className="flex justify-center pt-8">
          <Button
            variant="outline"
            disabled={isLoadingMore}
            onClick={loadMore}
            className="h-10 px-8 border-gray-200 text-gray-600 font-bold rounded-md hover:bg-gray-50 transition-all gap-2"
          >
            {isLoadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoadingMore ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
