"use client";

import * as React from "react";
import {
  Search,
  Download,
  Filter,
  MoreHorizontal,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  AlertCircle,
  X,
  Calendar as CalendarIcon,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import Link from "next/link";

interface ApiCustomer {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  totalCompletedOrders: number;
  status: { isActive: boolean };
}

interface GroupInfo {
  status: { key: string; label: string };
  total: number;
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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

export default function CustomersPage() {
  const [selectedCustomer, setSelectedCustomer] = React.useState<ApiCustomer | null>(null);

  // Filters State
  const [activeTab, setActiveTab] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<string>("");
  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined);

  // Pagination State
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  // Data State
  const [customers, setCustomers] = React.useState<ApiCustomer[]>([]);
  const [groups, setGroups] = React.useState<GroupInfo[]>([]);
  const [totalCustomers, setTotalCustomers] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Selection & Actions State
  const [selectedCustomerIds, setSelectedCustomerIds] = React.useState<string[]>([]);
  const [showNotifyModal, setShowNotifyModal] = React.useState(false);
  const [showLogsModal, setShowLogsModal] = React.useState(false);
  const [notificationOption, setNotificationOption] = React.useState<"predefined" | "custom" | null>(null);
  const [customMessage, setCustomMessage] = React.useState("");

  // Suspend Actions State
  const [showSuspendModal, setShowSuspendModal] = React.useState(false);
  const [suspendReason, setSuspendReason] = React.useState("");
  const [suspendNote, setSuspendNote] = React.useState("");
  const [customerToSuspend, setCustomerToSuspend] = React.useState<ApiCustomer | null>(null);
  const [isSuspending, setIsSuspending] = React.useState(false);

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (activeTab && activeTab !== "all") params.append("status", activeTab);
      if (dateRange) params.append("range", dateRange);
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());

      const res = await authenticatedFetch(`/admin/customers?${params.toString()}`);
      const apiRes = await parseApiResponse(res);

      if (apiRes?.success) {
        setCustomers(apiRes.data.data);
        setGroups(apiRes.data.groups);
        setTotalCustomers(apiRes.data.meta.total);
        setTotalPages(apiRes.data.meta.totalPages || 1);
      } else {
        setError(apiRes?.message || "Failed to load customers");
      }
    } catch (err) {
      setError("An error occurred while fetching customers.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCustomers();
  }, [debouncedSearch, activeTab, currentPage, itemsPerPage, dateRange, startDate, endDate]);

  const toggleSelectAll = () => {
    if (selectedCustomerIds.length === customers.length && customers.length > 0) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(customers.map((c) => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  };

  const tabTriggerClass = cn(
    "rounded-none border-0 border-b-2 border-transparent bg-transparent px-4 pb-2 font-bold shadow-none transition-all text-sm capitalize",
    "data-[state=active]:border-[#E86B35] data-[state=active]:text-[#E86B35] text-slate-500",
  );

  // Send Message logic
  const handleNotifyCustomer = async () => {
    let finalMessage = "";
    if (notificationOption === "predefined") {
      finalMessage = "Notify customer to clear their cart before items run out of stock";
    } else if (notificationOption === "custom") {
      if (!customMessage.trim()) {
        toast.error("Please provide a custom message.");
        return;
      }
      finalMessage = customMessage;
    } else {
      toast.error("Please select a notification option.");
      return;
    }

    const recipients = selectedCustomer ? [selectedCustomer.id] : selectedCustomerIds;
    if (recipients.length === 0) return;

    // We'll mock the endpoint for now or try to hit one if it exists
    const promise = Promise.all(
      recipients.map((id) =>
        authenticatedFetch(`/admin/customers/${id}/messages`, {
          method: "POST",
          body: JSON.stringify({ message: finalMessage }),
        })
      )
    );

    toast.promise(promise, {
      loading: "Sending message...",
      success: () => {
        setShowNotifyModal(false);
        setCustomMessage("");
        setNotificationOption(null);
        setSelectedCustomerIds([]);
        setSelectedCustomer(null);
        return "Message sent successfully";
      },
      error: "Failed to send message. Make sure the endpoint exists.",
    });
  };

  const handleUnsuspend = async (id: string) => {
    try {
      const res = await authenticatedFetch(`/admin/customers/${id}/unsuspend`, {
        method: "PATCH",
        body: JSON.stringify({}),
      });
      const apiRes = await parseApiResponse(res);
      console.log("api res", apiRes)
      if (apiRes?.success) {
        toast.success("Customer unsuspended successfully");
        fetchCustomers();
      } else {
        toast.error(apiRes?.message || "Failed to unsuspend customer");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleSuspend = async () => {
    if (!customerToSuspend) return;
    if (!suspendReason.trim() || !suspendNote.trim()) {
      toast.error("Reason and note are mandatory.");
      return;
    }
    
    setIsSuspending(true);
    try {
      const res = await authenticatedFetch(`/admin/customers/${customerToSuspend.id}/suspend`, {
        method: "PATCH",
        body: JSON.stringify({
          reason: suspendReason.trim(),
          note: suspendNote.trim(),
        }),
      });
      const apiRes = await parseApiResponse(res);
      if (apiRes?.success) {
        toast.success("Customer suspended successfully");
        setShowSuspendModal(false);
        setSuspendReason("");
        setSuspendNote("");
        fetchCustomers();
      } else {
        toast.error(apiRes?.message || "Failed to suspend customer");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsSuspending(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#F8FAFC]">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1600px] mx-auto space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-slate-900">
                {isLoading ? (
                  <span className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                  </span>
                ) : (
                  `Total (${totalCustomers})`
                )}
              </h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-slate-400 bg-white"
                  onClick={fetchCustomers}
                  disabled={isLoading}
                >
                  <RotateCcw size={18} className={isLoading ? "animate-spin" : ""} />
                </Button>
                <Select
                  value={dateRange || "7"}
                  onValueChange={(val) => {
                    setDateRange(val === "all" ? "" : val);
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                >
                  <SelectTrigger className="w-[160px] h-9 bg-white border-slate-200 text-sm font-semibold shadow-none">
                    <CalendarIcon size={14} className="mr-2 text-slate-400" />
                    <SelectValue placeholder="Last 7 days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="last_week">Last week</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="border-slate-200 shadow-none rounded-lg bg-white overflow-hidden">
              <div className="p-4 space-y-4">
                {/* Search & Bulk Actions */}
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <Input
                      placeholder="Search"
                      className="pl-9 h-10 border-slate-200 bg-slate-50/50 shadow-none"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="h-10 text-xs font-semibold border-slate-200 text-slate-600 gap-2 shadow-none"
                    >
                      <Download size={14} /> Download
                    </Button>
                    <Button
                      variant={isFilterOpen ? "default" : "outline"}
                      className={cn("h-10 text-xs font-semibold border-slate-200 shadow-none gap-2", isFilterOpen && "bg-slate-100 text-slate-900 border-transparent")}
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                    >
                      <Filter size={14} /> Filter {isFilterOpen && <X size={14} />}
                    </Button>
                  </div>
                </div>

                {/* Filters Row */}
                {isFilterOpen && (
                  <div className="flex flex-wrap gap-3 items-center py-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 px-3 h-9 bg-slate-50 border border-slate-100 rounded-md text-xs font-semibold text-slate-600">
                      <Filter size={14} /> Filter
                    </div>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[200px] h-9 text-xs justify-start shadow-none"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "dd/MM/yyyy") : "Start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[150]">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(d) => { setStartDate(d); setDateRange(""); }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[200px] h-9 text-xs justify-start shadow-none"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "dd/MM/yyyy") : "End date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[150]">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => {
                            if (startDate && date && date < startDate) {
                              toast.error("End date cannot be before start date");
                              return;
                            }
                            setEndDate(date);
                            setDateRange("");
                          }}
                          initialFocus
                          disabled={(date) => (startDate ? date < startDate : false)}
                        />
                      </PopoverContent>
                    </Popover>

                    <Button
                      variant="ghost"
                      className="h-9 text-xs font-semibold text-slate-500 hover:text-slate-900"
                      onClick={() => {
                        setSearchQuery("");
                        setDateRange("7");
                        setStartDate(undefined);
                        setEndDate(undefined);
                        setActiveTab("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}

                <div className="flex gap-6 border-b border-slate-100 overflow-x-auto">
                  {groups && groups.length > 0 ? (
                    groups.map((group) => (
                      <button
                        key={group.status.key}
                        onClick={() => { setActiveTab(group.status.key); setCurrentPage(1); }}
                        className={cn(
                          "pb-3 text-sm font-medium relative whitespace-nowrap capitalize",
                          activeTab === group.status.key
                            ? "text-[#E86B35] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#E86B35]"
                            : "text-gray-500 hover:text-gray-700",
                        )}
                      >
                        {group.status.label} {group.total}
                      </button>
                    ))
                  ) : (
                    <>
                      <button
                        onClick={() => { setActiveTab("all"); setCurrentPage(1); }}
                        className={cn(
                          "pb-3 text-sm font-medium relative whitespace-nowrap capitalize",
                          activeTab === "all"
                            ? "text-[#E86B35] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#E86B35]"
                            : "text-gray-500 hover:text-gray-700",
                        )}
                      >
                        All {totalCustomers}
                      </button>
                      <button
                        onClick={() => { setActiveTab("active"); setCurrentPage(1); }}
                        className={cn(
                          "pb-3 text-sm font-medium relative whitespace-nowrap capitalize",
                          activeTab === "active"
                            ? "text-[#E86B35] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#E86B35]"
                            : "text-gray-500 hover:text-gray-700",
                        )}
                      >
                        Active 0
                      </button>
                      <button
                        onClick={() => { setActiveTab("suspended"); setCurrentPage(1); }}
                        className={cn(
                          "pb-3 text-sm font-medium relative whitespace-nowrap capitalize",
                          activeTab === "suspended"
                            ? "text-[#E86B35] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#E86B35]"
                            : "text-gray-500 hover:text-gray-700",
                        )}
                      >
                        Suspended 0
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-900">
                    Selected: {selectedCustomerIds.length}
                  </span>
                  <Button
                    disabled={selectedCustomerIds.length === 0}
                    variant="outline"
                    className="h-9 text-xs bg-slate-50 border-slate-200 gap-2 text-slate-600 shadow-none"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setShowNotifyModal(true);
                    }}
                  >
                    <Mail size={14} /> Notify Selected Customers...
                  </Button>
                </div>

                {/* Main Table */}
                <div className="rounded-md border border-slate-100 overflow-hidden bg-white">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100">
                      <tr>
                        <th className="p-4 w-10 border-r border-slate-100">
                          <Checkbox
                            checked={selectedCustomerIds.length === customers.length && customers.length > 0}
                            onCheckedChange={toggleSelectAll}
                            className="border-slate-300 data-[state=checked]:bg-[#E86B35] data-[state=checked]:border-[#E86B35]"
                          />
                        </th>
                        <th className="p-4 border-r border-slate-100 whitespace-nowrap">Customer Email</th>
                        <th className="p-4 border-r border-slate-100 whitespace-nowrap">Reg. Date</th>
                        <th className="p-4 border-r border-slate-100 whitespace-nowrap">Total Order</th>
                        <th className="p-4 border-r border-slate-100 whitespace-nowrap">Status</th>
                        <th className="p-4 text-center w-12">-</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 border-r border-slate-100">
                            <Checkbox
                              checked={selectedCustomerIds.includes(c.id)}
                              onCheckedChange={() => toggleSelect(c.id)}
                              className="border-slate-300 data-[state=checked]:bg-[#E86B35] data-[state=checked]:border-[#E86B35]"
                            />
                          </td>
                          <td className="p-4 border-r border-slate-100 text-slate-600 font-medium">
                            <div className="max-w-[180px] truncate" title={c.email}>
                              {c.email}
                            </div>
                          </td>
                          <td className="p-4 border-r border-slate-100 text-slate-600 font-medium">
                            <div className="max-w-[180px] truncate">
                              {format(new Date(c.createdAt), "EEE MMM dd yyyy HH:mm:ss")}...
                            </div>
                          </td>
                          <td className="p-4 border-r border-slate-100 text-slate-600 font-medium">
                            {c.totalCompletedOrders}
                          </td>
                          <td className="p-4 border-r border-slate-100">
                            <span
                              className={cn(
                                "font-bold px-3 py-1 rounded-[4px] text-[10px] uppercase text-white shadow-sm inline-block",
                                c.status?.isActive
                                  ? "bg-[#50C828]"
                                  : "bg-red-500"
                              )}
                            >
                              {c.status?.isActive ? "ACTIVE" : "SUSPENDED"}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-slate-100"
                                >
                                  <MoreHorizontal size={16} className="text-slate-500" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48 p-1 rounded-lg shadow-xl"
                              >
                                <DropdownMenuItem asChild className="gap-2 text-xs py-2.5 font-semibold cursor-pointer">
                                  <Link href={`/admin/customers/${c.id}`}>
                                    <Eye size={14} /> View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCustomer(c);
                                    setShowNotifyModal(true);
                                  }}
                                  className="gap-2 text-xs py-2.5 font-semibold cursor-pointer"
                                >
                                  <Mail size={14} /> Notify Customer...
                                </DropdownMenuItem>
                                
                                {c.status?.isActive ? (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setCustomerToSuspend(c);
                                      setSuspendReason("");
                                      setSuspendNote("");
                                      setShowSuspendModal(true);
                                    }}
                                    className="gap-2 text-xs py-2.5 font-semibold text-red-600 border-t cursor-pointer focus:text-red-700"
                                  >
                                    <AlertCircle size={14} /> Suspend Customer
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleUnsuspend(c.id)}
                                    className="gap-2 text-xs py-2.5 font-semibold text-green-600 border-t cursor-pointer focus:text-green-700"
                                  >
                                    <CheckCircle2 size={14} /> Unsuspend Customer
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                      {customers.length === 0 && !isLoading && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                            No customers found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-6 text-sm border-t pt-6">
                  <p className="text-slate-500 font-medium">
                    Total <span className="text-slate-900">{totalCustomers} items</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded text-slate-400"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      <ChevronLeft size={18} />
                    </Button>
                    <div className="flex items-center gap-1.5">
                      {getPageNumbers().map((page, i) => (
                        <Button
                          key={i}
                          variant={currentPage === page ? "outline" : "ghost"}
                          size="sm"
                          className={cn(
                            "h-8 w-8 rounded font-bold text-[11px]",
                            currentPage === page
                              ? "border-2 border-[#E86B35] text-[#E86B35]"
                              : "text-slate-500"
                          )}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded text-slate-400"
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      <ChevronRight size={18} />
                    </Button>
                  </div>
                  <Select
                    value={`${itemsPerPage}`}
                    onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}
                  >
                    <SelectTrigger className="w-[110px] h-9 bg-slate-50 border-slate-200 text-xs font-bold shadow-none">
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
            </Card>
          </div>
      </div>

      {/* --- NOTIFY DIALOG --- */}
      <CustomModal
        isOpen={showNotifyModal}
        onClose={() => {
          setShowNotifyModal(false);
          setNotificationOption(null);
          setCustomMessage("");
        }}
        title="Notify Customer..."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowNotifyModal(false);
                setNotificationOption(null);
                setCustomMessage("");
              }}
              className="h-10 text-xs font-bold rounded-lg px-6 border-slate-200 text-slate-600 shadow-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleNotifyCustomer}
              className="h-10 text-xs font-bold bg-[#E86B35] hover:bg-[#d15d2c] text-white rounded-lg px-6 shadow-none"
            >
              Send Message
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-600">
            Send an <span className="font-bold text-slate-900">Email</span> notification to{" "}
            <span className="font-bold text-slate-900">
              {selectedCustomer ? selectedCustomer.email : `${selectedCustomerIds.length} selected customers`}
            </span>
            :
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 border border-slate-100 rounded-lg bg-slate-50/30">
              <Checkbox
                id="pop1"
                checked={notificationOption === "predefined"}
                onCheckedChange={() => setNotificationOption("predefined")}
                className="mt-0.5 data-[state=checked]:bg-[#E86B35] border-slate-300"
              />
              <label htmlFor="pop1" className="text-xs font-bold text-slate-700 cursor-pointer leading-tight">
                Notify customer to clear their cart before items run out of stock
              </label>
            </div>
            <div className="flex items-start gap-3 p-4 border border-slate-100 rounded-lg bg-slate-50/30">
              <Checkbox
                id="pop2"
                checked={notificationOption === "custom"}
                onCheckedChange={() => setNotificationOption("custom")}
                className="mt-0.5 data-[state=checked]:bg-[#E86B35] border-slate-300"
              />
              <label htmlFor="pop2" className="text-xs font-bold text-slate-700 cursor-pointer">
                Custom Message
              </label>
            </div>

            {notificationOption === "custom" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="text-xs border-slate-200 min-h-[120px] focus-visible:ring-1 focus-visible:ring-[#E86B35] focus:border-[#E86B35] rounded-lg shadow-none"
                />
              </div>
            )}
          </div>
        </div>
      </CustomModal>

      {/* --- SUSPEND DIALOG --- */}
      <CustomModal
        isOpen={showSuspendModal}
        onClose={() => {
          if (!isSuspending) {
            setShowSuspendModal(false);
            setSuspendReason("");
            setSuspendNote("");
          }
        }}
        title="Suspend Customer"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowSuspendModal(false);
                setSuspendReason("");
                setSuspendNote("");
              }}
              disabled={isSuspending}
              className="h-10 text-xs font-bold rounded-lg px-6 border-slate-200 text-slate-600 shadow-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSuspend}
              disabled={isSuspending || !suspendReason.trim() || !suspendNote.trim()}
              className="h-10 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg px-6 shadow-none flex items-center gap-2"
            >
              {isSuspending && <Loader2 size={14} className="animate-spin" />}
              {isSuspending ? "Suspending..." : "Confirm Suspension"}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-600">
            You are about to suspend <span className="font-bold text-slate-900">{customerToSuspend?.fullName}</span>. Please provide a reason.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Reason (Mandatory)</label>
              <Input
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Repeated policy violations"
                className="text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-red-500 focus:border-red-500 shadow-none"
                disabled={isSuspending}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Note (Mandatory)</label>
              <Textarea
                value={suspendNote}
                onChange={(e) => setSuspendNote(e.target.value)}
                placeholder="e.g. Third strike: fraudulent chargeback"
                className="text-xs border-slate-200 min-h-[100px] focus-visible:ring-1 focus-visible:ring-red-500 focus:border-red-500 shadow-none"
                disabled={isSuspending}
              />
            </div>
          </div>
        </div>
      </CustomModal>

      {/* Activity Logs Modal */}
      <CustomModal
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        title="Activity logs"
      >
        <div className="h-64 text-xs font-bold text-slate-400 flex items-center justify-center italic">
          No recent activity found for this user.
        </div>
      </CustomModal>
    </div>
  );
}
