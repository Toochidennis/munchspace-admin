"use client";

import React, { useState, useMemo } from "react";
import {
  Download,
  Filter,
  Search,
  MoreHorizontal,
  Info,
  Eye,
  Flag,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Calendar as CalendarIcon,
  X,
  Mail,
  UserCheck,
  Ban,
  Pause,
  Play,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
import { StatCard } from "./StatCard";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const gridLayout = "grid grid-cols-[120px_200px_1fr_140px_150px_60px]";

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | string)[] = [1];
  if (currentPage > 3) pages.push("...");
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    pages.push(i);
  }
  if (currentPage < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}

function CustomModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "sm:max-w-[580px]",
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

const riderStatusOptions = [
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "suspended", label: "Suspended" },
  { key: "pending_verification", label: "Pending Verification" },
];

export const RidersView = ({ range = "last_30_days", refreshTrigger = 0 }: { range?: string; refreshTrigger?: number }) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRiders, setSelectedRiders] = useState<string[]>([]);

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [markAsModalOpen, setMarkAsModalOpen] = useState(false);
  const [riderActionModalOpen, setRiderActionModalOpen] = useState(false);
  const [selectedRiderForAction, setSelectedRiderForAction] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isChangingRiderStatus, setIsChangingRiderStatus] = useState(false);
  const [selectedRiderStatusKey, setSelectedRiderStatusKey] = useState("");
  const [riderStatusReason, setRiderStatusReason] = useState("");
  const [isPerformingRiderAction, setIsPerformingRiderAction] = useState(false);
  const [riderActionType, setRiderActionType] = useState<string>("");
  const [riderActionReason, setRiderActionReason] = useState("");

  const openRiderActionModal = (riderId: string | null, type: string) => {
    setSelectedRiderForAction(riderId);
    setRiderActionType(type);
    setRiderActionReason("");
    setRiderActionModalOpen(true);
  };

  const executeRiderAction = async () => {
    if (
      (riderActionType === "suspend") &&
      !riderActionReason.trim()
    ) {
      toast.error("Please provide a reason");
      return;
    }

    setIsPerformingRiderAction(true);
    try {
      const riderIds = selectedRiderForAction
        ? [selectedRiderForAction]
        : [...selectedRiders];

      if (!riderIds.length) {
        toast.error("No riders selected");
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const riderId of riderIds) {
        try {
          const endpoint = `/admin/riders/${riderId}/${riderActionType}`;
          const res = await authenticatedFetch(endpoint, {
            method: "PATCH",
            body: JSON.stringify({
              reason: riderActionReason.trim(),
            }),
          });
          const result = await parseApiResponse(res);
          if (result?.success) {
            successCount++;
          } else {
            failCount++;
            if (riderIds.length === 1) {
              toast.error(result?.message || `Failed to ${riderActionType} rider`);
            }
          }
        } catch {
          failCount++;
        }
      }

      if (riderIds.length > 1) {
        if (failCount === 0)
          toast.success(
            `Action completed for all ${successCount} selected riders`,
          );
        else
          toast.warning(
            `Action completed for ${successCount}, failed for ${failCount} riders`,
          );
      } else if (successCount > 0) {
        toast.success(`Rider successfully ${riderActionType}ed`);
      }

      setRiderActionModalOpen(false);
      setSelectedRiderForAction(null);
      setRiderActionType("");
      setRiderActionReason("");
      setSelectedRiders([]);
      fetchDashboardData();
    } catch (err) {
      toast.error(`Failed to ${riderActionType} rider`);
    } finally {
      setIsPerformingRiderAction(false);
    }
  };

  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchDashboardData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        type: "riders",
        range,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      if (debouncedSearch) params.append("search", debouncedSearch);

      const res = await authenticatedFetch(`/admin/analytics/dashboard?${params.toString()}`);
      const result = await parseApiResponse(res);
      if (result?.success) setData(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [range, currentPage, itemsPerPage, debouncedSearch, refreshTrigger]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const riders = useMemo(() => data?.table?.data || [], [data]);
  const totalItems = data?.table?.pagination?.total || 0;
  const totalPages = data?.table?.pagination?.totalPages || 1;

  const dynamicDailyData = useMemo(() => {
    if (!data?.charts?.deliveryTrend?.currentPeriod?.length) return [];
    const current = data.charts.deliveryTrend.currentPeriod;
    const previous = data.charts.deliveryTrend.previousPeriod || [];
    return current.map((item: any, i: number) => ({
      day: new Date(item.date).getDate().toString(),
      thisPeriod: item.value,
      lastPeriod: previous[i]?.value || 0,
    }));
  }, [data]);

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Riders" value={data?.summary?.totalRiders?.toLocaleString() || "0"} trend={`${data?.trends?.totalRiders?.percentageChange || 0}%`} trendType={data?.trends?.totalRiders?.trend === "down" ? "down" : "up"} />
        <StatCard title="Approved Riders" value={data?.summary?.approvedRiders?.toLocaleString() || "0"} trend={`${data?.trends?.approvedRiders?.percentageChange || 0}%`} trendType={data?.trends?.approvedRiders?.trend === "down" ? "down" : "up"} />
        <StatCard title="Total Delivered" value={data?.summary?.totalDelivered?.toLocaleString() || "0"} trend={`${data?.trends?.totalDelivered?.percentageChange || 0}%`} trendType={data?.trends?.totalDelivered?.trend === "down" ? "down" : "up"} />
        <StatCard title="Success Rate" value={`${data?.summary?.successRate || "0"}%`} trend={`${data?.trends?.successRate?.percentageChange || 0}%`} trendType={data?.trends?.successRate?.trend === "down" ? "down" : "up"} />
      </div>

      {/* Delivery Trend Chart */}
      <Card className="border shadow-none rounded-md p-0 gap-0 space-y-0">
        <div className="px-9 flex justify-between items-center uppercase border-b py-3">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold">Delivery Trends Over Time</h1>
            <Info size={15} />
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" /> This Period
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500" /> Last Period
            </div>
          </div>
        </div>
        <CardContent className="p-6 pt-4">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dynamicDailyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} />
              <Tooltip />
              <Line type="monotone" dataKey="thisPeriod" stroke="#00C950" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="lastPeriod" stroke="#7C3AED" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Riders Table Card */}
      <Card className="border-none shadow-sm rounded-md overflow-hidden bg-white">
        <CardHeader className="border-b py-6 px-6 space-y-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-normal">
              {isLoading ? <Skeleton className="h-6 w-32" /> : `Riders (${totalItems})`}
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search riders..."
                  className="pl-9 h-10 border-gray-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="h-10 border-gray-200">
                <Download size={18} />
              </Button>
              <Button variant="outline" className="h-10 border-gray-200">
                <Filter size={18} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Bulk actions bar */}
          <div className="flex items-center gap-3 flex-wrap px-6 py-4 border-b bg-white">
            <span className="text-sm">Selected: <strong>{selectedRiders.length}</strong></span>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedRiders.length}
              onClick={() => {
                setSelectedRiderForAction(null);
                setSelectedRiderStatusKey("");
                setRiderStatusReason("");
                setMarkAsModalOpen(true);
              }}
            >
              Mark Rider As...
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedRiders.length}
              onClick={() => {
                setSelectedRiderForAction(null);
                setCustomMessage("");
                setNotifyModalOpen(true);
              }}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Notify Rider...
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-400 border-gray-100"
              disabled={!selectedRiders.length}
              onClick={() => openRiderActionModal(null, "suspend")}
            >
              Suspend/Unsuspend
            </Button>
          </div>

          {/* Table */}
          <div className="space-y-0 border border-gray-200 rounded-md overflow-hidden mx-6 mt-4 mb-6">
            {/* Header */}
            <div className={cn(gridLayout, "bg-[#F9FAFB] text-gray-900 border-b border-gray-200 text-sm font-medium")}>
              <div className="py-3 pl-4 border-r border-gray-200 text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Rider Code
              </div>
              <div className="flex items-center gap-3 border-r border-gray-200 py-3 pl-4">
                <Checkbox
                  className="rounded-sm"
                  checked={selectedRiders.length === riders.length && riders.length > 0}
                  onCheckedChange={() => {
                    if (selectedRiders.length === riders.length) setSelectedRiders([]);
                    else setSelectedRiders(riders.map((r: any) => r.riderId));
                  }}
                />
                Rider Name
              </div>
              <div className="py-3 pl-4 border-r border-gray-200">Reg Date</div>
              <div className="py-3 pl-4 border-r border-gray-200">Online Status</div>
              <div className="py-3 pl-4 border-r border-gray-200">Status</div>
              <div className="flex justify-center items-center py-3">-</div>
            </div>

            {/* Rows */}
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={cn(gridLayout, "border-b border-gray-100 bg-white")}>
                  <div className="flex items-center pl-4 py-4 border-r border-gray-100">
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex items-center gap-3 pl-4 py-4 border-r border-gray-100">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center pl-4 py-4 border-r border-gray-100">
                    <Skeleton className="h-4 w-36" />
                  </div>
                  <div className="flex items-center pl-4 py-4 border-r border-gray-100">
                    <Skeleton className="h-6 w-16 rounded" />
                  </div>
                  <div className="flex items-center pl-4 py-4 border-r border-gray-100">
                    <Skeleton className="h-6 w-20 rounded" />
                  </div>
                  <div className="flex justify-center items-center py-4">
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              ))
            ) : riders.length === 0 ? (
              <div className="py-20 text-center text-gray-500 font-medium bg-white text-sm">
                No riders found.
              </div>
            ) : (
              riders.map((rider: any) => (
                <div key={rider.riderId} className="border-b border-gray-100 last:border-b-0">
                  <div className={cn(gridLayout, "text-sm items-stretch bg-white")}>
                    {/* Rider Code */}
                    <div className="flex items-center pl-4 border-r border-gray-100 py-4">
                      <span className="font-mono text-xs text-gray-500">{rider.code}</span>
                    </div>
                    {/* Name + checkbox */}
                    <div className="flex items-center gap-3 border-r border-gray-100 py-4 pl-4 font-medium text-gray-900">
                      <Checkbox
                        className="rounded-sm"
                        checked={selectedRiders.includes(rider.riderId)}
                        onCheckedChange={() =>
                          setSelectedRiders((prev) =>
                            prev.includes(rider.riderId)
                              ? prev.filter((id) => id !== rider.riderId)
                              : [...prev, rider.riderId],
                          )
                        }
                      />
                      {rider.fullName}
                    </div>
                    {/* Reg Date */}
                    <div className="flex items-center pl-4 border-r border-gray-100 text-gray-600">
                      {rider.registeredAt ? format(new Date(rider.registeredAt), "do MMM yyyy, h:mm a") : "—"}
                    </div>
                    {/* Online Status */}
                    <div className="flex items-center pl-4 border-r border-gray-100">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-medium uppercase",
                        rider.onlineStatus?.toLowerCase() === "online"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700",
                      )}>
                        {rider.onlineStatus}
                      </span>
                    </div>
                    {/* Status */}
                    <div className="flex items-center pl-4 border-r border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-medium uppercase",
                          rider.status?.toLowerCase().includes("approved") ? "bg-green-100 text-green-700" :
                          rider.status?.toLowerCase().includes("pending") ? "bg-yellow-100 text-yellow-700" :
                          rider.status?.toLowerCase().includes("rejected") ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-700",
                        )}>
                          {rider.status}
                        </span>
                        {rider.openFlagCount > 0 && (
                          <Flag size={14} className="text-red-500 fill-red-500" />
                        )}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex justify-center items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal size={18} className="text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-md w-52">
                          <DropdownMenuItem
                            className="flex items-center gap-3 py-2.5 font-medium text-xs text-gray-700 focus:bg-gray-50 cursor-pointer"
                            onClick={() => router.push(`/admin/riders/${rider.riderId}`)}
                          >
                            <Eye size={16} className="text-gray-400" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-3 py-2.5 font-medium text-xs text-gray-700 focus:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              setSelectedRiderForAction(rider.riderId);
                              setSelectedRiderStatusKey("");
                              setRiderStatusReason("");
                              setMarkAsModalOpen(true);
                            }}
                          >
                            <UserCheck size={16} className="text-gray-400" /> Mark Rider as...
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-3 py-2.5 font-medium text-xs text-gray-700 focus:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              setSelectedRiderForAction(rider.riderId);
                              setCustomMessage("");
                              setNotifyModalOpen(true);
                            }}
                          >
                            <Mail size={16} className="text-gray-400" /> Notify Rider...
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={cn(
                              "gap-3 py-2.5 font-medium text-xs border-t border-gray-50 mt-1 focus:bg-gray-50 cursor-pointer",
                              rider.status?.toLowerCase() === "suspended" ? "text-blue-600 focus:text-blue-700" : "text-red-500 focus:text-red-600"
                            )}
                            onClick={() => openRiderActionModal(rider.riderId, rider.status?.toLowerCase() === "suspended" ? "unsuspend" : "suspend")}
                          >
                            <Ban size={16} /> {rider.status?.toLowerCase() === "suspended" ? "Unsuspend Rider" : "Suspend Rider"}
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
            <div className="flex items-center justify-center gap-6 text-sm border-t pt-6 pb-6 bg-white">
              <p className="text-gray-500">
                Total <span className="text-gray-900 font-medium">{totalItems} items</span>
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 rounded"
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
                          ? "bg-[#E86B35] text-white hover:bg-[#d15d2c]"
                          : "text-gray-500 hover:bg-gray-100",
                        typeof page === "string" && "cursor-default hover:bg-transparent",
                      )}
                      disabled={typeof page === "string"}
                      onClick={() => typeof page === "number" && setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 rounded"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={18} />
                </Button>
              </div>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}
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
        </CardContent>
      </Card>


        {/* Notify Rider Modal */}
      <CustomModal
        isOpen={notifyModalOpen}
        onClose={() => {
          setNotifyModalOpen(false);
          setCustomMessage("");
        }}
        title="Notify Rider"
        maxWidth="sm:max-w-[580px]"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setNotifyModalOpen(false);
                setCustomMessage("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white shadow-none"
              disabled={!customMessage.trim() || isSendingMessage}
              onClick={async () => {
                if (!customMessage.trim()) return;

                setIsSendingMessage(true);
                try {
                  const riderIds = selectedRiderForAction
                    ? [selectedRiderForAction]
                    : [...selectedRiders];

                  if (!riderIds.length) {
                    toast.error("No riders selected");
                    return;
                  }

                  // Simulated API call for notification
                  setTimeout(() => {
                    toast.success(
                      `Message sent to ${riderIds.length} rider${riderIds.length > 1 ? "s" : ""}`,
                    );
                    setNotifyModalOpen(false);
                    setCustomMessage("");
                    setSelectedRiders([]);
                    setIsSendingMessage(false);
                  }, 1000);
                } catch (err) {
                  toast.error("Failed to send message");
                  setIsSendingMessage(false);
                }
              }}
            >
              {isSendingMessage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-700">
            {selectedRiderForAction ? (
              <>
                Send a message to rider:{" "}
                <span className="font-medium">
                  {riders.find((r: any) => r.riderId === selectedRiderForAction)?.fullName || "Rider"}
                </span>
              </>
            ) : (
              <>
                Send a message to riders for{" "}
                <span className="font-medium">
                  {selectedRiders.length} selected rider
                  {selectedRiders.length !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </p>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={5}
              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
            />
          </div>
        </div>
      </CustomModal>

      {/* Mark Rider As Modal */}
      <CustomModal
        isOpen={markAsModalOpen}
        onClose={() => {
          if (!isChangingRiderStatus) {
            setMarkAsModalOpen(false);
            setSelectedRiderForAction(null);
            setSelectedRiderStatusKey("");
            setRiderStatusReason("");
          }
        }}
        title="Mark Rider As"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setMarkAsModalOpen(false);
                setSelectedRiderForAction(null);
                setSelectedRiderStatusKey("");
                setRiderStatusReason("");
              }}
              disabled={isChangingRiderStatus}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white shadow-none"
              disabled={
                !selectedRiderStatusKey ||
                !riderStatusReason.trim() ||
                isChangingRiderStatus
              }
              onClick={async () => {
                if (!selectedRiderStatusKey || !riderStatusReason.trim())
                  return;

                setIsChangingRiderStatus(true);

                try {
                  const riderIds = selectedRiderForAction
                    ? [selectedRiderForAction]
                    : [...selectedRiders];

                  if (!riderIds.length) {
                    toast.error("No rider selected");
                    return;
                  }

                  let successCount = 0;
                  let failCount = 0;

                  for (const riderId of riderIds) {
                    try {
                      const res = await authenticatedFetch(
                        `/admin/riders/${riderId}/status`,
                        {
                          method: "PATCH",
                          body: JSON.stringify({
                            statusKey: selectedRiderStatusKey,
                            reason: riderStatusReason.trim(),
                          }),
                        },
                      );
                      const result = await parseApiResponse(res);
                      if (result?.success) {
                        successCount++;
                      } else {
                        failCount++;
                        if (riderIds.length === 1) {
                          toast.error(result?.message || "Failed to update status");
                        }
                      }
                    } catch {
                      failCount++;
                    }
                  }

                  if (riderIds.length > 1) {
                    if (failCount === 0) {
                      toast.success(
                        `Status updated for ${successCount} rider${successCount > 1 ? "s" : ""}`,
                      );
                    } else {
                      toast.warning(
                        `Updated ${successCount}, failed for ${failCount} rider${failCount > 1 ? "s" : ""}`,
                      );
                    }
                  } else if (successCount > 0) {
                    toast.success("Rider status updated successfully");
                  }

                  setMarkAsModalOpen(false);
                  setSelectedRiderForAction(null);
                  setSelectedRiderStatusKey("");
                  setRiderStatusReason("");
                  setSelectedRiders([]);
                  fetchDashboardData();
                } catch (err) {
                  toast.error("Failed to update rider status");
                } finally {
                  setIsChangingRiderStatus(false);
                }
              }}
            >
              {isChangingRiderStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            {selectedRiderForAction ? (
              <>
                Change status for rider:{" "}
                <span className="font-medium">
                  {riders.find((r: any) => r.riderId === selectedRiderForAction)?.fullName || "Rider"}
                </span>
              </>
            ) : (
              <>
                Change status for{" "}
                <span className="font-medium">
                  {selectedRiders.length} selected rider
                  {selectedRiders.length !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <Select
                value={selectedRiderStatusKey}
                onValueChange={setSelectedRiderStatusKey}
                disabled={isChangingRiderStatus}
              >
                <SelectTrigger className="w-full shadow-none">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  {riderStatusOptions.map((opt) => (
                    <SelectItem key={opt.key} value={opt.key}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason
              </label>
              <textarea
                value={riderStatusReason}
                onChange={(e) => setRiderStatusReason(e.target.value)}
                placeholder="Enter reason for status change..."
                rows={3}
                className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
                disabled={isChangingRiderStatus}
              />
            </div>
          </div>
        </div>
      </CustomModal>

      {/* Rider Action Modal */}
      <CustomModal
        isOpen={riderActionModalOpen}
        onClose={() => {
          if (!isPerformingRiderAction) {
            setRiderActionModalOpen(false);
            setRiderActionReason("");
          }
        }}
        title={`${riderActionType ? riderActionType.charAt(0).toUpperCase() + riderActionType.slice(1) : "Action"} Rider`}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setRiderActionModalOpen(false);
                setRiderActionReason("");
              }}
              disabled={isPerformingRiderAction}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white shadow-none"
              disabled={
                (riderActionType === "suspend" && !riderActionReason.trim()) ||
                isPerformingRiderAction
              }
              onClick={executeRiderAction}
            >
              {isPerformingRiderAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            {selectedRiderForAction ? (
              <>
                Are you sure you want to {riderActionType} this rider:{" "}
                <span className="font-medium">
                  {riders.find((r: any) => r.riderId === selectedRiderForAction)?.fullName || "Rider"}
                </span>
                ?
              </>
            ) : (
              <>
                Are you sure you want to {riderActionType}{" "}
                <span className="font-medium">
                  {selectedRiders.length} selected rider
                  {selectedRiders.length !== 1 ? "s" : ""}
                </span>
                ?
              </>
            )}
          </p>

          {riderActionType === "suspend" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={riderActionReason}
                onChange={(e) => setRiderActionReason(e.target.value)}
                placeholder="Enter reason..."
                rows={3}
                className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
                disabled={isPerformingRiderAction}
              />
            </div>
          )}
        </div>
      </CustomModal>
    </div>
  );
};
