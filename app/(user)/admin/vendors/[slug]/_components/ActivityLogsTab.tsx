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
import { cn } from "@/lib/utils";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

// --- Types ---
interface LogEntry {
  time: string;
  action: string;
}

interface DayLogs {
  date: string;
  logs: LogEntry[];
}

export default function ActivityLogsTab({ businessId }: { businessId?: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("Last 7 Days");
  
  const [activityData, setActivityData] = useState<DayLogs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchActivities = useCallback(async (resetPage = false) => {
    if (!businessId) return;

    try {
      if (resetPage) setIsLoading(true);
      
      const currentPage = resetPage ? 1 : page;
      const limit = 20;
      
      let startDateStr = "";
      let endDateStr = "";
      const today = new Date();
      
      if (timeFilter === "Today") {
        startDateStr = startOfDay(today).toISOString();
        endDateStr = endOfDay(today).toISOString();
      } else if (timeFilter === "Last 7 Days") {
        startDateStr = startOfDay(subDays(today, 7)).toISOString();
        endDateStr = endOfDay(today).toISOString();
      } else if (timeFilter === "Last 30 Days") {
        startDateStr = startOfDay(subDays(today, 30)).toISOString();
        endDateStr = endOfDay(today).toISOString();
      }

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      
      if (startDateStr) queryParams.append("startDate", startDateStr);
      if (endDateStr) queryParams.append("endDate", endDateStr);
      if (debouncedSearchQuery) queryParams.append("keyword", debouncedSearchQuery);

      const res = await authenticatedFetch(`/admin/businesses/${businessId}/activity?${queryParams.toString()}`);
      const result = await parseApiResponse(res);

      if (result?.success) {
        const newData = result.data.data.map((day: any) => {
          return {
            date: format(new Date(day.date), "EEEE, dd MMM yyyy"),
            logs: day.activities.map((act: any) => ({
              time: format(new Date(act.createdAt || act.time), "hh:mm a"),
              action: act.note,
            })),
          };
        });

        setActivityData(prev => resetPage ? newData : [...prev, ...newData]);
        setHasMore(result.data.meta.hasNextPage);
      }
    } catch (err) {
      console.error("Failed to fetch activity logs", err);
    } finally {
      setIsLoading(false);
    }
  }, [businessId, timeFilter, debouncedSearchQuery, page]);

  useEffect(() => {
    setPage(1);
    fetchActivities(true);
  }, [debouncedSearchQuery, timeFilter, fetchActivities]);

  const handleLoadMore = () => {
    setPage(p => p + 1);
  };

  useEffect(() => {
    if (page > 1) fetchActivities(false);
  }, [page, fetchActivities]);



  return (
    <div className="space-y-8">
      {/* Search and Filter Header */}
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Input
            placeholder="Search logs by name or action"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 pl-11 border-gray-200 rounded-md focus-visible:ring-gray-900 focus-visible:ring-1"
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
              className="h-11 gap-2 border-gray-200 text-gray-700 font-medium px-4 rounded-md"
            >
              <Calendar size={18} className="text-gray-400" />
              {timeFilter}
              <ChevronDown size={16} className="text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setTimeFilter("Today")}>
              Today
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeFilter("Last 7 Days")}>
              Last 7 Days
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeFilter("Last 30 Days")}>
              Last 30 Days
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading && page === 1 ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#E86B35]" />
        </div>
      ) : activityData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No activity logs found.
        </div>
      ) : (
        <div className="space-y-10">
          {activityData.map((day, dayIdx) => (
            <div key={dayIdx} className="relative">
              {/* Date Header with Line */}
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-500 whitespace-nowrap">
                  {day.date}
                </h3>
                <div className="w-full h-[1px] bg-gray-100" />
              </div>

              {/* Logs List */}
              <div className="relative space-y-8 ml-2">
                {/* Vertical Line Connector */}
                <div className="absolute left-[3px] top-2 bottom-2 w-[1.5px] bg-gray-100" />

                {day.logs.map((log, logIdx) => (
                  <div
                    key={logIdx}
                    className="relative pl-8 flex items-start gap-4"
                  >
                    {/* Timeline Dot */}
                    <div className="absolute left-0 top-[6px] w-2 h-2 rounded-full bg-gray-200 ring-4 ring-white z-10" />

                    <div className="flex gap-4 items-baseline">
                      <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                        {log.time}:
                      </span>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {log.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoading}
            className="h-10 px-6 border-gray-200 text-gray-700 font-normal rounded-md shadow-sm"
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
