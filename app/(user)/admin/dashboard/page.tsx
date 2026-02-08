"use client";

import React, { useState, useMemo } from "react";
import {
  Bell,
  Download,
  Filter,
  RefreshCcw,
  Calendar,
  MoreHorizontal,
  ArrowUpRight,
  Info,
  Search,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Store,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";

/* --- DATA & RENDERERS --- */
const dailyData = [
  { day: "11th", thisMonth: 22000, lastMonth: 25000 },
  { day: "12th", thisMonth: 19000, lastMonth: 25000 },
  { day: "13th", thisMonth: 22000, lastMonth: 18000 },
  { day: "14th", thisMonth: 34000, lastMonth: 21000 },
  { day: "15th", thisMonth: 32000, lastMonth: 32000 },
];

const completionData = [
  { name: "Completed Orders", value: 70, color: "#00C950" },
  { name: "Incomplete Orders", value: 30, color: "#D28E00" },
];

const MOCK_ROWS = Array.from({ length: 45 }, (_, i) => ({
  id: `#10${i + 10}`,
  date: "Mon Mar 21 2026",
  customer: i % 2 === 0 ? "Idris Bello" : "Sarah James",
  vendor: i % 3 === 0 ? "Buka Restaurant" : "Mama Cass",
  status: i % 4 === 0 ? "Delivered" : "Awaiting confirmation",
  amount: `₦${(Math.floor(Math.random() * 10) + 2) * 500}`,
}));

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const RADIAN = Math.PI / 180;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-[12px] font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("orders");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredData = useMemo(() => {
    return MOCK_ROWS.filter(
      (item) =>
        item.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.includes(searchQuery),
    );
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      )
        pages.push(i);
      else if (pages[pages.length - 1] !== "...") pages.push("...");
    }
    return pages;
  };

  return (
    <>
      <header className="h-[72px] bg-white border-b flex items-center justify-between px-8 flex-shrink-0 z-20">
        <h1 className="text-xl font-medium text-[#1A1C1E]">Dashboard</h1>
        <div className="flex items-center gap-5">
          <Button variant="ghost" size="icon" className="relative h-10 w-10">
            <Bell size={22} className="text-slate-600" />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#FF3B30] rounded-full border-2 border-white"></span>
          </Button>
          <div className="flex items-center gap-3 pl-5 border-l h-10">
            <p className="text-sm font-medium text-[#1A1C1E] hidden sm:block">
              James Author
            </p>
            <div className="w-10 h-10 rounded bg-black text-white flex items-center justify-center text-xs font-bold">
              JA
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v);
              setCurrentPage(1);
            }}
            className="w-auto"
          >
            <TabsList className="bg-[#F1F3F5] p-1 h-12 border-none">
              <TabsTrigger
                value="orders"
                className="gap-2 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                <ShoppingBag
                  size={18}
                  className={
                    activeTab === "orders"
                      ? "text-orange-500"
                      : "text-slate-400"
                  }
                />{" "}
                <span className="font-medium text-sm">Orders</span>
              </TabsTrigger>
              <TabsTrigger
                value="vendors"
                className="gap-2 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                <Store
                  size={18}
                  className={
                    activeTab === "vendors"
                      ? "text-orange-500"
                      : "text-slate-400"
                  }
                />{" "}
                <span className="font-medium text-sm">Vendors</span>
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="gap-2 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                <ArrowUpRight
                  size={18}
                  className={
                    activeTab === "sales" ? "text-orange-500" : "text-slate-400"
                  }
                />{" "}
                <span className="font-medium text-sm">Sales</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 text-slate-500 border-slate-200"
            >
              <RefreshCcw size={18} />
            </Button>
            <Select defaultValue="30">
              <SelectTrigger className="h-11 w-[180px] font-medium bg-white border-slate-200">
                <Calendar size={18} className="mr-2 text-slate-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {activeTab === "orders" && <OrdersContent />}
        {activeTab === "vendors" && <VendorsContent />}
        {activeTab === "sales" && <SalesContent />}

        {/* REUSABLE TABLE WITH YOUR PAGINATION CODE */}
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="p-6 flex flex-wrap justify-between items-center border-b gap-4">
            <h3 className="font-semibold text-lg text-slate-900 capitalize">
              {activeTab} List ({filteredData.length})
            </h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <Input
                  placeholder="Search..."
                  className="pl-9 h-10 w-64 bg-[#F8F9FA] border-none text-xs"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <Button
                variant="outline"
                className="h-10 text-xs border-slate-200 text-slate-600 font-medium"
              >
                <Download size={14} className="mr-2" /> Download
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F8F9FA] text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="p-4 w-10">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="p-4">ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Vendor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-center">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="p-4 text-slate-500 font-medium">{row.id}</td>
                    <td className="p-4 text-slate-500">{row.date}</td>
                    <td className="p-4 font-medium">{row.customer}</td>
                    <td className="p-4 text-slate-500">{row.vendor}</td>
                    <td className="p-4">
                      <Badge
                        className={cn(
                          "border-none px-2 py-0.5 text-[10px]",
                          row.status === "Delivered"
                            ? "bg-green-50 text-green-600"
                            : "bg-orange-50 text-orange-600",
                        )}
                      >
                        {row.status}
                      </Badge>
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {row.amount}
                    </td>
                    <td className="p-4 text-right">
                      <MoreHorizontal
                        size={16}
                        className="text-slate-300 inline cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION INTEGRATION */}
          <div className="p-6 border-t bg-white">
            {paginatedData.length > 0 && (
              <div className="flex items-center justify-center mx-2 gap-5 text-sm">
                <p className="text-gray-600 hidden md:block">
                  Total <span>{filteredData.length}</span> items
                </p>
                <div className="flex items-center gap-2 md:gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-2">
                    {getPageNumbers().map((page, idx) => (
                      <div key={idx}>
                        {page === "..." ? (
                          <span className="text-gray-500 px-2">-</span>
                        ) : (
                          <Button
                            variant={currentPage === page ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setCurrentPage(page as number)}
                            className={cn(
                              "min-w-8 md:min-w-10",
                              currentPage === page &&
                                "bg-orange-500 hover:bg-orange-600 text-white",
                            )}
                          >
                            {page}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <Select
                    value={`${itemsPerPage}`}
                    onValueChange={(v) => {
                      setItemsPerPage(Number(v));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-32 bg-white border-gray-300 hidden md:flex">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 / page</SelectItem>
                      <SelectItem value="20">20 / page</SelectItem>
                      <SelectItem value="50">50 / page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </Card>
      </main>
    </>
  );
}

/* --- SECTION CONTENTS --- */
function OrdersContent() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 border-none shadow-sm h-[380px]">
        <CardHeader className="border-b py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            AOV Comparison
          </CardTitle>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#00C950]" />
              <span className="text-[10px] text-slate-500">Current</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-[10px] text-slate-500">Last Month</span>
            </div>
          </div>
        </CardHeader>
        <div className="h-[280px] p-6 pr-10">
          <ResponsiveContainer width="100%" height="100%">
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
        </div>
      </Card>
      <Card className="border-none shadow-sm flex flex-col h-[380px]">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            OCR Percentage
          </CardTitle>
        </CardHeader>
        <div className="flex-1 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={completionData}
                dataKey="value"
                stroke="white"
                strokeWidth={4}
                label={renderCustomizedLabel}
                labelLine={false}
              >
                {completionData.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="p-4 border-t space-y-2">
          {completionData.map((item) => (
            <div
              key={item.name}
              className="flex justify-between items-center text-xs"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: item.color }}
                />
                {item.name}
              </div>
              <span className="font-bold">{item.value}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function VendorsContent() {
  const data = [
    { n: "Fan", v: 45 },
    { n: "Ami", v: 85 },
    { n: "Xco", v: 60 },
    { n: "Alv", v: 95 },
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-none shadow-sm h-[350px]">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Vendor Performance
          </CardTitle>
        </CardHeader>
        <div className="h-[250px] p-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#F1F3F5"
              />
              <XAxis
                dataKey="n"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
              />
              <Bar
                dataKey="v"
                fill="#00C950"
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="border-none shadow-sm h-[350px]">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Growth
          </CardTitle>
        </CardHeader>
        <div className="p-6 space-y-8">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Buka Restaurant</span>
              <span>85%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-[85%]" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Mama Cass</span>
              <span>60%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 w-[60%]" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SalesContent() {
  const data = Array.from({ length: 12 }, (_, i) => ({
    n: i + 1,
    v: Math.random() * 5000,
  }));
  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Revenue Histogram
        </CardTitle>
      </CardHeader>
      <div className="h-[300px] p-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#F1F3F5"
            />
            <XAxis
              dataKey="n"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10 }}
            />
            <Bar dataKey="v" fill="#7C3AED" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
