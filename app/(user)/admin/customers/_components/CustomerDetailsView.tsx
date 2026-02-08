"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Calendar,
  ChevronRight,
  Search,
  X,
  Mail,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CustomDialog = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
          >
            <X size={20} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default function CustomerDetailsView({ customer, onBack }: any) {
  const [activePurchaseTab, setActivePurchaseTab] = React.useState("all");
  const [purchaseTime, setPurchaseTime] = React.useState("7");
  const [expandedPurchases, setExpandedPurchases] = React.useState<number[]>(
    [],
  );
  const [isLogsOpen, setIsLogsOpen] = React.useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = React.useState(false);
  const [logSearch, setLogSearch] = React.useState("");
  const [logTime, setLogTime] = React.useState("7");
  const [customMsgChecked, setCustomMsgChecked] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);

  // 50 Mock Purchases
  const allPurchases = React.useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        orderId: `#00${25 + i}`,
        date: i < 5 ? "Just now" : "24th May, 2023",
        price: "N22,000",
        status:
          i < 3
            ? "delivery"
            : i % 4 === 0
              ? "delivered"
              : i % 5 === 0
                ? "cancelled"
                : i % 6 === 0
                  ? "returned"
                  : "delivered",
        daysAgo: i < 5 ? 1 : (i % 30) + 1,
      })),
    [],
  );

  const filteredByTime = allPurchases.filter(
    (p) => p.daysAgo <= parseInt(purchaseTime),
  );

  const counts = {
    all: filteredByTime.length,
    delivery: filteredByTime.filter((p) => p.status === "delivery").length,
    delivered: filteredByTime.filter((p) => p.status === "delivered").length,
    cancelled: filteredByTime.filter((p) => p.status === "cancelled").length,
    returned: filteredByTime.filter((p) => p.status === "returned").length,
  };

  const filteredByTab = filteredByTime.filter(
    (p) => activePurchaseTab === "all" || p.status === activePurchaseTab,
  );

  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredByTab.length / itemsPerPage);
  const currentItems = filteredByTab.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const simulateApi = (action: string) => {
    toast.promise(new Promise((res) => setTimeout(res, 1000)), {
      loading: "Processing...",
      success: () => {
        setIsNotifyOpen(false);
        return `${action} successful`;
      },
      error: "Failed",
    });
  };

  const toggleAccordion = (id: number) => {
    setExpandedPurchases((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const purchaseDetails = [
    { name: "Burger and Smoothie", vendor: "Food Court", price: "NGN 8,900" },
    {
      name: "Refuel Max (rice, chicken, coleslaw, drink)",
      vendor: "Food Court",
      price: "NGN 8,900",
    },
    {
      name: "Ice Cream and Pastries",
      vendor: "Sweet Sensation",
      price: "NGN 8,900",
    },
  ];

  // Pagination helper to generate the 1, 2, 3 ... 50 array
  const getPaginationRange = () => {
    const range = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      if (currentPage <= 4) {
        range.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        range.push(
          1,
          "...",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        range.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
    }
    return range;
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-1 hover:bg-slate-100 rounded text-slate-500"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">John Mandy</h1>
              <span className="bg-[#4ADE80] text-white font-bold px-2 py-0.5 rounded text-[10px]">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Registered on: 6th Aug, 2024 - 11:54 AM
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-9 text-xs border-slate-200 gap-2 font-bold text-slate-600 shadow-none"
            >
              More actions <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 p-1 rounded-xl shadow-xl border-slate-100"
          >
            <DropdownMenuItem
              onClick={() => setIsNotifyOpen(true)}
              className="gap-3 py-3 text-xs font-semibold cursor-pointer"
            >
              <Mail size={16} className="text-slate-500" /> Notify Customer...
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => simulateApi("Customer flagged")}
              className="gap-3 py-3 text-xs font-semibold text-red-600 border-t border-slate-50 cursor-pointer"
            >
              <AlertCircle size={16} /> Flag Customer's acct.
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <Card className="border-slate-200 shadow-none p-5 space-y-6">
            <h3 className="font-bold text-sm border-b pb-2 -mx-5 px-5">
              Customer information
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-[11px] font-bold text-slate-900 mb-2 uppercase tracking-wide">
                  Personal details
                </h4>
                <div className="space-y-1">
                  <p className="text-sm text-slate-600 font-medium">
                    John Mandy
                  </p>
                  <p className="text-sm text-blue-500 underline font-medium cursor-pointer">
                    johnmandy@gmail.com
                  </p>
                  <p className="text-sm text-slate-600 font-medium">
                    +234 8035748512
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-slate-900 mb-2 uppercase tracking-wide">
                  Shipping address
                </h4>
                <p className="text-sm text-slate-600 font-medium">
                  Plot 18, Green man street, Ikeja, Lagos, Nigeria
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="mkt"
                  checked
                  className="data-[state=checked]:bg-[#E86B35] border-slate-300"
                />
                <label
                  htmlFor="mkt"
                  className="text-sm text-slate-600 font-medium cursor-pointer"
                >
                  Subscribe to email updates
                </label>
              </div>
            </div>
          </Card>

          <Card className="border-slate-200 shadow-none p-5">
            <h3 className="font-bold text-sm border-b pb-2 -mx-5 px-5 mb-4">
              Shopping Cart
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex gap-4 p-3 border border-slate-100 rounded-xl bg-white"
                >
                  <div className="w-14 h-14 bg-slate-100 rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-900">
                      Burger and Smoothie
                    </h4>
                    <p className="text-[10px] text-blue-500 underline font-medium">
                      Food Court
                    </p>
                    <div className="flex justify-between items-end mt-2 font-bold">
                      <span className="text-[11px] text-slate-400">X 1</span>
                      <span className="text-xs">NGN 8,900</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Purchases */}
        <div className="col-span-12 lg:col-span-7">
          <Card className="border-slate-200 shadow-none p-5 flex flex-col min-h-[600px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm">Purchases</h3>
              <Select
                value={purchaseTime}
                onValueChange={(val) => {
                  setPurchaseTime(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-36 h-8 text-[11px] font-bold border-slate-200 focus:ring-0">
                  <Calendar size={14} className="mr-2 text-slate-400" />
                  <SelectValue placeholder="Last 7 Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs
              value={activePurchaseTab}
              onValueChange={(val) => {
                setActivePurchaseTab(val);
                setCurrentPage(1);
              }}
              className="flex-1"
            >
              <TabsList className="bg-transparent border-b border-slate-100 w-full justify-start h-auto p-0 gap-6 rounded-none mb-6">
                <TabsTrigger
                  value="all"
                  className="rounded-none border-0 border-b-2 border-transparent bg-transparent pb-3 font-bold text-[11px] data-[state=active]:border-[#E86B35] data-[state=active]:text-[#E86B35] text-slate-500 shadow-none"
                >
                  All {counts.all}
                </TabsTrigger>
                <TabsTrigger
                  value="delivery"
                  className="rounded-none border-0 border-b-2 border-transparent bg-transparent pb-3 font-bold text-[11px] data-[state=active]:border-[#E86B35] data-[state=active]:text-[#E86B35] text-slate-500 shadow-none"
                >
                  Out for Delivery {counts.delivery}
                </TabsTrigger>
                <TabsTrigger
                  value="delivered"
                  className="rounded-none border-0 border-b-2 border-transparent bg-transparent pb-3 font-bold text-[11px] data-[state=active]:border-[#E86B35] data-[state=active]:text-[#E86B35] text-slate-500 shadow-none"
                >
                  Delivered {counts.delivered}
                </TabsTrigger>
                <TabsTrigger
                  value="cancelled"
                  className="rounded-none border-0 border-b-2 border-transparent bg-transparent pb-3 font-bold text-[11px] data-[state=active]:border-[#E86B35] data-[state=active]:text-[#E86B35] text-slate-500 shadow-none"
                >
                  Cancelled {counts.cancelled}
                </TabsTrigger>
                <TabsTrigger
                  value="returned"
                  className="rounded-none border-0 border-b-2 border-transparent bg-transparent pb-3 font-bold text-[11px] data-[state=active]:border-[#E86B35] data-[state=active]:text-[#E86B35] text-slate-500 shadow-none"
                >
                  Returned & Refunded {counts.returned}
                </TabsTrigger>
              </TabsList>

              <div className="space-y-3">
                {currentItems.length > 0 ? (
                  currentItems.map((p) => (
                    <div
                      key={p.id}
                      className="border border-slate-100 rounded-lg overflow-hidden"
                    >
                      <div className="p-4 flex justify-between bg-white items-start">
                        <div>
                          <p className="text-xs font-bold text-blue-500">
                            {p.orderId}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Created on {p.date}.
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold">{p.price}</p>
                          <span
                            className={cn(
                              "font-bold px-2 py-0.5 rounded text-[9px] uppercase",
                              p.status === "delivered"
                                ? "bg-green-100 text-green-700"
                                : p.status === "delivery"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-orange-100 text-orange-700",
                            )}
                          >
                            {p.status}
                          </span>
                        </div>
                      </div>

                      {/* Collapse Button (Before Expanded Section) */}
                      <div className="px-4 py-2 bg-[#F8FAFC] border-t border-slate-50 flex justify-between items-center">
                        <p className="text-[10px] text-slate-500 font-bold">
                          Includes 3 products from 2 vendors
                        </p>
                        <button
                          onClick={() => toggleAccordion(p.id)}
                          className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5 hover:text-[#E86B35]"
                        >
                          {expandedPurchases.includes(p.id)
                            ? "Collapse"
                            : "Expand"}
                          {expandedPurchases.includes(p.id) ? (
                            <ChevronUp size={12} />
                          ) : (
                            <ChevronDown size={12} />
                          )}
                        </button>
                      </div>

                      {/* Expanded Details Section */}
                      {expandedPurchases.includes(p.id) && (
                        <div className="px-4 pb-4 bg-white border-t border-slate-50 animate-in fade-in slide-in-from-top-1 duration-200">
                          {purchaseDetails.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0"
                            >
                              <div className="flex gap-3 items-center">
                                <div className="w-10 h-10 bg-slate-100 rounded-md flex-shrink-0" />
                                <div>
                                  <p className="text-[11px] font-bold text-slate-900">
                                    {item.name}
                                  </p>
                                  <p className="text-[10px] text-blue-500 underline font-medium">
                                    {item.vendor}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[11px] font-bold text-slate-900">
                                  {item.price}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold">
                                  X 1
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <ShoppingBag className="text-slate-300" size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-900">
                      No purchases found
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 text-center max-w-[200px]">
                      There are no items in the{" "}
                      <span className="capitalize">{activePurchaseTab}</span>{" "}
                      category for the selected timeframe.
                    </p>
                  </div>
                )}
              </div>
            </Tabs>

            {/* PURCHASE PAGINATION (Matches your logic) */}
            <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-slate-50">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "p-1.5 rounded hover:bg-slate-100 text-slate-400 transition-colors",
                  currentPage > 1 && "text-slate-600",
                )}
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex items-center gap-1.5">
                {getPaginationRange().map((page, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      typeof page === "number" && setCurrentPage(page)
                    }
                    className={cn(
                      "min-w-[32px] h-8 text-[11px] font-bold rounded-md transition-all",
                      currentPage === page
                        ? "border-2 border-[#E86B35] text-[#E86B35]"
                        : "text-slate-500 hover:bg-slate-50",
                      typeof page !== "number" &&
                        "cursor-default hover:bg-transparent",
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className={cn(
                  "p-1.5 rounded hover:bg-slate-100 text-slate-400 transition-colors",
                  currentPage < totalPages && "text-slate-600",
                )}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="text-center mt-12 mb-4">
              <p className="text-[11px] text-slate-400 font-medium">
                Want to know more about this customer?
              </p>
              <button
                onClick={() => setIsLogsOpen(true)}
                className="text-[11px] text-blue-600 font-bold hover:underline transition-all"
              >
                View activity logs.
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Notify Modal */}
      <CustomDialog
        isOpen={isNotifyOpen}
        onClose={() => setIsNotifyOpen(false)}
        title="Notify Vendor..."
      >
        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-600">
            Send a <span className="font-bold text-slate-900">Email</span>{" "}
            notification to{" "}
            <span className="font-bold text-slate-900">John Mandy</span>:
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 border border-slate-100 rounded-lg">
              <Checkbox
                id="n1"
                className="mt-0.5 data-[state=checked]:bg-[#E86B35] border-slate-300"
              />
              <label
                htmlFor="n1"
                className="text-xs font-bold text-slate-700 cursor-pointer"
              >
                Notify customer to clear their cart before items run out of
                stock
              </label>
            </div>
            <div className="flex items-start gap-3 p-4 border border-slate-100 rounded-lg">
              <Checkbox
                id="n2"
                checked={customMsgChecked}
                onCheckedChange={(v: boolean) => setCustomMsgChecked(v)}
                className="mt-0.5 data-[state=checked]:bg-[#E86B35] border-slate-300"
              />
              <label
                htmlFor="n2"
                className="text-xs font-bold text-slate-700 cursor-pointer"
              >
                Custom Message
              </label>
            </div>
            {customMsgChecked && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <Textarea
                  placeholder="Type your message here..."
                  className="text-xs border-slate-200 min-h-[100px] focus-visible:ring-1 focus-visible:ring-[#E86B35] focus:border-[#E86B35]"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsNotifyOpen(false)}
              className="h-10 text-xs font-bold rounded-lg px-6 border-slate-200 text-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={() => simulateApi("Notification")}
              className="h-10 text-xs font-bold bg-[#E86B35] hover:bg-[#d15d2c] text-white rounded-lg px-6 shadow-lg shadow-orange-100/50"
            >
              Send Message
            </Button>
          </div>
        </div>
      </CustomDialog>

      {/* Activity Logs Modal */}
      <CustomDialog
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        title="Activity logs"
      >
        <div className="p-5 space-y-5 bg-white">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search logs by name or action"
                className="w-full pl-9 h-10 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#E86B35] transition-colors"
              />
            </div>
            <Select value={logTime} onValueChange={setLogTime}>
              <SelectTrigger className="w-36 h-10 text-xs font-bold border-slate-200 focus:ring-0">
                <Calendar size={14} className="mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-xl">
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-6 pt-4 pb-6 max-h-[400px] overflow-y-auto custom-scrollbar">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Tuesday, 28 Sep 2024
            </h4>
            <div className="relative pl-6 space-y-8 before:absolute before:left-[3px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-100">
              {[
                {
                  time: "12:00 PM",
                  text: "Order #1054 delivered by Courier (Ibrahim Lookman).",
                },
                {
                  time: "01:10 PM",
                  text: "Customer logged in from a new device (IP: 192.168.1.2).",
                },
                {
                  time: "01:15 PM",
                  text: "Account activated by admin (Mandy Lastina).",
                },
                {
                  time: "02:30 PM",
                  text: "Order #1054 shipped via Courier XYZ.",
                },
              ]
                .filter((l) =>
                  l.text.toLowerCase().includes(logSearch.toLowerCase()),
                )
                .map((log, i) => (
                  <div
                    key={i}
                    className="relative flex gap-4 animate-in slide-in-from-left-1 duration-200"
                  >
                    <div className="absolute -left-[27.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white shadow-sm" />
                    <span className="text-[11px] font-bold text-slate-900 w-16">
                      {log.time}:
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium leading-relaxed">
                      {log.text}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </CustomDialog>
    </div>
  );
}
