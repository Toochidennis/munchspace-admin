"use client";

import React, { useState, useMemo } from "react";
import {
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Info,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_SALES_ORDERS, dailyData } from "../lib/dashboard-data";
import { getFilteredData, getPageNumbers } from "../lib//dashboard-utils";
import { StatCard } from "./StatCard";

export const SalesView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filtered = useMemo(
    () => getFilteredData(MOCK_SALES_ORDERS, searchQuery),
    [searchQuery],
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Sales" value="₦500,000" trend="0.35%" />
        <StatCard title="Total Orders" value="100" trend="0.35%" />
        <StatCard
          title="Average Order Value (AOV)"
          value="₦5,000"
          trend="0.35%"
        />
      </div>

      <Card className="border-none shadow-sm rounded-md">
        <CardHeader className="border-b py-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Sales Trends Over Time
            </CardTitle>
            <Info size={14} className="text-slate-400" />
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" /> This Month
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500" /> Last Month
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#F1F3F5"
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94A3B8" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94A3B8" }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="thisMonth"
                stroke="#00C950"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="lastMonth"
                stroke="#7C3AED"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-md">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">
              Sales Orders ({filtered.length})
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-md"
                />
              </div>
              <Button variant="outline" className="rounded-md">
                <Download size={16} />
              </Button>
              <Button variant="outline" className="rounded-md">
                <Filter size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 py-4 border-b">
            <p className="text-sm">Selected: 0</p>
            <Button variant="outline" size="sm" className="rounded-md">
              Mark Order As...
            </Button>
            <Button variant="outline" size="sm" className="rounded-md">
              Notify Vendor...
            </Button>
            <Button variant="outline" size="sm" className="rounded-md">
              Cancel Order
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left">
                    <Checkbox />
                  </th>
                  <th className="p-4 text-left">Order ID</th>
                  <th className="p-4 text-left">Date Created</th>
                  <th className="p-4 text-left">Customer Name</th>
                  <th className="p-4 text-left">Vendor Name</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Total Amount</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-4">
                      <Checkbox />
                    </td>
                    <td className="p-4">{item.id}</td>
                    <td className="p-4">{item.date}</td>
                    <td className="p-4">{item.customer}</td>
                    <td className="p-4">{item.vendor}</td>
                    <td className="p-4">
                      <Badge className="bg-green-100 text-green-700 rounded-md">
                        {item.status}
                      </Badge>
                    </td>
                    <td className="p-4">{item.amount}</td>
                    <td className="p-4">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
