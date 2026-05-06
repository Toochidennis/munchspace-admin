"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  Filter,
  RotateCcw,
  Calendar as CalendarIcon,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Mail,
  Ban,
  UserCheck,
  Loader2,
  Pause,
  Play,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";

// --- DATA TYPES ---
interface ApiVendor {
  id: string; 
  vendorId: string;
  legalName: string;
  displayName: string;
  createdAt: string;
  status: string;
  menuItemsCount: number;
}

interface StatusCounts {
  ONBOARDING: number;
  PENDING_REVIEW: number;
  ACTIVE: number;
  REJECTED: number;
  SUSPENDED: number;
  DEACTIVATED: number;
}

const vendorStatusOptions = [
  { key: "active", label: "Active" },
  { key: "suspended", label: "Suspended" },
  { key: "rejected", label: "Rejected" },
  { key: "pending_review", label: "Pending Review" },
];

const CustomDialog = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
          >
            <X size={20} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default function VendorsPage() {
  const router = useRouter();

  // Filters State
  const [activeTab, setActiveTab] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<string>("");
  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined);

  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(20);

  // Data State
  const [vendors, setVendors] = React.useState<ApiVendor[]>([]);
  const [statusCounts, setStatusCounts] = React.useState<StatusCounts>({
    ONBOARDING: 0,
    PENDING_REVIEW: 0,
    ACTIVE: 0,
    REJECTED: 0,
    SUSPENDED: 0,
    DEACTIVATED: 0,
  });
  const [totalVendors, setTotalVendors] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);

  // Action State
  const [selectedVendors, setSelectedVendors] = React.useState<string[]>([]);
  const [showNotifyModal, setShowNotifyModal] = React.useState(false);
  const [customMessage, setCustomMessage] = React.useState("");
  const [isSendingMessage, setIsSendingMessage] = React.useState(false);

  // Mark Vendor As State
  const [markVendorAsOpen, setMarkVendorAsOpen] = React.useState(false);
  const [selectedVendorStatusKey, setSelectedVendorStatusKey] =
    React.useState("");
  const [vendorStatusReason, setVendorStatusReason] = React.useState("");
  const [isChangingVendorStatus, setIsChangingVendorStatus] =
    React.useState(false);
  const [selectedVendorForAction, setSelectedVendorForAction] = React.useState<
    string | null
  >(null);

  // Vendor Action Modal (Suspend, Unsuspend, Deactivate)
  const [vendorActionModalOpen, setVendorActionModalOpen] =
    React.useState(false);
  const [vendorActionType, setVendorActionType] = React.useState<
    "suspend" | "unsuspend" | "deactivate" | ""
  >("");
  const [vendorActionReason, setVendorActionReason] = React.useState("");
  const [isPerformingVendorAction, setIsPerformingVendorAction] =
    React.useState(false);

  const openVendorActionModal = (
    vendorId: string | null,
    action: "suspend" | "unsuspend" | "deactivate",
  ) => {
    setSelectedVendorForAction(vendorId);
    setVendorActionType(action);
    setVendorActionReason(
      action === "suspend"
        ? "Policy violation reported by multiple customers"
        : action === "deactivate"
          ? "Repeated severe policy violations. Account cannot be reinstated."
          : "",
    );
    setVendorActionModalOpen(true);
  };

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Logic
  const fetchVendors = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (activeTab !== "all") {
        params.append("status", activeTab);
      }
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }
      if (startDate) {
        params.append("startDate", startDate.toISOString());
      }
      if (endDate) {
        params.append("endDate", endDate.toISOString());
      }

      const res = await authenticatedFetch(
        `/admin/businesses?${params.toString()}`,
      );
      const apiRes = await parseApiResponse(res);

      if (apiRes?.success) {
        setVendors(apiRes.data.data || []);
        setTotalVendors(apiRes.data.meta?.total || 0);
        setTotalPages(apiRes.data.meta?.totalPages || 1);
        setStatusCounts(
          apiRes.data.statusCounts || {
            ONBOARDING: 0,
            PENDING_REVIEW: 0,
            ACTIVE: 0,
            REJECTED: 0,
            SUSPENDED: 0,
            DEACTIVATED: 0,
          },
        );
      } else {
        toast.error(apiRes?.message || "Failed to fetch vendors");
      }
    } catch (err) {
      toast.error("An error occurred while fetching vendors");
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    activeTab,
    debouncedSearch,
    startDate,
    endDate,
  ]);

  React.useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const executeVendorAction = async () => {
    if (!vendorActionType) return;

    setIsPerformingVendorAction(true);
    let payload: any = undefined;
    if (vendorActionType === "suspend" || vendorActionType === "deactivate") {
      payload = { reason: vendorActionReason.trim() };
    }

    try {
      const vendorIds = selectedVendorForAction
        ? [selectedVendorForAction]
        : [...selectedVendors];

      if (!vendorIds.length) {
        toast.error("No vendor selected");
        setIsPerformingVendorAction(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const vId of vendorIds) {
        try {
          const res = await authenticatedFetch(
            `/admin/vendors/${vId}/${vendorActionType}`,
            {
              method: "PATCH",
              body: payload ? JSON.stringify(payload) : undefined,
            },
          );
          const result = await parseApiResponse(res);
          if (result?.success) {
            successCount++;
          } else {
            failCount++;
            if (vendorIds.length === 1)
              toast.error(
                result?.error ||
                  result?.message ||
                  `Failed to ${vendorActionType} vendor`,
              );
          }
        } catch {
          failCount++;
        }
      }

      if (vendorIds.length > 1) {
        if (failCount === 0)
          toast.success(
            `Successfully ${vendorActionType}ed ${successCount} vendors`,
          );
        else
          toast.warning(
            `Action completed for ${successCount}, failed for ${failCount} vendors`,
          );
      } else if (successCount > 0) {
        toast.success(`Vendor successfully ${vendorActionType}ed`);
      }

      setVendorActionModalOpen(false);
      setSelectedVendorForAction(null);
      setVendorActionType("");
      setVendorActionReason("");
      setSelectedVendors([]);
      fetchVendors();
    } catch (err) {
      toast.error(`Failed to ${vendorActionType} vendor`);
    } finally {
      setIsPerformingVendorAction(false);
    }
  };

  // Handle Tab Change
  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  const totalStatusCount = React.useMemo(() => {
    return Object.values(statusCounts).reduce((a, b) => a + b, 0);
  }, [statusCounts]);

  return (
    <div className="block h-auto w-full bg-[#F8FAFC] overflow-auto">
      <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-6 pb-24">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {isLoading ? (
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </span>
            ) : (
              `Total (${totalStatusCount})`
            )}
          </h1>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400"
              onClick={fetchVendors}
              disabled={isLoading}
            >
              <RotateCcw
                size={20}
                className={isLoading ? "animate-spin" : ""}
              />
            </Button>
            <Select
              value={dateRange || "all"}
              onValueChange={(val) => {
                setDateRange(val === "all" ? "" : val);
                setStartDate(undefined);
                setEndDate(undefined);
              }}
            >
              <SelectTrigger className="w-[180px] h-10 bg-white border-gray-200 text-gray-600 font-medium">
                <CalendarIcon size={16} className="mr-2 text-gray-400" />
                <SelectValue placeholder="All time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-none rounded-xl bg-white p-6 space-y-6 overflow-visible">
          {/* Filters & Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                placeholder="Search"
                className="pl-10 h-11 border-gray-200 bg-[#FBFBFC] rounded-lg focus-visible:ring-gray-200"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-11 border-gray-200 text-gray-600 font-medium gap-2 px-5 shadow-none"
              >
                <Download size={18} /> Download
              </Button>
              <Button
                variant={isFilterOpen ? "default" : "outline"}
                className={cn(
                  "h-11 font-semibold border-gray-200 shadow-none gap-2 px-5",
                  isFilterOpen &&
                    "bg-gray-100 text-gray-900 border-transparent",
                )}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter size={18} /> Filter {isFilterOpen && <X size={14} />}
              </Button>
            </div>
          </div>

          {/* Date Picker Row (If filter open) */}
          {isFilterOpen && (
            <div className="flex flex-wrap gap-3 items-center py-2 border-b border-gray-100">
              <div className="flex items-center gap-2 px-3 h-9 bg-gray-50 border border-gray-100 rounded-md text-xs font-semibold text-gray-600">
                <Filter size={14} /> Custom Date
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[200px] h-9 text-xs justify-start shadow-none border-gray-200"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[150]">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => {
                      setStartDate(d);
                      setDateRange("");
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[200px] h-9 text-xs justify-start shadow-none border-gray-200"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[150]">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(d) => {
                      setEndDate(d);
                      setDateRange("");
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-6 border-b border-gray-100 overflow-x-auto scrollbar-hide">
            {[
              { id: "all", label: "All", count: totalStatusCount },
              ...Object.entries(statusCounts)
                .filter(([_, count]) => count > 0)
                .map(([key, count]) => ({
                  id: key.toLowerCase(),
                  label:
                    key.charAt(0).toUpperCase() +
                    key.slice(1).toLowerCase().replace(/_/g, " "),
                  count: count,
                })),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "pb-3 text-sm font-medium relative whitespace-nowrap",
                  activeTab === tab.id
                    ? "text-[#E86B35] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#E86B35]"
                    : "text-gray-500 hover:text-gray-700",
                )}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-4 py-1">
            <span className="text-sm font-semibold text-gray-900">
              Selected: {selectedVendors.length}
            </span>
            <Button
              disabled={selectedVendors.length === 0}
              variant="outline"
              className="h-9 border-gray-100 bg-gray-50 text-gray-400 font-semibold text-xs rounded-md shadow-none"
              onClick={() => {
                setSelectedVendorForAction(null);
                setSelectedVendorStatusKey("");
                setVendorStatusReason("");
                setMarkVendorAsOpen(true);
              }}
            >
              Mark Vendor As...
            </Button>
            <Button
              disabled={selectedVendors.length === 0}
              variant="outline"
              className="h-9 border-gray-100 bg-gray-50 text-gray-400 font-semibold text-xs rounded-md shadow-none"
              onClick={() => {
                setSelectedVendorForAction(null);
                setCustomMessage("");
                setShowNotifyModal(true);
              }}
            >
              Notify Vendor...
            </Button>
            <Button
              disabled={selectedVendors.length === 0}
              variant="outline"
              className="h-9 border-gray-100 bg-gray-50 text-gray-400 font-semibold text-xs rounded-md shadow-none"
              onClick={() => openVendorActionModal(null, "deactivate")}
            >
              Deactivate Vendor
            </Button>
          </div>

          {/* Table */}
          <div className="border border-gray-100 rounded-lg overflow-x-auto bg-white">
            <table className="w-full text-sm text-left border-collapse min-w-[900px]">
              <thead className="bg-[#F8FAFC] text-gray-700 font-semibold border-b border-gray-100">
                <tr>
                  <th className="p-4 w-12 border-r border-gray-100">
                    <Checkbox
                      checked={
                        selectedVendors.length === vendors.length &&
                        vendors.length > 0
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedVendors(vendors.map((v) => v.vendorId));
                        } else {
                          setSelectedVendors([]);
                        }
                      }}
                      className="border-gray-300 data-[state=checked]:bg-[#E86B35] data-[state=checked]:border-[#E86B35]"
                    />
                  </th>
                  <th className="p-4 text-[11px] uppercase tracking-wider text-gray-500 border-r border-gray-100 whitespace-nowrap">
                    Vendor Name
                  </th>
                  <th className="p-4 text-[11px] uppercase tracking-wider text-gray-500 border-r border-gray-100 whitespace-nowrap">
                    Reg Date
                  </th>
                  <th className="p-4 text-[11px] uppercase tracking-wider text-gray-500 border-r border-gray-100 whitespace-nowrap">
                    Items Listed
                  </th>
                  <th className="p-4 text-[11px] uppercase tracking-wider text-gray-500 border-r border-gray-100 whitespace-nowrap">
                    Status
                  </th>
                  <th className="p-4 text-center w-10">-</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-4 border-r border-gray-100">
                      <Checkbox
                        checked={selectedVendors.includes(vendor.vendorId)}
                        onCheckedChange={() =>
                          setSelectedVendors((prev) =>
                            prev.includes(vendor.vendorId)
                              ? prev.filter((i) => i !== vendor.vendorId)
                              : [...prev, vendor.vendorId],
                          )
                        }
                        className="border-gray-300 data-[state=checked]:bg-[#E86B35] data-[state=checked]:border-[#E86B35]"
                      />
                    </td>
                    <td className="p-4 text-gray-600 font-medium border-r border-gray-100">
                      <div className="flex flex-col">
                        <span>{vendor.displayName || vendor.legalName}</span>
                        <span className="text-[10px] text-gray-400 font-mono truncate max-w-[180px]">
                          {vendor.legalName}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 border-r border-gray-100 whitespace-nowrap">
                      {format(
                        new Date(vendor.createdAt),
                        "do MMM yyyy, h:mm a",
                      )}
                    </td>
                    <td className="p-4 text-gray-600 font-medium border-r border-gray-100">
                      {vendor.menuItemsCount}
                    </td>
                    <td className="p-4 border-r border-gray-100">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded text-[10px] uppercase font-bold text-white inline-block",
                          vendor.status === "ACTIVE"
                            ? "bg-[#50C828]"
                            : vendor.status === "PENDING_REVIEW"
                              ? "bg-yellow-500"
                              : vendor.status === "REJECTED"
                                ? "bg-red-500"
                                : vendor.status === "DEACTIVATED"
                                  ? "bg-gray-500"
                                  : vendor.status === "SUSPENDED"
                                    ? "bg-red-600"
                                    : "bg-blue-500", // ONBOARDING
                        )}
                      >
                        {vendor.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-gray-900"
                          >
                            <MoreHorizontal size={20} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-52 p-1.5 shadow-lg border-gray-100 rounded-lg"
                        >
                          <DropdownMenuItem
                            className="gap-3 py-2.5 font-medium text-xs text-gray-700 focus:bg-gray-50 cursor-pointer"
                            onClick={() =>
                              router.push(`/admin/vendors/${vendor.id}`)
                            }
                          >
                            <Eye size={16} className="text-gray-400" /> View
                            Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-3 py-2.5 font-medium text-xs text-gray-700 focus:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              setSelectedVendorForAction(vendor.vendorId);
                              setSelectedVendorStatusKey("");
                              setVendorStatusReason("");
                              setMarkVendorAsOpen(true);
                            }}
                          >
                            <UserCheck size={16} className="text-gray-400" />{" "}
                            Mark Vendor as...
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-3 py-2.5 font-medium text-xs text-gray-700 focus:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              setSelectedVendorForAction(vendor.vendorId);
                              setCustomMessage("");
                              setShowNotifyModal(true);
                            }}
                          >
                            <Mail size={16} className="text-gray-400" /> Notify
                            Vendor...
                          </DropdownMenuItem>

                          {vendor.status === "SUSPENDED" ? (
                            <DropdownMenuItem
                              className="gap-3 py-2.5 font-medium text-xs text-blue-600 border-t border-gray-50 mt-1 focus:bg-blue-50 cursor-pointer"
                              onClick={() =>
                                openVendorActionModal(
                                  vendor.vendorId,
                                  "unsuspend",
                                )
                              }
                            >
                              <Play size={16} /> Unsuspend Vendor
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="gap-3 py-2.5 font-medium text-xs text-orange-600 border-t border-gray-50 mt-1 focus:bg-orange-50 cursor-pointer"
                              onClick={() =>
                                openVendorActionModal(
                                  vendor.vendorId,
                                  "suspend",
                                )
                              }
                            >
                              <Pause size={16} /> Suspend Vendor
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            className="gap-3 py-2.5 font-medium text-xs text-red-500 border-t border-gray-50 mt-1 focus:bg-red-50 cursor-pointer"
                            onClick={() =>
                              openVendorActionModal(
                                vendor.vendorId,
                                "deactivate",
                              )
                            }
                          >
                            <Ban size={16} /> Deactivate Vendor
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {!isLoading && vendors.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-gray-500 font-medium"
                    >
                      No vendors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-6 text-sm border-t border-gray-100 pt-6">
            <p className="text-gray-500">
              Total{" "}
              <span className="text-gray-900 font-medium">
                {totalVendors} items
              </span>
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded"
                disabled={currentPage === 1 || isLoading}
                onClick={() => setCurrentPage((p) => p - 1)}
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
                      "h-8 w-8 rounded font-medium shadow-none",
                      currentPage === page
                        ? "bg-[#E86B35] text-white hover:bg-[#d15d2c]"
                        : "text-gray-500",
                    )}
                    onClick={() =>
                      typeof page === "number" && setCurrentPage(page)
                    }
                    disabled={isLoading}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded"
                disabled={
                  currentPage === totalPages || totalPages === 0 || isLoading
                }
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight size={18} />
              </Button>
            </div>
            <Select
              value={`${itemsPerPage}`}
              onValueChange={(v) => {
                setItemsPerPage(Number(v));
                setCurrentPage(1);
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[110px] h-10 bg-gray-50 border-gray-200 text-xs font-medium rounded shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>

      <CustomDialog
        isOpen={showNotifyModal}
        onClose={() => {
          setShowNotifyModal(false);
          setCustomMessage("");
        }}
        title="Notify Vendor"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700">
            {selectedVendorForAction ? (
              <>
                Send a message to vendor:{" "}
                <span className="font-medium">
                  {vendors.find((v) => v.vendorId === selectedVendorForAction)
                    ?.displayName ||
                    vendors.find((v) => v.vendorId === selectedVendorForAction)
                      ?.legalName ||
                    "Vendor"}
                </span>
              </>
            ) : (
              <>
                Send a message to vendors for{" "}
                <span className="font-medium">
                  {selectedVendors.length} selected vendor
                  {selectedVendors.length !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={5}
              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E86B35] resize-y"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => {
                setShowNotifyModal(false);
                setCustomMessage("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#E86B35] hover:bg-[#d15d2c] text-white shadow-none"
              disabled={!customMessage.trim() || isSendingMessage}
              onClick={async () => {
                if (!customMessage.trim()) return;

                setIsSendingMessage(true);
                try {
                  const vendorIds = selectedVendorForAction
                    ? [selectedVendorForAction]
                    : [...selectedVendors];

                  if (!vendorIds.length) {
                    toast.error("No vendors selected");
                    return;
                  }

                  const res = await authenticatedFetch(
                    `/admin/vendors/bulk/messages`,
                    {
                      method: "POST",
                      body: JSON.stringify({
                        vendorIds,
                        message: customMessage.trim(),
                      }),
                    },
                  );
                  const result = await parseApiResponse(res);

                  if (result?.success) {
                    toast.success(
                      `Message sent to ${vendorIds.length} vendor${vendorIds.length > 1 ? "s" : ""}`,
                    );
                  } else {
                    const errorMessage =
                      result?.error ||
                      result?.message ||
                      "Failed to send message";
                    toast.error(errorMessage);
                  }

                  setShowNotifyModal(false);
                  setCustomMessage("");
                  setSelectedVendors([]);
                } catch (err) {
                  toast.error("Failed to send message");
                } finally {
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
          </div>
        </div>
      </CustomDialog>

      {/* Mark Vendor As Modal */}
      <CustomDialog
        isOpen={markVendorAsOpen}
        onClose={() => {
          if (!isChangingVendorStatus) {
            setMarkVendorAsOpen(false);
            setSelectedVendorForAction(null);
            setSelectedVendorStatusKey("");
            setVendorStatusReason("");
          }
        }}
        title="Mark Vendor As"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700">
            {selectedVendorForAction ? (
              <>
                Change status for vendor:{" "}
                <span className="font-medium">
                  {vendors.find((v) => v.vendorId === selectedVendorForAction)
                    ?.displayName ||
                    vendors.find((v) => v.vendorId === selectedVendorForAction)
                      ?.legalName ||
                    "Vendor"}
                </span>
              </>
            ) : (
              <>
                Change status for{" "}
                <span className="font-medium">
                  {selectedVendors.length} selected vendor
                  {selectedVendors.length !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status
            </label>
            <Select
              value={selectedVendorStatusKey}
              onValueChange={setSelectedVendorStatusKey}
              disabled={isChangingVendorStatus}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                {vendorStatusOptions.map((opt) => (
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
              value={vendorStatusReason}
              onChange={(e) => setVendorStatusReason(e.target.value)}
              placeholder="Enter reason for status change..."
              rows={3}
              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E86B35] resize-y"
              disabled={isChangingVendorStatus}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => {
                setMarkVendorAsOpen(false);
                setSelectedVendorForAction(null);
                setSelectedVendorStatusKey("");
                setVendorStatusReason("");
              }}
              disabled={isChangingVendorStatus}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#E86B35] hover:bg-[#d15d2c] text-white shadow-none"
              disabled={
                !selectedVendorStatusKey ||
                !vendorStatusReason.trim() ||
                isChangingVendorStatus
              }
              onClick={async () => {
                if (!selectedVendorStatusKey || !vendorStatusReason.trim())
                  return;

                setIsChangingVendorStatus(true);

                try {
                  const vendorIds = selectedVendorForAction
                    ? [selectedVendorForAction]
                    : [...selectedVendors];

                  if (!vendorIds.length) {
                    toast.error("No vendor selected");
                    return;
                  }

                  let successCount = 0;
                  let failCount = 0;

                  for (const vendorId of vendorIds) {
                    try {
                      const res = await authenticatedFetch(
                        `/admin/vendors/${vendorId}/status`,
                        {
                          method: "PATCH",
                          body: JSON.stringify({
                            statusKey: selectedVendorStatusKey,
                            reason: vendorStatusReason.trim(),
                          }),
                        },
                      );
                      const result = await parseApiResponse(res);
                      if (result?.success) {
                        successCount++;
                      } else {
                        failCount++;
                        const errorMessage =
                          result?.error ||
                          result?.message ||
                          "Failed to update status";
                        if (vendorIds.length === 1) {
                          toast.error(errorMessage);
                        }
                      }
                    } catch {
                      failCount++;
                    }
                  }

                  if (vendorIds.length > 1) {
                    if (failCount === 0) {
                      toast.success(
                        `Status updated for ${successCount} vendor${successCount > 1 ? "s" : ""}`,
                      );
                    } else {
                      toast.warning(
                        `Updated ${successCount}, failed for ${failCount} vendor${failCount > 1 ? "s" : ""}`,
                      );
                    }
                  } else if (successCount > 0) {
                    toast.success("Vendor status updated successfully");
                  }

                  setMarkVendorAsOpen(false);
                  setSelectedVendorForAction(null);
                  setSelectedVendorStatusKey("");
                  setVendorStatusReason("");
                  setSelectedVendors([]);
                  fetchVendors();
                } catch (err) {
                  toast.error("Failed to update vendor status");
                } finally {
                  setIsChangingVendorStatus(false);
                }
              }}
            >
              {isChangingVendorStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </div>
        </div>
      </CustomDialog>
      {/* Vendor Action Modal */}
      <CustomDialog
        isOpen={vendorActionModalOpen}
        onClose={() => {
          if (!isPerformingVendorAction) {
            setVendorActionModalOpen(false);
            setVendorActionReason("");
          }
        }}
        title={`${vendorActionType ? vendorActionType.charAt(0).toUpperCase() + vendorActionType.slice(1) : "Action"} Vendor`}
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700">
            {selectedVendorForAction ? (
              <>
                Are you sure you want to {vendorActionType} this vendor:{" "}
                <span className="font-medium">
                  {vendors.find((v) => v.vendorId === selectedVendorForAction)
                    ?.displayName ||
                    vendors.find((v) => v.vendorId === selectedVendorForAction)
                      ?.legalName ||
                    "Vendor"}
                </span>
                ?
              </>
            ) : (
              <>
                Are you sure you want to {vendorActionType}{" "}
                <span className="font-medium">
                  {selectedVendors.length} selected vendor
                  {selectedVendors.length !== 1 ? "s" : ""}
                </span>
                ?
              </>
            )}
          </p>

          {(vendorActionType === "suspend" ||
            vendorActionType === "deactivate") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={vendorActionReason}
                onChange={(e) => setVendorActionReason(e.target.value)}
                placeholder="Enter reason..."
                rows={3}
                className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E86B35] resize-y"
                disabled={isPerformingVendorAction}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => {
                setVendorActionModalOpen(false);
                setVendorActionReason("");
              }}
              disabled={isPerformingVendorAction}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#E86B35] hover:bg-[#d15d2c] text-white shadow-none"
              disabled={
                ((vendorActionType === "suspend" ||
                  vendorActionType === "deactivate") &&
                  !vendorActionReason.trim()) ||
                isPerformingVendorAction
              }
              onClick={executeVendorAction}
            >
              {isPerformingVendorAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </div>
      </CustomDialog>
    </div>
  );
}
