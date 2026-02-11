"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Ban,
  Search,
  Download,
  Filter,
  Info,
  Trash2,
  Calendar as CalendarIcon,
  CheckCircle2,
  UserPlus,
  RotateCcw,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Data & Utils
import { MOCK_ORDERS, dailyData, completionData } from "../lib/dashboard-data";
import {
  getFilteredData,
  getPageNumbers,
  renderCustomizedLabel,
} from "../lib/dashboard-utils";
import { StatCard } from "./StatCard";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Order {
  id: string;
  date: string;
  customer: string;
  vendor: string;
  status: string;
  amount: string;
  products: {
    name: string;
    qty: number;
    price: string;
    category: string;
    image: string;
  }[];
  shippingAddress?: string;
  paymentStatus: string;
}

interface Courier {
  id: string;
  name: string;
  locations: string;
  status: "available" | "busy";
  assignments: number;
}

function CustomModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "sm:max-w-[640px]",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full bg-white shadow-xl overflow-hidden rounded animate-in zoom-in-95 duration-200",
          maxWidth,
        )}
      >
        <div className="flex border-b items-center justify-between px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export const OrdersView = () => {
  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [amountQuery, setAmountQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Table States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Modal States
  const [notifyVendorOpen, setNotifyVendorOpen] = useState(false);
  const [notifyCustomerOpen, setNotifyCustomerOpen] = useState(false);
  const [assignCourierOpen, setAssignCourierOpen] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<
    string | null
  >(null);
  const [notificationOption, setNotificationOption] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [courierTab, setCourierTab] = useState<"all" | "unassigned">(
    "unassigned",
  );
  const [courierSearch, setCourierSearch] = useState("");

  const gridLayout = "grid grid-cols-[160px_1fr_1fr_1fr_150px_130px_60px]";

  // Courier mock data (same as reference)
  const couriers: Courier[] = [
    {
      id: "c1",
      name: "Ayodele Muhammed",
      locations: "Agege / Ogba / Abulegba / Iyanapaja",
      status: "available",
      assignments: 0,
    },
    {
      id: "c2",
      name: "Chukwudi Okeke",
      locations: "Ikeja / Alausa / Ojodu / Berger",
      status: "available",
      assignments: 0,
    },
    {
      id: "c3",
      name: "Fatima Ibrahim",
      locations: "Surulere / Yaba / Ebute Metta / Apapa",
      status: "busy",
      assignments: 2,
    },
    {
      id: "c4",
      name: "Emeka Nwosu",
      locations: "Lekki Phase 1 / Phase 2 / Ikate / Admiralty Way",
      status: "available",
      assignments: 0,
    },
    {
      id: "c5",
      name: "Aisha Bello",
      locations: "Victoria Island / Ikoyi / Banana Island",
      status: "available",
      assignments: 1,
    },
  ];

  // 1. Filter Logic for Search/Amount/Dates (Affects Badge Counts)
  const baseFilteredData = useMemo(() => {
    let data = getFilteredData(MOCK_ORDERS, searchQuery);

    if (paymentStatus !== "all") {
      data = data.filter((o) => o.paymentStatus === paymentStatus);
    }

    if (amountQuery) {
      const minAmount = Number(amountQuery);
      if (!isNaN(minAmount)) {
        data = data.filter((o) => {
          const val = Number(o.amount.replace(/[^\d]/g, ""));
          return val >= minAmount;
        });
      }
    }

    if (startDate || endDate) {
      data = data.filter((order) => {
        const orderDate = new Date(order.date);
        if (startDate && orderDate < startDate) return false;
        if (endDate && orderDate > endDate) return false;
        return true;
      });
    }

    return data;
  }, [searchQuery, paymentStatus, startDate, endDate, amountQuery]);

  // 2. Reactive Badge Counts
  const counts = useMemo(
    () => ({
      All: baseFilteredData.length,
      "Awaiting confirmation": baseFilteredData.filter(
        (o) => o.status === "Awaiting confirmation",
      ).length,
      "Awaiting Pickup": baseFilteredData.filter(
        (o) => o.status === "Awaiting Pickup",
      ).length,
      "Out for Delivery": baseFilteredData.filter(
        (o) => o.status === "Out for Delivery",
      ).length,
      Delivered: baseFilteredData.filter((o) => o.status === "Delivered")
        .length,
      Cancelled: baseFilteredData.filter((o) => o.status === "Cancelled")
        .length,
    }),
    [baseFilteredData],
  );

  // 3. Final Table Data (filtered by Status Tab)
  const tableData = useMemo(() => {
    if (statusFilter === "All") return baseFilteredData;
    return baseFilteredData.filter((item) => item.status === statusFilter);
  }, [baseFilteredData, statusFilter]);

  const totalPages = Math.ceil(tableData.length / itemsPerPage);
  const displayedOrders = tableData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const filteredCouriers = useMemo(() => {
    let list = couriers;
    if (courierTab === "unassigned") {
      list = list.filter((c) => c.assignments === 0);
    }
    if (courierSearch.trim()) {
      const term = courierSearch.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.locations.toLowerCase().includes(term),
      );
    }
    return list;
  }, [courierTab, courierSearch]);

  const handleCancelOrder = (ids: string[]) => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1200)), {
      loading: `Cancelling ${ids.length} order${ids.length !== 1 ? "s" : ""}...`,
      success: "Order(s) cancelled successfully",
      error: "Failed to cancel order",
    });
    // In real app → update state / call API
    setSelectedOrders((prev) => prev.filter((id) => !ids.includes(id)));
  };

  return (
    <div className="space-y-8">
      {/* 1. STATS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Orders"
          value={counts.All.toLocaleString()}
          trend="0.35%"
        />
        <StatCard
          title="Pending Orders"
          value={counts["Awaiting confirmation"]}
          trend="0.35%"
        />
        <StatCard
          title="Total Delivered"
          value={counts.Delivered}
          trend="0.35%"
        />
        <StatCard
          title="Total Cancelled"
          value={counts.Cancelled}
          trend="0.35%"
          trendType="down"
        />
      </div>

      {/* 2. CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 border p-0 py-4 shadow-none gap-0 space-y-0 rounded-md">
          <div className="px-9 flex justify-between items-center uppercase border-b pb-3">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold">Average Order Value (AOV)</h1>
              <Tooltip>
                <TooltipTrigger>
                  <Info size={15} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="py-1.5">
                    Average Order Value (AOV) represents the average <br />{" "}
                    amount spent each time a customer places an order.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select defaultValue="delivered">
              <SelectTrigger className="w-fit h-10 rounded shadow-none">
                <SelectValue defaultValue="delivered" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="out for delivery">
                  Out for Delivery
                </SelectItem>
                <SelectItem value="awaiting pickup">Awaiting Pickup</SelectItem>
                <SelectItem value="awaiting confirmation">
                  Awaiting Confirmation
                </SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="border-b border-gray-200 py-2 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-green-400"></span> This
              month
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-purple-500"></span> Last
              month
            </div>
          </div>
          <CardContent className="p-0 pt-6 pe-10">
            <ResponsiveContainer height={250}>
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
                <RechartsTooltip />
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

        {/* Pie Chart Section */}
        <Card className="bg-white border shadow-none gap-0 space-y-0 p-0 py-4 rounded-md overflow-hidden flex flex-col h-full">
          <div className="px-9 flex justify-between items-center uppercase border-b pb-3">
            <div className="flex items-center gap-2 py-1.5">
              <h1 className="font-semibold">order completion rate (OCR)</h1>
              <Tooltip>
                <TooltipTrigger>
                  <Info size={15} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="py-1.5">
                    Order completion rate (OCR) is the percentage
                    <br /> of orders that were successfully completed
                    <br /> out of the total number of orders placed.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <CardContent className="flex-1 flex flex-col items-center p-0 py-6">
            <div className="relative w-full h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionData.filter(
                      (item) =>
                        item.name === "Completed" || item.name === "Pending",
                    )}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={4}
                    labelLine={false}
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      value,
                    }) => {
                      const radius =
                        innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x =
                        cx + radius * Math.cos(-midAngle! * (Math.PI / 180));
                      const y =
                        cy + radius * Math.sin(-midAngle! * (Math.PI / 180));
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="text-lg font-semibold"
                        >
                          {`${value}%`}
                        </text>
                      );
                    }}
                  >
                    {completionData
                      .filter(
                        (item) =>
                          item.name === "Completed" || item.name === "Pending",
                      )
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full mt-8 flex justify-center relative">
              {completionData
                .filter(
                  (item) =>
                    item.name === "Completed" || item.name === "Pending",
                )
                .map((item) => (
                  <div
                    key={item.name}
                    className={cn(
                      "flex flex-col items-start border-r px-3 last:border-none",
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">
                        {item.name === "Completed"
                          ? "Completed Orders"
                          : "Incomplete Orders"}
                      </span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {item.value}%
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. TABLE CARD */}
      <Card className="border-none shadow-sm rounded-md overflow-hidden bg-white">
        <CardHeader className="border-b py-6 px-4 space-y-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Orders ({tableData.length})
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  className="pl-9 h-10 border-gray-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="h-10 border-gray-200">
                <Download size={18} />
              </Button>
              <Button
                variant={isFilterOpen ? "default" : "outline"}
                className={cn(
                  "h-10 border-gray-200",
                  isFilterOpen && "bg-orange-500 hover:bg-orange-600",
                )}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter size={18} />
              </Button>
            </div>
          </div>

          {isFilterOpen && (
            <div className="border-b pb-6 space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 px-3 h-10 bg-gray-50 border rounded-md text-sm text-gray-600">
                  <Filter size={16} /> Filter
                </div>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Min Amount (₦)"
                  value={amountQuery}
                  onChange={(e) => setAmountQuery(e.target.value)}
                  className="w-[180px]"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[200px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate
                        ? format(startDate, "dd/MM/yyyy")
                        : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[200px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(d) =>
                        d && startDate && d < startDate
                          ? toast.error("Invalid date")
                          : setEndDate(d)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setPaymentStatus("all");
                    setStartDate(undefined);
                    setEndDate(undefined);
                    setAmountQuery("");
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Clear
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {Object.entries(counts).map(([label, count]) => (
              <Badge
                key={label}
                onClick={() => {
                  setStatusFilter(label);
                  setCurrentPage(1);
                }}
                className={cn(
                  "cursor-pointer px-3 py-1.5 rounded-md font-medium text-xs transition-colors border-none shadow-none",
                  statusFilter === label
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                )}
              >
                {label} {count}
              </Badge>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Bulk Actions Bar */}
          <div className="flex items-center gap-3 flex-wrap px-6 py-4 border-b bg-white">
            <span className="text-sm">
              Selected: <strong>{selectedOrders.length}</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedOrders.length}
            >
              Mark Order As...
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedOrders.length}
              onClick={() => setNotifyVendorOpen(true)}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                className="w-4 h-4 mr-2"
                alt="WA"
              />
              Notify Vendor...
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedOrders.length}
              onClick={() => setNotifyCustomerOpen(true)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Notify Customer...
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedOrders.length}
              onClick={() => setAssignCourierOpen(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Assign Courier
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-400 border-gray-100"
              disabled={!selectedOrders.length}
              onClick={() => handleCancelOrder(selectedOrders)}
            >
              Cancel Order
            </Button>
          </div>

          {/* HEADER ROW */}
          <div
            className={cn(
              gridLayout,
              "bg-[#F9FAFB] text-gray-900 border-b border-gray-200 text-sm font-medium",
            )}
          >
            <div className="flex items-center gap-3 border-r border-gray-200 py-3 pl-4">
              <Checkbox
                className="rounded-sm"
                onCheckedChange={(checked) =>
                  setSelectedOrders(
                    checked ? displayedOrders.map((o) => o.id) : [],
                  )
                }
              />
              Order ID
            </div>
            <div className="py-3 pl-4 border-r border-gray-200">
              Date Created
            </div>
            <div className="py-3 pl-4 border-r border-gray-200">
              Customer Name
            </div>
            <div className="py-3 pl-4 border-r border-gray-200">
              Vendor Name
            </div>
            <div className="py-3 pl-4 border-r border-gray-200">Status</div>
            <div className="py-3 pl-4 border-r border-gray-200">
              Total Amount
            </div>
            <div className="flex justify-center items-center py-3">-</div>
          </div>

          {/* ROWS */}
          <div className="divide-y divide-gray-100">
            {displayedOrders.map((order) => {
              const isExpanded = expandedRows.includes(order.id);
              return (
                <div
                  key={order.id}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <div
                    className={cn(gridLayout, "text-sm items-stretch bg-white")}
                  >
                    <div className="flex items-center gap-3 border-r border-gray-100 py-4 pl-4">
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={(c) =>
                          setSelectedOrders((p) =>
                            c
                              ? [...p, order.id]
                              : p.filter((i) => i !== order.id),
                          )
                        }
                        className="rounded-sm"
                      />
                      <span className="text-gray-600 font-normal">
                        {order.id}
                      </span>
                    </div>
                    <div className="flex items-center pl-4 text-gray-500 border-r border-gray-100 truncate">
                      {order.date}
                    </div>
                    <div className="flex items-center pl-4 text-gray-900 border-r border-gray-100">
                      {order.customer}
                    </div>
                    <div className="flex items-center pl-4 text-gray-500 border-r border-gray-100 truncate">
                      {order.vendor}
                    </div>
                    <div className="flex items-center border-r border-gray-100 px-4">
                      <span className="bg-[#FDB022] text-white px-2 py-1 rounded-[4px] text-[11px] font-medium whitespace-nowrap w-full text-center">
                        {order.status.slice(0, 14) +
                          (order.status.length > 14 ? "..." : "")}
                      </span>
                    </div>
                    <div className="flex items-center pl-4 text-gray-900 border-r border-gray-100 font-medium">
                      {order.amount}
                    </div>
                    <div className="flex justify-center items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal
                              size={18}
                              className="text-gray-400"
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="rounded-md w-48"
                        >
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/orders/${order.id.replace("#", "")}`}
                              className="flex items-center gap-2 py-2.5 w-full"
                            >
                              <Eye size={16} /> View More Info
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 py-2.5 text-green-600"
                            onClick={() => {
                              setSelectedOrderForAction(order.id);
                              setNotifyVendorOpen(true);
                            }}
                          >
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                              className="w-4 h-4"
                              alt=""
                            />
                            Notify Vendor...
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 py-2.5 text-blue-500"
                            onClick={() => {
                              setSelectedOrderForAction(order.id);
                              setNotifyCustomerOpen(true);
                            }}
                          >
                            <MessageSquare size={16} /> Notify Customer...
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 py-2.5">
                            <CheckCircle2 size={16} /> Mark Order as...
                          </DropdownMenuItem>
                          <div className="h-px bg-gray-100 my-1" />
                          <DropdownMenuItem
                            className="gap-2 py-2.5 text-red-500"
                            onClick={() => handleCancelOrder([order.id])}
                          >
                            <Ban size={16} /> Cancel Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Expanded Products */}
                  <div
                    className={cn(
                      "transition-all duration-200",
                      isExpanded
                        ? "bg-[#F9FAFB] border-t border-gray-100"
                        : "bg-white",
                    )}
                  >
                    <div className="p-3 px-4">
                      <div className="flex justify-between items-center text-[13px] text-gray-500">
                        <span className="pl-1">
                          Includes {order.products.length} product
                          {order.products.length !== 1 ? "s" : ""}
                        </span>
                        <button
                          onClick={() =>
                            setExpandedRows((prev) =>
                              prev.includes(order.id)
                                ? prev.filter((r) => r !== order.id)
                                : [...prev, order.id],
                            )
                          }
                          className="flex items-center gap-1 text-gray-900 font-medium hover:underline"
                        >
                          {isExpanded ? "Collapse" : "Expand"}{" "}
                          <ChevronDown
                            size={16}
                            className={cn(
                              "transition-transform",
                              isExpanded && "rotate-180",
                            )}
                          />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-6 space-y-8 pb-6 animate-in fade-in slide-in-from-top-1 duration-200">
                          {order.products.map((p:any, idx:any) => (
                            <div
                              key={idx}
                              className="flex items-start justify-between max-w-4xl mx-auto px-10"
                            >
                              <div className="flex gap-4">
                                <div className="h-14 w-14 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-sm font-medium text-gray-900 leading-tight">
                                    {p.name}
                                  </h4>
                                  <p className="text-xs text-blue-500 hover:underline cursor-pointer font-medium">
                                    {p.category}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">
                                  {p.price}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1 font-bold">
                                  × {p.qty}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-6 text-sm border-t pt-6 pb-6 bg-white">
            <p className="text-gray-500">
              Total{" "}
              <span className="text-gray-900 font-medium">
                {tableData.length} items
              </span>
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={18} />
              </Button>

              <div className="flex items-center gap-1">
                {getPageNumbers(currentPage, totalPages).map((page, i) => (
                  <Button
                    key={i}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 w-8 rounded font-medium min-w-[32px]",
                      currentPage === page
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "text-gray-500 hover:bg-gray-100",
                      typeof page === "string" &&
                        "cursor-default hover:bg-transparent",
                    )}
                    disabled={typeof page === "string"}
                    onClick={() =>
                      typeof page === "number" && setCurrentPage(page)
                    }
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                <ChevronRight size={18} />
              </Button>
            </div>

            <Select
              value={itemsPerPage.toString()}
              onValueChange={(v) => {
                setItemsPerPage(Number(v));
                setCurrentPage(1);
              }}
            >
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
        </CardContent>
      </Card>

      {/* Notify Vendor Modal */}
      <CustomModal
        isOpen={notifyVendorOpen}
        onClose={() => {
          setNotifyVendorOpen(false);
          setNotificationOption("");
          setCustomMessage("");
        }}
        title="Notify Vendor..."
        maxWidth="sm:max-w-[580px]"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setNotifyVendorOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={!notificationOption}
              onClick={() => {
                toast.success("Notification sent to vendor");
                setNotifyVendorOpen(false);
                setNotificationOption("");
                setCustomMessage("");
              }}
            >
              Send Message
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-700 mb-4">
              Send a WhatsApp notification message to:{" "}
              <span className="font-medium">
                {selectedOrderForAction
                  ? MOCK_ORDERS.find((o) => o.id === selectedOrderForAction)
                      ?.vendor
                  : "Selected vendors"}
              </span>
            </p>

            <div className="space-y-3">
              {[
                { id: "new-order", label: "Notify of New Order Alert" },
                {
                  id: "prepare",
                  label: `Prepare Order ${selectedOrderForAction || "#XXXX"} for Pickup`,
                },
                {
                  id: "cancel",
                  label: `Inform About Order ${selectedOrderForAction || "#XXXX"} Cancellation`,
                },
                { id: "custom", label: "Custom Message" },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="notify-option"
                    checked={notificationOption === opt.id}
                    onChange={() => setNotificationOption(opt.id)}
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-800">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {notificationOption === "custom" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Type here..."
                rows={4}
                className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}
        </div>
      </CustomModal>

      {/* Notify Customer Modal */}
      <CustomModal
        isOpen={notifyCustomerOpen}
        onClose={() => {
          setNotifyCustomerOpen(false);
          setNotificationOption("");
          setCustomMessage("");
        }}
        title="Notify Customer..."
        maxWidth="sm:max-w-[580px]"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setNotifyCustomerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={!notificationOption}
              onClick={() => {
                toast.success("Notification sent to customer");
                setNotifyCustomerOpen(false);
                setNotificationOption("");
                setCustomMessage("");
              }}
            >
              Send Message
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-700 mb-4">
              Send a WhatsApp notification message to the customer:
            </p>
            <div className="space-y-3">
              {[
                { id: "order-confirmed", label: "Order Confirmed" },
                { id: "on-the-way", label: "Order is on the way" },
                { id: "delivered", label: "Order Delivered" },
                { id: "cancelled", label: "Order Cancelled" },
                { id: "custom", label: "Custom Message" },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="notify-customer"
                    checked={notificationOption === opt.id}
                    onChange={() => setNotificationOption(opt.id)}
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-800">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {notificationOption === "custom" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Type here..."
                rows={4}
                className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}
        </div>
      </CustomModal>

      {/* Assign Courier Modal */}
      <CustomModal
        isOpen={assignCourierOpen}
        onClose={() => setAssignCourierOpen(false)}
        title="Assign Couriers"
        maxWidth="sm:max-w-[680px]"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setAssignCourierOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => {
                toast.success("Courier assigned successfully");
                setAssignCourierOpen(false);
              }}
            >
              Assign Couriers
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Shipping address
            </p>
            <p className="text-sm text-gray-600">
              {selectedOrderForAction
                ? MOCK_ORDERS.find((o) => o.id === selectedOrderForAction)
                    ?.shippingAddress
                : "No order selected"}
            </p>
          </div>

          <div className="flex items-center gap-3 border-b pb-3">
            <Button
              variant={courierTab === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setCourierTab("all")}
            >
              All ({couriers.length})
            </Button>
            <Button
              variant={courierTab === "unassigned" ? "default" : "outline"}
              size="sm"
              onClick={() => setCourierTab("unassigned")}
            >
              Unassigned ({couriers.filter((c) => c.assignments === 0).length})
            </Button>
          </div>

          <Input
            placeholder="Search courier by name, email or by locations"
            value={courierSearch}
            onChange={(e) => setCourierSearch(e.target.value)}
            className="max-w-md"
          />

          <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2">
            {filteredCouriers.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p className="text-sm">
                  No {courierTab === "unassigned" ? "unassigned " : ""}courier
                  found for these locations
                </p>
                <Button
                  variant="link"
                  className="mt-2 text-orange-600"
                  onClick={() => {
                    setCourierSearch("");
                    setCourierTab("all");
                  }}
                >
                  Show All Couriers Instead
                </Button>
              </div>
            ) : (
              filteredCouriers.map((courier) => (
                <div
                  key={courier.id}
                  className="flex items-center justify-between py-3 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <input type="radio" name="courier" className="h-4 w-4" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {courier.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {courier.locations}
                      </p>
                      {courier.assignments > 0 && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          Assigned ({courier.assignments})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {courier.status === "busy" && (
                      <span className="text-xs text-orange-600 font-medium">
                        Busy
                      </span>
                    )}
                    <MoreHorizontal className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CustomModal>
    </div>
  );
};
