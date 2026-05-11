"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  RotateCcw,
  Calendar as CalendarIcon,
  ChevronDown,
  Search,
  Download,
  Filter,
  X,
  MoreHorizontal,
  Eye,
  Mail,
  UserCheck,
  Ban,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";

// API Types
interface RiderStatus {
  key: string;
  label: string;
}

interface ApiRider {
  riderId: string;
  fullName: string;
  registeredAt: string;
  onlineStatus: string;
  status: string;
  openFlagCount: number;
}

interface RiderGroup {
  status: RiderStatus;
  total: number;
}

interface RidersResponse {
  success: boolean;
  statusCode: number;
  data: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    groups: RiderGroup[];
    riders: ApiRider[];
  };
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
        <div className="flex border-b items-center justify-between px-6 py-4 bg-white">
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

export default function RidersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRiders, setSelectedRiders] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filters
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [dateRange, setDateRange] = useState<string>("last_30_days");

  // API Data
  const [ridersData, setRidersData] = useState<RidersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [markAsModalOpen, setMarkAsModalOpen] = useState(false);
  const [selectedRiderForAction, setSelectedRiderForAction] = useState<ApiRider | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusKey, setStatusKey] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [amountQuery, setAmountQuery] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [isBulkSuspend, setIsBulkSuspend] = useState(false);

  const fetchRiders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", itemsPerPage.toString());
      params.set("status", activeTab);

      if (dateRange && dateRange !== "all") {
        params.set("range", dateRange);
      }
      if (searchQuery) {
        params.set("search", searchQuery);
      }
      if (startDate && endDate) {
        params.set("startDate", startDate.toISOString());
        params.set("endDate", endDate.toISOString());
      }

      const res = await authenticatedFetch(`/admin/riders?${params.toString()}`);
      const apiRes = await parseApiResponse(res);

      if (!apiRes?.success) {
        setError(apiRes?.message || "Failed to fetch riders");
        return;
      }

      setRidersData(apiRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch riders");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, activeTab, dateRange, searchQuery, startDate, endDate]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (currentPage > 3) pages.push("...");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push("...");

    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  const handleMarkStatus = async () => {
    if (!selectedRiderForAction || !statusKey) return;

    setIsProcessing(true);
    try {
      const res = await authenticatedFetch(
        `/admin/riders/${selectedRiderForAction.riderId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            statusKey,
            reason: statusReason || "Updated by admin",
          }),
        }
      );
      const result = await parseApiResponse(res);
      if (result?.success) {
        toast.success("Rider status updated successfully");
        setMarkAsModalOpen(false);
        fetchRiders();
      } else {
        toast.error(result?.message || "Failed to update status");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleSuspension = async (riderId: string, currentStatus: string) => {
    const isSuspended = currentStatus.toLowerCase() === "suspended";
    if (isSuspended) {
      // Unsuspend directly
      confirmSuspension(riderId, true, "");
    } else {
      setSelectedRiderForAction(riders.find(r => r.riderId === riderId) || null);
      setIsBulkSuspend(false);
      setSuspendReason("");
      setSuspendModalOpen(true);
    }
  };

  const confirmSuspension = async (riderId: string, isUnsuspending: boolean, reason: string) => {
    setIsProcessing(true);
    const endpoint = isUnsuspending 
      ? `/admin/riders/${riderId}/unsuspend` 
      : `/admin/riders/${riderId}/suspend`;
    
    try {
      const res = await authenticatedFetch(
        endpoint,
        {
          method: "PATCH",
          body: JSON.stringify(isUnsuspending ? {} : { reason }),
        }
      );
      const result = await parseApiResponse(res);
      if (result?.success) {
        toast.success(`Rider ${isUnsuspending ? "unsuspended" : "suspended"} successfully`);
        setSuspendModalOpen(false);
        fetchRiders();
      } else {
        toast.error(result?.message || `Failed to ${isUnsuspending ? "unsuspend" : "suspend"} rider`);
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkSuspendClick = () => {
    setIsBulkSuspend(true);
    setSuspendReason("");
    setSuspendModalOpen(true);
  };

  const confirmBulkSuspend = async () => {
    if (selectedRiders.length === 0) return;

    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const riderId of selectedRiders) {
      const rider = riders.find(r => r.riderId === riderId);
      const isCurrentlySuspended = rider?.status.toLowerCase() === "suspended";
      const endpoint = isCurrentlySuspended 
        ? `/admin/riders/${riderId}/unsuspend` 
        : `/admin/riders/${riderId}/suspend`;

      try {
        const res = await authenticatedFetch(endpoint, {
          method: "PATCH",
          body: JSON.stringify(isCurrentlySuspended ? {} : { reason: suspendReason }),
        });
        const result = await parseApiResponse(res);
        if (result?.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }
    }

    if (failCount === 0) {
      toast.success(`Action applied to ${successCount} rider${successCount > 1 ? "s" : ""}`);
    } else if (successCount > 0) {
      toast.warning(`Action applied to ${successCount} rider${successCount > 1 ? "s" : ""}, failed for ${failCount}`);
    } else {
      toast.error("Failed to update riders");
    }

    setIsProcessing(false);
    setSuspendModalOpen(false);
    setSelectedRiders([]);
    fetchRiders();
  };

  const handleNotify = async () => {
    if (!customMessage.trim()) return;
    setIsProcessing(true);
    // Simulate API call as in orders page
    setTimeout(() => {
      toast.success("Notification sent to rider");
      setNotifyModalOpen(false);
      setCustomMessage("");
      setIsProcessing(false);
    }, 1000);
  };

  const getStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("approved")) return "bg-green-500 text-white";
    if (s.includes("pending")) return "bg-[#FDB022] text-white";
    if (s.includes("rejected")) return "bg-red-500 text-white";
    if (s.includes("suspended")) return "bg-gray-500 text-white";
    return "bg-blue-500 text-white";
  };

  const getOnlineStatusClass = (status: string) => {
    return status.toLowerCase() === "online" 
      ? "bg-green-500 text-white" 
      : "bg-gray-500 text-white";
  };

  const tabs = useMemo(() => {
    if (!ridersData?.data?.groups) {
      return [{ status: { key: "all", label: "All" }, total: 0 }];
    }

    const groups = ridersData.data.groups;
    const allGroup = groups.find((g) => g.status.key === "all");
    const otherGroups = groups.filter((g) => g.status.key !== "all" && g.total > 0);

    const total = allGroup ? allGroup.total : groups.reduce((sum, g) => sum + g.total, 0);

    return [
      { status: { key: "all", label: "All" }, total },
      ...otherGroups,
    ];
  }, [ridersData]);

  const riders = ridersData?.data?.riders || [];
  const totalItems = ridersData?.data?.total || 0;
  const totalPages = ridersData?.data?.totalPages || 0;

  const gridLayout = "grid grid-cols-[220px_1fr_140px_150px_60px]";

  return (
    <div className="p-8 bg-[#F9FAFB] min-h-screen">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            Total ({totalItems})
          </h1>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="border border-gray-200 bg-white rounded-md h-10 w-10"
              onClick={() => fetchRiders()}
              disabled={isLoading}
            >
              <RotateCcw size={18} className={isLoading ? "animate-spin" : ""} />
            </Button>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[200px] h-10 bg-white border-gray-200 font-medium">
                <CalendarIcon size={16} className="mr-2 text-gray-400" />
                <SelectValue placeholder="Last 30 days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last_7_days">Last 7 days</SelectItem>
                <SelectItem value="last_30_days">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-6 space-y-6 bg-white">
          {/* Search + Actions Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 border-gray-200 bg-[#FBFBFC]"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="h-11 border-gray-200 font-normal text-gray-600">
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
              <Button
                variant={isFilterOpen ? "default" : "outline"}
                className="h-11 border-gray-200 font-normal"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filter {isFilterOpen && <X className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Collapsible Filters */}
          {isFilterOpen && (
            <div className="border-b pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 px-3 h-10 bg-gray-50 border rounded-md text-sm text-gray-600">
                  <Filter size={16} /> Filter
                </div>

                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[180px] h-10 bg-white">
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent className="z-[110]">
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="last_7_days">Last 7 days</SelectItem>
                    <SelectItem value="last_30_days">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={activeTab} onValueChange={(val) => {
                  setActiveTab(val);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[180px] h-10 bg-white text-capitalize">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="z-[110]">
                    <SelectItem value="all">All Statuses</SelectItem>
                    {tabs.filter(t => t.status.key !== "all").map(tab => (
                      <SelectItem key={tab.status.key} value={tab.status.key}>
                        {tab.status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  variant="ghost" 
                  className="text-gray-500 text-sm font-medium hover:text-gray-900"
                  onClick={() => {
                    setSearchQuery("");
                    setDateRange("last_30_days");
                    setActiveTab("all");
                    setCurrentPage(1);
                  }}
                >
                  Reset all filters
                </Button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-6 border-b overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.status.key}
                onClick={() => {
                  setActiveTab(tab.status.key);
                  setCurrentPage(1);
                }}
                className={cn(
                  "pb-3 text-sm font-medium relative whitespace-nowrap",
                  activeTab === tab.status.key
                    ? "text-[#E86B35] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#E86B35]"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {tab.status.label} ({tab.total})
              </button>
            ))}
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm">
              Selected: <strong>{selectedRiders.length}</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={selectedRiders.length === 0}
              onClick={() => {
                // If single selected, pre-set action modal
                if (selectedRiders.length === 1) {
                  const rider = riders.find(r => r.riderId === selectedRiders[0]);
                  setSelectedRiderForAction(rider || null);
                }
                setMarkAsModalOpen(true);
              }}
            >
              Mark Rider As...
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={selectedRiders.length === 0}
              onClick={() => {
                if (selectedRiders.length === 1) {
                  const rider = riders.find(r => r.riderId === selectedRiders[0]);
                  setSelectedRiderForAction(rider || null);
                }
                setNotifyModalOpen(true);
              }}
            >
              Notify Rider...
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-400 border-gray-100"
              disabled={selectedRiders.length === 0 || isProcessing}
              onClick={handleBulkSuspendClick}
            >
              {isProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Suspend/Unsuspend
            </Button>
          </div>

          {/* Table Header */}
          <div className="space-y-0 border border-gray-200 rounded-md overflow-hidden">
            <div
              className={cn(
                gridLayout,
                "bg-[#F9FAFB] text-gray-900 border-b border-gray-200 text-sm font-medium",
              )}
            >
              <div className="flex items-center gap-3 border-r border-gray-200 py-3 pl-4">
                <Checkbox
                  className="rounded-sm"
                  checked={selectedRiders.length === riders.length && riders.length > 0}
                  onCheckedChange={() => {
                    if (selectedRiders.length === riders.length) setSelectedRiders([]);
                    else setSelectedRiders(riders.map(r => r.riderId));
                  }}
                />
                Rider Name
              </div>
              <div className="py-3 pl-4 border-r border-gray-200">Reg Date</div>
              <div className="py-3 pl-4 border-r border-gray-200">Online Status</div>
              <div className="py-3 pl-4 border-r border-gray-200">Status</div>
              <div className="flex justify-center items-center py-3">-</div>
            </div>

            {/* Table Rows */}
            {isLoading ? (
              <div className="py-20 text-center bg-white">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-[#E86B35]" />
                  <p className="text-gray-500 font-medium text-sm">Loading riders...</p>
                </div>
              </div>
            ) : riders.length === 0 ? (
              <div className="py-20 text-center text-gray-500 font-medium bg-white text-sm">
                No riders found.
              </div>
            ) : (
              riders.map((rider) => (
                <div
                  key={rider.riderId}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <div className={cn(gridLayout, "text-sm items-stretch bg-white")}>
                    <div className="flex items-center gap-3 border-r border-gray-100 py-4 pl-4 font-medium text-gray-900">
                      <Checkbox
                        className="rounded-sm"
                        checked={selectedRiders.includes(rider.riderId)}
                        onCheckedChange={() =>
                          setSelectedRiders(prev =>
                            prev.includes(rider.riderId)
                              ? prev.filter(id => id !== rider.riderId)
                              : [...prev, rider.riderId]
                          )
                        }
                      />
                      {rider.fullName}
                    </div>
                    <div className="flex items-center pl-4 border-r border-gray-100 text-gray-600">
                      {new Date(rider.registeredAt).toLocaleString("en-US", {
                        weekday: "short", month: "short", day: "numeric", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </div>
                    <div className="flex items-center pl-4 border-r border-gray-100">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-medium uppercase",
                        rider.onlineStatus.toLowerCase() === "online" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-gray-100 text-gray-700"
                      )}>
                        {rider.onlineStatus}
                      </span>
                    </div>
                    <div className="flex items-center pl-4 border-r border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-medium uppercase",
                          rider.status.toLowerCase().includes("approved") ? "bg-green-100 text-green-700" :
                          rider.status.toLowerCase().includes("pending") ? "bg-yellow-100 text-yellow-700" :
                          rider.status.toLowerCase().includes("rejected") ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-700"
                        )}>
                          {rider.status}
                        </span>
                        {rider.openFlagCount > 0 && (
                          <Flag size={14} className="text-red-500 fill-red-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-center items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal size={18} className="text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-md w-56">
                          <DropdownMenuItem 
                            className="flex items-center gap-2 py-2.5 w-full cursor-pointer"
                            onClick={() => router.push(`/admin/riders/${rider.riderId}`)}
                          >
                            <Eye size={16} /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-2 py-2.5 w-full cursor-pointer"
                            onClick={() => {
                              setSelectedRiderForAction(rider);
                              setMarkAsModalOpen(true);
                            }}
                          >
                            <UserCheck size={16} /> Mark Rider as...
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-2 py-2.5 w-full cursor-pointer"
                            onClick={() => {
                              setSelectedRiderForAction(rider);
                              setNotifyModalOpen(true);
                            }}
                          >
                            <Mail size={16} /> Notify Rider...
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className={cn(
                              "flex items-center gap-2 py-2.5 w-full cursor-pointer border-t mt-1",
                              rider.status.toLowerCase() === "suspended" ? "text-green-600 focus:text-green-700" : "text-red-500 focus:text-red-600"
                            )}
                            onClick={() => handleToggleSuspension(rider.riderId, rider.status)}
                            disabled={isProcessing}
                          >
                            <Ban size={16} /> {rider.status.toLowerCase() === "suspended" ? "Unsuspend Rider" : "Suspend Rider"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {!isLoading && totalItems > 0 && (
            <div className="flex items-center justify-center gap-6 text-sm border-t pt-6 pb-6">
              <p className="text-gray-500">
                Total{" "}
                <span className="text-gray-900 font-medium">
                  {totalItems} items
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
                  {getPageNumbers().map((page, i) => (
                    <Button
                      key={i}
                      variant={currentPage === page ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "h-8 w-8 rounded font-medium min-w-[32px]",
                        currentPage === page
                          ? "bg-[#E86B35] text-white hover:bg-[#d15d2c]"
                          : "text-gray-500 hover:bg-gray-100",
                        typeof page === "string" &&
                          "cursor-default hover:bg-transparent"
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
          )}
        </div>
      </div>

      {/* Mark As Modal */}
      <CustomModal
        isOpen={markAsModalOpen}
        onClose={() => setMarkAsModalOpen(false)}
        title="Mark Rider As"
        maxWidth="sm:max-w-[500px]"
        footer={
          <>
            <Button variant="outline" onClick={() => setMarkAsModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#E86B35] hover:bg-[#d15d2c] text-white font-medium"
              onClick={handleMarkStatus}
              disabled={isProcessing || !statusKey}
            >
              {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Update Status"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Change status for rider: <span className="font-medium">{selectedRiderForAction ? selectedRiderForAction.fullName : `${selectedRiders.length} selected riders`}</span>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
            <Select value={statusKey} onValueChange={setStatusKey}>
              <SelectTrigger className="w-full border-gray-300 rounded-md p-3 text-sm h-11 focus:ring-2 focus:ring-[#E86B35]">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent className="z-[110]">
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending_verification">Pending Verification</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <textarea
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Enter reason for status change..."
              rows={3}
              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E86B35] resize-y min-h-[100px]"
            />
          </div>
        </div>
      </CustomModal>

      {/* Notify Modal */}
      <CustomModal
        isOpen={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        title="Notify Rider"
        footer={
          <>
            <Button variant="outline" onClick={() => setNotifyModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#E86B35] hover:bg-[#d15d2c] text-white font-bold"
              onClick={handleNotify}
              disabled={isProcessing || !customMessage.trim()}
            >
              {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Send Message"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Send message to: <span className="font-bold">
              {selectedRiderForAction ? selectedRiderForAction.fullName : `${selectedRiders.length} selected riders`}
            </span>
          </p>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Type your message here..."
            rows={5}
            className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#E86B35] resize-none"
          />
        </div>
      </CustomModal>

      {/* Suspend Modal */}
      <CustomModal
        isOpen={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        title={isBulkSuspend ? "Suspend Selected Riders" : "Suspend Rider"}
        maxWidth="sm:max-w-[500px]"
        footer={
          <>
            <Button variant="outline" onClick={() => setSuspendModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-red-500 hover:bg-red-600 text-white font-medium"
              onClick={isBulkSuspend ? confirmBulkSuspend : () => confirmSuspension(selectedRiderForAction?.riderId || "", false, suspendReason)}
              disabled={isProcessing || !suspendReason.trim()}
            >
              {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Suspend Rider"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            {isBulkSuspend 
              ? `Provide a reason for suspending ${selectedRiders.length} selected riders:` 
              : `Provide a reason for suspending rider: `}
            {!isBulkSuspend && <span className="font-medium">{selectedRiderForAction?.fullName}</span>}
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Suspension</label>
            <Select value={suspendReason} onValueChange={setSuspendReason}>
              <SelectTrigger className="w-full border-gray-300 rounded-md p-3 text-sm h-11 focus:ring-2 focus:ring-red-500">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent className="z-[110]">
                <SelectItem value="Repeated delivery misconduct">Repeated delivery misconduct</SelectItem>
                <SelectItem value="Late deliveries">Frequent late deliveries</SelectItem>
                <SelectItem value="Customer complaints">High volume of customer complaints</SelectItem>
                <SelectItem value="Policy violation">Violation of company policy</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {suspendReason === "Other" && (
            <textarea
              value={suspendReason === "Other" ? "" : suspendReason} // Logic for custom reason could be improved
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Enter custom reason..."
              rows={3}
              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y min-h-[100px]"
            />
          )}
          {/* Simple custom reason input if "Other" is selected */}
          {suspendReason === "Other" ? (
             <textarea
               onChange={(e) => setSuspendReason(e.target.value)}
               placeholder="Specify the reason..."
               rows={3}
               className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y min-h-[100px]"
             />
          ) : null}
        </div>
      </CustomModal>
    </div>
  );
}
