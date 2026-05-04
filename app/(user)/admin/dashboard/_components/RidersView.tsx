"use client";

import React, { useState, useMemo } from "react";
import {
  Download,
  Filter,
  Search,
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
import { StatCard } from "./StatCard";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";

export const RidersView = ({ range = "last_30_days", refreshTrigger = 0 }: { range?: string, refreshTrigger?: number }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRiders, setSelectedRiders] = useState<string[]>([]);

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
        type: "riders",
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
    if (!data?.table?.data) return [];
    return data.table.data.map((r: any) => ({
      id: r.riderId,
      name: r.riderName || "Unknown",
      status: r.status || "Unknown",
      totalDelivered: r.totalDelivered || 0,
      totalFailed: r.totalFailed || 0,
      successRate: `${r.successRate || 0}%`,
      earnings: `₦${r.totalEarnings?.toLocaleString() || 0}`,
    }));
  }, [data]);

  const tableDataLength = data?.table?.pagination?.total || 0;

  const dynamicDailyData = useMemo(() => {
    if (!data?.charts?.deliveryTrend?.currentPeriod?.length) return [];
    const res: any[] = [];
    const current = data.charts.deliveryTrend.currentPeriod;
    const previous = data.charts.deliveryTrend.previousPeriod || [];
    current.forEach((item: any, i: number) => {
      res.push({
        day: new Date(item.date).getDate().toString(),
        thisPeriod: item.value,
        lastPeriod: previous[i]?.value || 0
      });
    });
    return res;
  }, [data]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Riders" value={data?.summary?.totalRiders?.toLocaleString() || "0"} trend={`${data?.trends?.totalRiders?.percentageChange || 0}%`} trendType={data?.trends?.totalRiders?.trend === "down" ? "down" : "up"} />
        <StatCard title="Approved Riders" value={data?.summary?.approvedRiders?.toLocaleString() || "0"} trend={`${data?.trends?.approvedRiders?.percentageChange || 0}%`} trendType={data?.trends?.approvedRiders?.trend === "down" ? "down" : "up"} />
        <StatCard title="Total Delivered" value={data?.summary?.totalDelivered?.toLocaleString() || "0"} trend={`${data?.trends?.totalDelivered?.percentageChange || 0}%`} trendType={data?.trends?.totalDelivered?.trend === "down" ? "down" : "up"} />
        <StatCard title="Success Rate" value={`${data?.summary?.successRate || "0"}%`} trend={`${data?.trends?.successRate?.percentageChange || 0}%`} trendType={data?.trends?.successRate?.trend === "down" ? "down" : "up"} />
      </div>

      <Card className="border-none shadow-sm rounded-md">
        <CardHeader className="border-b py-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Delivery Trends Over Time
            </CardTitle>
            <Info size={14} className="text-slate-400" />
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" /> This Period
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500" /> Last Period
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
                dataKey="thisPeriod"
                stroke="#00C950"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="lastPeriod"
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
              Riders ({tableDataLength})
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
            <p className="text-sm">Selected: {selectedRiders.length}</p>
            <Button variant="outline" size="sm" className="rounded-md">
              Notify Rider...
            </Button>
          </div>
          <div className="border border-gray-100 rounded-xl overflow-hidden bg-white mx-6 mb-6">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-[#F8FAFC] text-gray-500 font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-4 w-12">
                    <Checkbox
                      className="border-gray-300 data-[state=checked]:bg-[#E86B35] data-[state=checked]:border-[#E86B35]"
                      checked={
                        selectedRiders.length === paginated.length &&
                        paginated.length > 0
                      }
                      onCheckedChange={(checked) => {
                        setSelectedRiders(
                          checked ? paginated.map((v: any) => v.id) : [],
                        );
                      }}
                    />
                  </th>
                  <th className="p-4">Rider ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Delivered</th>
                  <th className="p-4">Failed</th>
                  <th className="p-4">Success Rate</th>
                  <th className="p-4">Earnings</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">-</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <Checkbox
                        className="border-gray-300 data-[state=checked]:bg-[#E86B35] data-[state=checked]:border-[#E86B35]"
                        checked={selectedRiders.includes(item.id)}
                        onCheckedChange={(c) =>
                          setSelectedRiders((prev) =>
                            c
                              ? [...prev, item.id]
                              : prev.filter((id) => id !== item.id),
                          )
                        }
                      />
                    </td>
                    <td className="p-4 font-bold text-gray-900">{item.id}</td>
                    <td className="p-4 font-bold text-gray-900">{item.name}</td>
                    <td className="p-4 text-gray-600">{item.totalDelivered}</td>
                    <td className="p-4 text-gray-600">{item.totalFailed}</td>
                    <td className="p-4 text-gray-600">{item.successRate}</td>
                    <td className="p-4 font-medium text-gray-900">{item.earnings}</td>
                    <td className="p-4">
                      <Badge className="bg-green-100 text-green-700 rounded-md uppercase font-bold text-[10px]">
                        {item.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
                        <MoreHorizontal size={20} />
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
