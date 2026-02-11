"use client";

import React, { useState } from "react";
import { Search, Calendar, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// --- Types ---
interface LogEntry {
  time: string;
  action: string;
}

interface DayLogs {
  date: string;
  logs: LogEntry[];
}

export default function ActivityLogsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("Last 7 Days");

  // Mock data based on the screenshot
  const activityData: DayLogs[] = [
    {
      date: "Tuesday, 28 Sep 2024",
      logs: [
        {
          time: "01:10 PM",
          action: "Vendor logged in from a new device (IP: 192.168.1.2).",
        },
        {
          time: "03:00 PM",
          action:
            "Admin (John Damson - assumes vendor’s account) logged in from (IP: 192.1688.5.3)",
        },
        {
          time: "03:10 PM",
          action:
            "Admin (John Damson - assumes vendor’s account) uploaded a product.",
        },
        {
          time: "01:10 PM",
          action: "Vendor logged in from a new device (IP: 192.168.1.2).",
        },
        {
          time: "01:10 PM",
          action: "Vendor logged in from a new device (IP: 192.168.1.2).",
        },
      ],
    },
    {
      date: "Tuesday, 29 Sep 2024",
      logs: [
        {
          time: "01:10 PM",
          action: "Vendor logged in from a new device (IP: 192.168.1.2).",
        },
        {
          time: "03:00 PM",
          action:
            "Admin (John Damson - assumes vendor’s account) logged in from (IP: 192.1688.5.3)",
        },
        {
          time: "03:10 PM",
          action:
            "Admin (John Damson - assumes vendor’s account) uploaded a product.",
        },
        {
          time: "01:10 PM",
          action: "Vendor logged in from a new device (IP: 192.168.1.2).",
        },
        {
          time: "01:10 PM",
          action: "Vendor logged in from a new device (IP: 192.168.1.2).",
        },
      ],
    },
  ];

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

      {/* Timeline Section */}
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

      {/* Load More Button */}
      <div className="flex justify-center pt-4">
        <Button
          variant="outline"
          className="h-10 px-6 border-gray-200 text-gray-700 font-semibold rounded-md shadow-sm"
        >
          Load more
        </Button>
      </div>
    </div>
  );
}
