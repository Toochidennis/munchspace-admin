"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  RefreshCcw,
  Calendar,
  MoreHorizontal,
  Home,
  ShoppingBag,
  Store,
  Users,
  Settings,
  LogOut,
  ArrowUpRight,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Data for Orders Section ---
const orderComparisonData = [
  { name: "Week 1", thisMonth: 400, lastMonth: 240 },
  { name: "Week 2", thisMonth: 300, lastMonth: 139 },
  { name: "Week 3", thisMonth: 500, lastMonth: 380 },
  { name: "Week 4", thisMonth: 280, lastMonth: 390 },
  { name: "Week 5", thisMonth: 590, lastMonth: 480 },
];

const completionData = [
  { name: "Completed orders", value: 70, color: "#34C759" },
  { name: "Incomplete orders", value: 30, color: "#E2E8F0" },
];

// --- Data for Other Sections ---
const vendorPerformanceData = [
  { name: "Fan", value: 45 },
  { name: "Ami", value: 85 },
  { name: "Xco", value: 60 },
  { name: "Alv", value: 95 },
  { name: "Tma", value: 20 },
  { name: "Sme", value: 35 },
];

const salesHistogramData = Array.from({ length: 20 }, (_, i) => ({
  name: i + 1,
  value: Math.floor(Math.random() * 1000) + 200,
}));

