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
  Eye,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MOCK_SALES_ORDERS, dailyData } from "../lib/dashboard-data";
import { getFilteredData, getPageNumbers } from "../lib//dashboard-utils";
import { StatCard } from "./StatCard";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

export const SalesView = ({ range = "last_30_days", refreshTrigger = 0 }: { range?: string, refreshTrigger?: number }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchDashboardData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        type: "sales",
        range: range,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (debouncedSearch) params.append("search", debouncedSearch);

      const res = await authenticatedFetch(`/admin/analytics/dashboard?${params.toString()}`);
      const result = await parseApiResponse(res);
      if (result?.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [range, currentPage, itemsPerPage, debouncedSearch, refreshTrigger]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const paginated = useMemo(() => {
    if (!data?.table?.groups) return [];
    const allOrders = data.table.groups.flatMap((g: any) => g.orders || []);
    return allOrders.map((o: any) => ({
      id: o.orderId,
      orderCode: o.orderCode || o.orderId,
      date: o.createdAt ? format(new Date(o.createdAt), "do MMM yyyy, h:mm a") : "—",
      customer: o.customerName || "Unknown",
      vendor: o.businessName || "Unknown",
      status: o.status?.label || "Unknown",
      amount: `₦${o.totalAmount?.toLocaleString() || 0}`,
    }));
  }, [data]);

  const tableDataLength = data?.table?.total || 0;

  const dynamicDailyData = useMemo(() => {
    if (!data?.charts?.salesTrend?.currentMonth?.length) return dailyData;
    const res: any[] = [];
    const current = data.charts.salesTrend.currentMonth;
    const previous = data.charts.salesTrend.previousMonth || [];
    current.forEach((item: any, i: number) => {
      res.push({
        day: new Date(item.date).getDate().toString(),
        thisMonth: item.value,
        lastMonth: previous[i]?.value || 0
      });
    });
    return res;
  }, [data]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Sales" value={`₦${data?.summary?.totalSalesAmount?.toLocaleString() || "0"}`} trend={`${data?.trends?.totalSalesAmount?.percentageChange || 0}%`} trendType={data?.trends?.totalSalesAmount?.trend === "down" ? "down" : "up"} />
        <StatCard title="Total Orders" value={data?.summary?.completedOrdersCount?.toLocaleString() || "0"} trend={`${data?.trends?.completedOrdersCount?.percentageChange || 0}%`} trendType={data?.trends?.completedOrdersCount?.trend === "down" ? "down" : "up"} />
        <StatCard title="Average Order Value (AOV)" value={`₦${data?.summary?.averageOrderValue?.toLocaleString() || "0"}`} trend={`${data?.trends?.averageOrderValue?.percentageChange || 0}%`} trendType={data?.trends?.averageOrderValue?.trend === "down" ? "down" : "up"} />
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
            <LineChart data={dynamicDailyData}>
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
              Sales Orders ({tableDataLength})
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
          <div className="py-2" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/30">
                  <th className="p-4 text-left font-medium text-gray-500">Order ID</th>
                  <th className="p-4 text-left font-medium text-gray-500">Date Created</th>
                  <th className="p-4 text-left font-medium text-gray-500">Customer Name</th>
                  <th className="p-4 text-left font-medium text-gray-500">Vendor Name</th>
                  <th className="p-4 text-left font-medium text-gray-500">Status</th>
                  <th className="p-4 text-left font-medium text-gray-500">Total Amount</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item: any) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{item.orderCode}</td>
                    <td className="p-4 text-gray-600">{item.date}</td>
                    <td className="p-4 text-gray-600">{item.customer}</td>
                    <td className="p-4 text-gray-600">{item.vendor}</td>
                    <td className="p-4">
                      <Badge className={cn(
                        "rounded-md px-2 py-0.5 font-medium text-[11px] uppercase",
                        item.status === "Completed" ? "bg-green-100 text-green-700" :
                        item.status === "Cancelled" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      )}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="p-4 font-medium text-gray-900">{item.amount}</td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal size={18} className="text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-md w-48">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/orders/${item.id}`}
                              className="flex items-center gap-2 py-2.5 w-full cursor-pointer"
                            >
                              <Eye size={16} className="text-gray-400" /> View Details
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
