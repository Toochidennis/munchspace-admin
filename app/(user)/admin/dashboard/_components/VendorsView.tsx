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
  Flag,
  Ban,
  MessageSquare,
  Eye,
  UserCheck,
  Mail,
  X,
  ChevronDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
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
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  MOCK_VENDORS,
  vendorPerformanceData,
  topSellingData,
} from "../lib/dashboard-data";
import { getFilteredData, getPageNumbers } from "../lib/dashboard-utils";
import { StatCard } from "./StatCard";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const colorMap = {
  "green-500": "#22C55E",
  "blue-400": "#3B82F6",
  "yellow-500": "#EAB308",
  "pink-500": "#D946EF",
  "orange-500": "#F97316",
  "red-400": "#F87171",
};

export const VendorsView = () => {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // Added missing state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [topVendorsCount, setTopVendorsCount] = useState(6);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [notifyVendorOpen, setNotifyVendorOpen] = useState(false);
  const [selectedVendorForAction, setSelectedVendorForAction] = useState<
    string | null
  >(null);
  const [notificationOption, setNotificationOption] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  // ──────────────────────────────────────────────
  // Filtering logic
  // ──────────────────────────────────────────────
  const searchFiltered = useMemo(
    () => getFilteredData(MOCK_VENDORS, searchQuery),
    [searchQuery],
  );

  const statusFiltered = useMemo(() => {
    if (activeTab === "all") return searchFiltered;

    if (activeTab === "flagged") {
      return searchFiltered.filter((v) => v.flagged === true);
    }

    // Map tab id → actual status value
    const statusMap: Record<string, string> = {
      approved: "APPROVED",
      pending: "PENDING APPROVAL",
      rejected: "REJECTED",
    };

    const targetStatus = statusMap[activeTab];
    if (targetStatus) {
      return searchFiltered.filter((v) => v.status === targetStatus);
    }

    return searchFiltered;
  }, [searchFiltered, activeTab]);

  const counts = useMemo(
    () => ({
      all: searchFiltered.length,
      approved: searchFiltered.filter((v) => v.status === "APPROVED").length,
      pending: searchFiltered.filter((v) => v.status === "PENDING APPROVAL")
        .length,
      rejected: searchFiltered.filter((v) => v.status === "REJECTED").length,
      flagged: searchFiltered.filter((v) => v.flagged).length,
    }),
    [searchFiltered],
  );

  const totalPages = Math.ceil(statusFiltered.length / itemsPerPage);
  const paginated = statusFiltered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleDeactivate = (ids: string[]) => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1200)), {
      loading: `Deactivating ${ids.length} vendor${ids.length !== 1 ? "s" : ""}...`,
      success: "Vendor(s) deactivated successfully",
      error: "Failed to deactivate vendor",
    });
    setSelectedVendors((prev) => prev.filter((id) => !ids.includes(id)));
  };

  // Only pick the first 2 vendors from the mock data
  const top2Vendors = topSellingData.slice(0, 2);

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Vendors" value="150" trend="0.35%" />
        <StatCard title="Approved Vendors" value="98" trend="0.35%" />
        <StatCard
          title="Pending Approval"
          value="12"
          trend="0.35%"
          trendType="down"
        />
        <StatCard title="Rejected" value="44" trend="0.35%" trendType="down" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border shadow-none rounded-md p-0 gap-0 space-y-0">
          <div className="flex justify-between items-center px-9 uppercase border-b py-3">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold">Top Performing Vendors (TPV)</h1>
              <UITooltip>
                <TooltipTrigger>
                  <Info size={15} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="py-1.5">
                    Top performing vendors based on total sales <br /> in the
                    last 30 days. This chart helps identify <br /> which vendors
                    are driving the most revenue <br /> on the platform.
                  </p>
                </TooltipContent>
              </UITooltip>
            </div>
            <Select
              value={topVendorsCount.toString()}
              onValueChange={(v) => setTopVendorsCount(parseInt(v))}
            >
              <SelectTrigger className="w-24 text-xs rounded-md">
                <SelectValue placeholder="Top 6" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">Top 4</SelectItem>
                <SelectItem value="6">Top 6</SelectItem>
                <SelectItem value="8">Top 8</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardContent className="p-6 rounded-xl">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={vendorPerformanceData.slice(0, topVendorsCount)}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  dy={10}
                  // Shorten to 3 chars and make uppercase
                  tickFormatter={(value) => value.slice(0, 3).toUpperCase()}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  tickFormatter={(value) => `${value / 1000}K`}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value) => [
                    `NGN ${value!.toLocaleString()}`,
                    "Sales",
                  ]}
                />
                <Bar
                  dataKey="sales"
                  fill="#6FCF97"
                  radius={[15, 15, 0, 0]}
                  barSize={39}
                  // Adds the gray background track behind each bar
                  background={{ fill: "#edeef0", radius: [15, 15, 0, 0] }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-none rounded-md p-0 gap-0 overflow-hidden bg-white">
          <div className="flex justify-between items-center px-9 uppercase border-b py-4.5">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold">Top Selling Items (TSI)</h1>
              <UITooltip>
                <TooltipTrigger>
                  <Info size={15} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="py-1.5">
                    Top selling items across all vendors in the <br />
                    marketplace over the last 30 days. This <br /> chart helps
                    identify popular products <br /> and trends.
                  </p>
                </TooltipContent>
              </UITooltip>
            </div>
          </div>
          <CardContent className="p-6 py-3 space-y-6">
            {top2Vendors.map((vendor, vIdx) => {
              // 1. Sort and get top 4 (or fewer) items
              const topItems = [...vendor.items]
                .sort((a, b) => b.sold - a.sold)
                .slice(0, 4);

              // 2. Calculate sum of ONLY the top items (This becomes our 100%)
              const topItemsTotalSold = topItems.reduce(
                (acc, item) => acc + item.sold,
                0,
              );

              // 3. Calculate Vendor Percent: Top items vs Overall Store Sales
              const totalOverallSales = vendor.items.reduce(
                (acc, item) => acc + item.sold,
                0,
              );
              const vendorHeaderPercent = Math.round(
                (topItemsTotalSold / totalOverallSales) * 100,
              );

              return (
                <div key={vIdx} className="space-y-4">
                  {/* Vendor Title & Overall Performance % */}
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">
                      {vendor.vendor}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {vendorHeaderPercent}%
                    </span>
                  </div>

                  {/* Progress Bar - Guaranteed 100% full */}
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
                    {topItems.map((item, iIdx) => {
                      // Percentage of the bar relative to the top 4 ONLY
                      const segmentWidth =
                        (item.sold / topItemsTotalSold) * 100;

                      return (
                        <div
                          key={iIdx}
                          style={{
                            width: `${segmentWidth}%`,
                            backgroundColor: colorMap[item.color] || "#CBD5E1",
                          }}
                          className="h-full border-r border-white last:border-r-0"
                        />
                      );
                    })}
                  </div>

                  {/* Vertical Legend */}
                  <div className="flex flex-row flex-wrap gap-y-3 gap-x-5 pt-1">
                    {topItems.map((item, iIdx) => (
                      <div key={iIdx} className="flex items-center gap-3">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: colorMap[item.color] }}
                        />
                        <span className="text-sm text-gray-600">
                          {item.name}{" "}
                          <span className="font-normal">
                            ({item.sold} sold)
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="flex justify-center py-2 pt-0">
              <button className="text-blue-500 text-sm underline underline-offset-4">
                View all
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card - Vendors Table */}
      <Card className="border-none shadow-sm rounded-md overflow-hidden bg-white">
        <CardHeader className="border-b py-6 px-6 space-y-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Vendors ({statusFiltered.length})
            </CardTitle>
            <div className="flex gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search vendors..."
                  className="pl-10 h-10 border-gray-200"
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

          {/* Dynamic Tabs as Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={activeTab === "all" ? "default" : "secondary"}
              className="cursor-pointer px-3 py-1.5"
              onClick={() => setActiveTab("all")}
            >
              All {counts.all}
            </Badge>
            <Badge
              variant={activeTab === "approved" ? "default" : "secondary"}
              className="cursor-pointer px-3 py-1.5"
              onClick={() => setActiveTab("approved")}
            >
              Approved {counts.approved}
            </Badge>
            <Badge
              variant={activeTab === "pending" ? "default" : "secondary"}
              className="cursor-pointer px-3 py-1.5"
              onClick={() => setActiveTab("pending")}
            >
              Pending Approval {counts.pending}
            </Badge>
            <Badge
              variant={activeTab === "rejected" ? "default" : "secondary"}
              className="cursor-pointer px-3 py-1.5"
              onClick={() => setActiveTab("rejected")}
            >
              Rejected {counts.rejected}
            </Badge>
            <Badge
              variant={activeTab === "flagged" ? "default" : "secondary"}
              className="cursor-pointer px-3 py-1.5"
              onClick={() => setActiveTab("flagged")}
            >
              Flagged {counts.flagged}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Bulk Actions */}
          <div className="flex items-center gap-3 flex-wrap px-6 py-4 border-b bg-white">
            <span className="text-sm">
              Selected: <strong>{selectedVendors.length}</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedVendors.length}
            >
              Mark Vendor As...
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-400 border-gray-100"
              disabled={!selectedVendors.length}
              onClick={() => handleDeactivate(selectedVendors)}
            >
              Deactivate Vendor
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedVendors.length}
              onClick={() => setNotifyVendorOpen(true)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Notify Vendor...
            </Button>
          </div>

          {/* Table */}
          <div className="border border-gray-100 rounded-lg overflow-x-auto bg-white mx-6 mb-6">
            <table className="w-full text-sm text-left border-collapse min-w-[900px]">
              <thead className="bg-[#F8FAFC] text-gray-700 font-semibold border-b border-gray-100">
                <tr>
                  <th className="p-4 w-12">
                    <Checkbox
                      checked={
                        selectedVendors.length === paginated.length &&
                        paginated.length > 0
                      }
                      onCheckedChange={(checked) => {
                        setSelectedVendors(
                          checked ? paginated.map((v) => v.id) : [],
                        );
                      }}
                    />
                  </th>
                  <th className="p-4 text-[11px] uppercase tracking-wider text-gray-500">
                    Vendor ID
                  </th>
                  <th className="p-4 text-[11px] uppercase tracking-wider text-gray-500">
                    Vendor Name
                  </th>
                  <th className="p-4 text-[11px] uppercase tracking-wider text-gray-500">
                    Reg Date
                  </th>
                  <th className="p-4 text-[11px] uppercase tracking-wider text-gray-500">
                    Products Listed
                  </th>
                  <th className="p-4 text-[11px] uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="p-4 text-center w-10">-</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-4">
                      <Checkbox
                        checked={selectedVendors.includes(vendor.id)}
                        onCheckedChange={(c) =>
                          setSelectedVendors((prev) =>
                            c
                              ? [...prev, vendor.id]
                              : prev.filter((id) => id !== vendor.id),
                          )
                        }
                      />
                    </td>
                    <td className="p-4 font-semibold text-gray-900">
                      {vendor.id}
                    </td>
                    <td className="p-4 text-gray-600 font-medium">
                      {vendor.name}
                    </td>
                    <td className="p-4 text-gray-500">{vendor.regDate}</td>
                    <td className="p-4 text-gray-600 font-medium">
                      {vendor.products || vendor.itemsListed || "—"}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded text-[12px] uppercase text-white",
                            vendor.status === "APPROVED" && "bg-green-500",
                            vendor.status === "PENDING APPROVAL" &&
                              "bg-yellow-500",
                            vendor.status === "REJECTED" && "bg-red-500",
                            vendor.status === "DEACTIVATED" && "bg-gray-500",
                          )}
                        >
                          {vendor.status}
                        </span>
                        {vendor.flagged && (
                          <Flag
                            size={14}
                            className="text-red-500 fill-red-500"
                          />
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
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
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/vendors/${vendor.id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserCheck className="mr-2 h-4 w-4" /> Mark Vendor
                            as...
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedVendorForAction(vendor.id);
                              setNotifyVendorOpen(true);
                            }}
                          >
                            <Mail className="mr-2 h-4 w-4" /> Notify Vendor...
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeactivate([vendor.id])}
                          >
                            <Ban className="mr-2 h-4 w-4" /> Deactivate Vendor
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-6 text-sm border-t pt-6 pb-6 bg-white">
            <p className="text-gray-500">
              Total{" "}
              <span className="text-gray-900 font-medium">
                {statusFiltered.length} items
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
          <p className="text-sm text-gray-700">
            Send notification to:{" "}
            <span className="font-medium">
              {selectedVendorForAction
                ? MOCK_VENDORS.find((v) => v.id === selectedVendorForAction)
                    ?.name
                : "Selected vendors"}
            </span>
          </p>

          <div className="space-y-3">
            {[
              { id: "welcome", label: "Welcome / Account Activation" },
              { id: "performance", label: "Performance Update" },
              { id: "warning", label: "Policy / Warning Notice" },
              { id: "custom", label: "Custom Message" },
            ].map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name="notify-vendor"
                  checked={notificationOption === opt.id}
                  onChange={() => setNotificationOption(opt.id)}
                  className="h-4 w-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-800">{opt.label}</span>
              </label>
            ))}
          </div>

          {notificationOption === "custom" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}
        </div>
      </CustomModal>
    </div>
  );
};