export default function DashboardPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FAFBFC]">
      {/* FIXED SIDEBAR */}
      <aside
        className={`bg-white border-r transition-all duration-300 flex flex-col h-full sticky top-0 z-30 ${isSidebarCollapsed ? "w-[80px]" : "w-[260px]"}`}
      >
        <div className="p-6 flex items-center justify-between flex-shrink-0">
          {!isSidebarCollapsed && (
            <Image
              src="/logo.svg"
              alt="MunchSpace"
              width={110}
              height={35}
              priority
            />
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-slate-400 p-1 hover:bg-slate-100 rounded transition-colors"
          >
            {isSidebarCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        <div className="px-4 mb-6 flex-shrink-0">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <Input
              placeholder={isSidebarCollapsed ? "" : "Search"}
              className="pl-10 bg-[#F8F9FA] border-none h-11 focus-visible:ring-1 focus-visible:ring-(--color-munchprimary)"
            />
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-hide">
          <NavItem
            icon={<Home size={22} />}
            label="Homepage"
            active
            collapsed={isSidebarCollapsed}
          />
          <NavItem
            icon={<ShoppingBag size={22} />}
            label="Orders"
            collapsed={isSidebarCollapsed}
          />
          <NavItem
            icon={<Store size={22} />}
            label="Vendors"
            collapsed={isSidebarCollapsed}
          />
          <NavItem
            icon={<Users size={22} />}
            label="Customers"
            collapsed={isSidebarCollapsed}
          />
        </nav>

        <div className="p-3 border-t space-y-1 flex-shrink-0">
          <NavItem
            icon={<Settings size={22} />}
            label="Settings"
            collapsed={isSidebarCollapsed}
          />
          <NavItem
            icon={<LogOut size={22} />}
            label="Logout"
            variant="danger"
            collapsed={isSidebarCollapsed}
          />
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* HEADER */}
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

        {/* SCROLLABLE AREA */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
          {/* TAB CONTROLS */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-auto"
            >
              <TabsList className="bg-[#F1F3F5] p-1 h-12 border-none">
                <TabsTrigger
                  value="orders"
                  className="gap-2 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm border-none rounded-md"
                >
                  <ShoppingBag
                    size={18}
                    className={
                      activeTab === "orders"
                        ? "text-(--color-munchprimary)"
                        : "text-slate-400"
                    }
                  />
                  <span className="font-medium text-sm">Orders</span>
                </TabsTrigger>
                <TabsTrigger
                  value="vendors"
                  className="gap-2 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Store
                    size={18}
                    className={
                      activeTab === "vendors"
                        ? "text-(--color-munchprimary)"
                        : "text-slate-400"
                    }
                  />
                  <span className="font-medium text-sm">Vendors</span>
                </TabsTrigger>
                <TabsTrigger
                  value="sales"
                  className="gap-2 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <ArrowUpRight
                    size={18}
                    className={
                      activeTab === "sales"
                        ? "text-(--color-munchprimary)"
                        : "text-slate-400"
                    }
                  />
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
                <SelectTrigger className="h-11 w-[180px] font-medium text-slate-700 bg-white border-slate-200">
                  <Calendar size={18} className="mr-2 text-slate-400" />
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* DYNAMIC VIEWS */}
          {activeTab === "orders" && <OrdersView />}
          {activeTab === "vendors" && <VendorsView />}
          {activeTab === "sales" && <SalesView />}
        </main>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ORDERS SECTION                                                             */
/* -------------------------------------------------------------------------- */

function OrdersView() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="TOTAL ORDERS"
          value="23,154"
          percentage="10.5%"
          trend="up"
        />
        <StatCard
          title="PENDING / UNCONFIRMED"
          value="2,405"
          percentage="5.2%"
          trend="up"
        />
        <StatCard
          title="TOTAL DELIVERED ORDERS"
          value="18,944"
          percentage="12.5%"
          trend="up"
        />
        <StatCard
          title="TOTAL CANCELLED ORDERS"
          value="1,805"
          percentage="2.1%"
          trend="down"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LINE CHART: MONTH COMPARISON */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b py-4">
            <CardTitle className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              Average Order Value (AOV)
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-[#34C759]" />
                <span className="text-[10px] text-slate-400 font-medium">
                  This Month
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-slate-300 border-t border-dashed" />
                <span className="text-[10px] text-slate-400 font-medium">
                  Last Month
                </span>
              </div>
            </div>
          </CardHeader>
          <div className="h-[300px] p-6 pr-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={orderComparisonData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F1F3F5"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  dy={10}
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
                  stroke="#34C759"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="lastMonth"
                  stroke="#94A3B8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* PIE CHART: COMPLETION RATE */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              Order Completion Rate (OCR)
            </CardTitle>
            <Info size={14} className="text-slate-300" />
          </CardHeader>
          <div className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={completionData}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={0}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  {completionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-semibold text-slate-900">70%</span>
              <span className="text-[10px] font-medium text-slate-400">
                Completed
              </span>
            </div>
          </div>
          <div className="p-4 border-t flex justify-center gap-6">
            {completionData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[10px] text-slate-500 font-medium">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <DataTable title="Recent Orders" type="orders" />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* VENDORS SECTION                                                            */
/* -------------------------------------------------------------------------- */

function VendorsView() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="TOTAL VENDORS"
          value="150"
          percentage="10.5%"
          trend="up"
        />
        <StatCard
          title="APPROVED VENDORS"
          value="98"
          percentage="10.5%"
          trend="up"
        />
        <StatCard
          title="PENDING APPROVAL"
          value="12"
          percentage="10.5%"
          trend="down"
        />
        <StatCard
          title="REJECTED VENDORS"
          value="44"
          percentage="10.5%"
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader className="py-5 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              Top-Performing Vendors
            </CardTitle>
          </CardHeader>
          <div className="h-[300px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorPerformanceData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F1F3F5"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                />
                <Tooltip cursor={{ fill: "#F8F9FA" }} />
                <Bar
                  dataKey="value"
                  fill="#34C759"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="py-5 border-b flex items-center justify-between flex-row">
            <CardTitle className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              Top-Selling Items
            </CardTitle>
          </CardHeader>
          <div className="p-0">
            <TopSellingRow
              name="Buka Restaurant"
              percentage={80}
              sold="140 sold"
              color="bg-[#34C759]"
            />
            <div className="h-px bg-slate-50" />
            <TopSellingRow
              name="Mama Cass"
              percentage={76}
              sold="40 sold"
              color="bg-[#007AFF]"
            />
          </div>
        </Card>
      </div>

      <DataTable title="All Vendors" type="vendors" />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* SALES SECTION (HISTOGRAM)                                                   */
/* -------------------------------------------------------------------------- */

function SalesView() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          title="TOTAL SALES"
          value="₦ 5,230,000"
          percentage="14.5%"
          trend="up"
        />
        <StatCard
          title="TOTAL ORDERS"
          value="1,240"
          percentage="8.5%"
          trend="up"
        />
        <StatCard
          title="AVERAGE ORDER VALUE (AOV)"
          value="₦ 4,217"
          percentage="2.5%"
          trend="up"
        />
      </div>
      <Card className="border-none shadow-sm">
        <CardHeader className="py-5 border-b flex justify-between flex-row items-center">
          <CardTitle className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
            Sales Histogram (Daily Volume)
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[10px] font-medium border-slate-200"
          >
            Export CSV
          </Button>
        </CardHeader>
        <div className="h-[350px] p-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesHistogramData} barGap={1}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#F1F3F5"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: "#94A3B8" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94A3B8" }}
              />
              <Tooltip />
              <Bar dataKey="value" fill="#FFB000" radius={[1, 1, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <DataTable title="Sales History" type="sales" />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* REUSABLE UI COMPONENTS                                                     */
/* -------------------------------------------------------------------------- */

function NavItem({
  icon,
  label,
  active = false,
  variant = "default",
  collapsed = false,
}: any) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active ? "bg-(--color-munchprimary) text-white shadow-md shadow-orange-100" : "text-slate-500 hover:bg-slate-50"} ${variant === "danger" ? "text-red-500 mt-auto" : ""} ${collapsed ? "justify-center" : "justify-start"}`}
    >
      {icon}
      {!collapsed && <span className="text-[14px] font-medium">{label}</span>}
    </button>
  );
}

function StatCard({ title, value, percentage, trend }: any) {
  return (
    <Card className="border-none shadow-sm group hover:ring-1 hover:ring-slate-100 transition-all">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-5">
          <p className="text-[9px] font-bold text-slate-400 tracking-[0.1em] uppercase underline decoration-slate-100 underline-offset-[12px]">
            {title}
          </p>
          <ArrowUpRight
            size={14}
            className="text-slate-200 group-hover:text-(--color-munchprimary) transition-colors"
          />
        </div>
        <div className="flex items-end justify-between">
          <h3 className="text-2xl font-medium text-slate-900 tabular-nums">
            {value}
          </h3>
          <div
            className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${trend === "up" ? "text-green-600 bg-green-50 border-green-100" : "text-red-600 bg-red-50 border-red-100"}`}
          >
            <RefreshCcw size={10} /> {percentage}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TopSellingRow({ name, percentage, sold, color }: any) {
  return (
    <div className="p-6 space-y-3">
      <div className="flex justify-between text-sm font-medium">
        <span className="text-slate-800">{name}</span>
        <span className="text-slate-900 font-semibold">{percentage}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
        <span className="text-[10px] text-slate-400 font-medium">{sold}</span>
      </div>
    </div>
  );
}

function DataTable({ title, type }: any) {
  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <div className="p-6 flex justify-between items-center bg-white border-b">
        <h3 className="font-medium text-lg text-slate-900">{title}</h3>
        <div className="flex gap-2">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <Input
              placeholder="Search"
              className="pl-9 h-10 w-60 bg-[#F8F9FA] border-none text-xs focus-visible:ring-1 focus-visible:ring-slate-200"
            />
          </div>
          <Button
            variant="outline"
            className="h-10 gap-2 text-xs border-slate-200 text-slate-600 font-medium"
          >
            <Download size={14} /> Download
          </Button>
          <Button
            variant="outline"
            className="h-10 gap-2 text-xs border-slate-200 text-slate-600 font-medium"
          >
            <Filter size={14} /> Filter
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-[#F8F9FA] text-slate-400 font-bold border-b">
            <tr className="uppercase text-[9px] tracking-widest">
              <th className="p-4 w-10 text-center">
                <input
                  type="checkbox"
                  className="rounded accent-(--color-munchprimary)"
                />
              </th>
              <th className="p-4">ID</th>
              <th className="p-4">
                {type === "vendors" ? "Vendor Name" : "Date Created"}
              </th>
              <th className="p-4">
                {type === "vendors" ? "Reg Date" : "Customer"}
              </th>
              <th className="p-4">Status</th>
              <th className="p-4">Amount</th>
              <th className="p-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {[1, 2, 3, 4].map((i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 text-center">
                  <input type="checkbox" className="rounded cursor-pointer" />
                </td>
                <td className="p-4 text-slate-500 font-medium">#100{i}</td>
                <td className="p-4 font-medium text-slate-800">
                  {type === "vendors" ? "Sabr Collection" : "Mon Mar 21, 2026"}
                </td>
                <td className="p-4 text-slate-500 font-medium">
                  {type === "vendors" ? "Nov 26, 2024" : "Idris Bello"}
                </td>
                <td className="p-4">
                  <Badge className="bg-amber-50 text-amber-600 border-none shadow-none font-medium px-2 py-0.5 text-[10px]">
                    Awaiting Confirmation
                  </Badge>
                </td>
                <td className="p-4 font-semibold text-slate-900">₦7,500</td>
                <td className="p-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-300 hover:text-slate-900 transition-colors"
                  >
                    <MoreHorizontal size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
