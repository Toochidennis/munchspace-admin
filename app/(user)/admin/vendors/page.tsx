"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  Filter,
  RotateCcw,
  Calendar,
  MoreHorizontal,
  Flag,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Mail,
  Ban,
  UserCheck,
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// --- DATA ---
interface Vendor {
  id: string;
  name: string;
  regDate: string;
  itemsListed: number;
  status:
    | "APPROVED"
    | "PENDING VERIFICATION"
    | "REJECTED"
    | "FLAGGED"
    | "DEACTIVATED";
  flagged: boolean;
}

const VENDOR_DATA: Vendor[] = [
  {
    id: "1001",
    name: "Sabr collection",
    regDate: "Tue Nov 26 2024",
    itemsListed: 28,
    status: "APPROVED",
    flagged: false,
  },
  {
    id: "1002",
    name: "Amitex Store",
    regDate: "Tue Nov 26 2024",
    itemsListed: 15,
    status: "APPROVED",
    flagged: true,
  },
  {
    id: "2001",
    name: "Yolande Boutique",
    regDate: "Wed Dec 01 2024",
    itemsListed: 5,
    status: "PENDING VERIFICATION",
    flagged: false,
  },
  {
    id: "3001",
    name: "Rejected Store Alpha",
    regDate: "Mon Jan 05 2024",
    itemsListed: 0,
    status: "REJECTED",
    flagged: false,
  },
  {
    id: "4001",
    name: "Old Legacy Shop",
    regDate: "Sun Oct 10 2023",
    itemsListed: 0,
    status: "DEACTIVATED",
    flagged: false,
  },
  ...Array.from({ length: 40 }).map((_, i) => ({
    id: `50${i}`,
    name: `Vendor ${i + 5}`,
    regDate: "Thu Jan 01 2026",
    itemsListed: 10,
    status: "APPROVED" as const,
    flagged: false,
  })),
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
  const [activeTab, setActiveTab] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedVendors, setSelectedVendors] = React.useState<string[]>([]);
  const [showNotifyModal, setShowNotifyModal] = React.useState(false);
  const [notifyType, setNotifyType] = React.useState("order");

  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  // Filter Logic
  const searchFilteredResults = React.useMemo(() => {
    return VENDOR_DATA.filter((v) => {
      const query = searchQuery.toLowerCase();
      return (
        v.name.toLowerCase().includes(query) ||
        v.id.toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);

  const tabFilteredData = React.useMemo(() => {
    return searchFilteredResults.filter((v) => {
      if (activeTab === "all") return true;
      if (activeTab === "flagged") return v.flagged;
      const normalizedStatus = v.status.toLowerCase().replace(/\s/g, "");
      return normalizedStatus === activeTab.toLowerCase();
    });
  }, [searchFilteredResults, activeTab]);

  const counts = React.useMemo(
    () => ({
      all: searchFilteredResults.length,
      approved: searchFilteredResults.filter((v) => v.status === "APPROVED")
        .length,
      pendingverification: searchFilteredResults.filter(
        (v) => v.status === "PENDING VERIFICATION",
      ).length,
      rejected: searchFilteredResults.filter((v) => v.status === "REJECTED")
        .length,
      flagged: searchFilteredResults.filter((v) => v.flagged).length,
      deactivated: searchFilteredResults.filter(
        (v) => v.status === "DEACTIVATED",
      ).length,
    }),
    [searchFilteredResults],
  );

  const totalPages = Math.ceil(tabFilteredData.length / itemsPerPage);
  const paginatedData = tabFilteredData.slice(
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
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  return (
    <div className="block h-auto w-full bg-[#F8FAFC] overflow-auto">
      <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-6 pb-24">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Total ({counts.all})
          </h1>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400"
              onClick={() => toast("Refreshed")}
            >
              <RotateCcw size={20} />
            </Button>
            <Select defaultValue="30">
              <SelectTrigger className="w-[180px] h-10 bg-white border-gray-200 text-gray-600 font-medium">
                <Calendar size={16} className="mr-2 text-gray-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-none shadow-sm rounded-xl bg-white p-6 space-y-6 overflow-visible">
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
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-11 border-gray-200 text-gray-600 font-medium gap-2 px-5"
              >
                <Download size={18} /> Download
              </Button>
              <Button
                variant="outline"
                className="h-11 border-gray-200 text-gray-600 font-medium gap-2 px-5"
              >
                <Filter size={18} /> Filter
              </Button>
            </div>
          </div>

          <div className="border-b border-gray-100 overflow-x-auto scrollbar-hide">
            <div className="flex gap-8">
              {[
                { id: "all", label: `All ${counts.all}` },
                { id: "approved", label: `Approved ${counts.approved}` },
                {
                  id: "pendingverification",
                  label: `Pending Verification ${counts.pendingverification}`,
                },
                { id: "rejected", label: `Rejected ${counts.rejected}` },
                { id: "flagged", label: `Flagged ${counts.flagged}` },
                {
                  id: "deactivated",
                  label: `Deactivated ${counts.deactivated}`,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "pb-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap",
                    activeTab === tab.id
                      ? "border-[#E86B35] text-[#E86B35]"
                      : "border-transparent text-gray-400 hover:text-gray-600",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 py-1">
            <span className="text-sm font-semibold text-gray-900">
              Selected: {selectedVendors.length}
            </span>
            <Button
              disabled={selectedVendors.length === 0}
              variant="outline"
              className="h-9 border-gray-100 bg-gray-50 text-gray-400 font-semibold text-xs rounded-md"
            >
              Mark Vendor As...
            </Button>
            <Button
              disabled={selectedVendors.length === 0}
              variant="outline"
              className="h-9 border-gray-100 bg-gray-50 text-gray-400 font-semibold text-xs rounded-md"
              onClick={() => setShowNotifyModal(true)}
            >
              Notify Vendor...
            </Button>
            <Button
              disabled={selectedVendors.length === 0}
              variant="outline"
              className="h-9 border-gray-100 bg-gray-50 text-gray-400 font-semibold text-xs rounded-md"
            >
              Deactivate Vendor
            </Button>
          </div>

          <div className="border border-gray-100 rounded-lg overflow-x-auto bg-white">
            <table className="w-full text-sm text-left border-collapse min-w-[900px]">
              <thead className="bg-[#F8FAFC] text-gray-700 font-semibold border-b border-gray-100">
                <tr>
                  <th className="p-4 w-12">
                    <Checkbox
                      checked={
                        selectedVendors.length === paginatedData.length &&
                        paginatedData.length > 0
                      }
                      onCheckedChange={() => {
                        if (selectedVendors.length === paginatedData.length)
                          setSelectedVendors([]);
                        else setSelectedVendors(paginatedData.map((v) => v.id));
                      }}
                      className="border-gray-300 data-[state=checked]:bg-[#E86B35] data-[state=checked]:border-[#E86B35]"
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
                    Items Listed
                  </th>
                  <th className="p-4 text-[11px] uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="p-4 text-center w-10">-</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedData.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-4">
                      <Checkbox
                        checked={selectedVendors.includes(vendor.id)}
                        onCheckedChange={() =>
                          setSelectedVendors((prev) =>
                            prev.includes(vendor.id)
                              ? prev.filter((i) => i !== vendor.id)
                              : [...prev, vendor.id],
                          )
                        }
                        className="border-gray-300 data-[state=checked]:bg-[#E86B35] data-[state=checked]:border-[#E86B35]"
                      />
                    </td>
                    <td className="p-4 font-semibold text-gray-900">
                      #{vendor.id}
                    </td>
                    <td className="p-4 text-gray-600 font-medium">
                      {vendor.name}
                    </td>
                    <td className="p-4 text-gray-500">{vendor.regDate}</td>
                    <td className="p-4 text-gray-600 font-medium">
                      {vendor.itemsListed}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded text-[10px] font-bold uppercase",
                            vendor.status === "APPROVED" &&
                              "bg-green-100 text-green-600",
                            vendor.status === "PENDING VERIFICATION" &&
                              "bg-orange-100 text-orange-500",
                            vendor.status === "REJECTED" &&
                              "bg-red-100 text-red-600",
                            vendor.status === "DEACTIVATED" &&
                              "bg-gray-100 text-gray-500",
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
                          <DropdownMenuItem className="gap-3 py-2.5 font-medium text-xs text-gray-700 focus:bg-gray-50">
                            <UserCheck size={16} className="text-gray-400" />{" "}
                            Mark Vendor as...
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-3 py-2.5 font-medium text-xs text-gray-700 focus:bg-gray-50"
                            onClick={() => setShowNotifyModal(true)}
                          >
                            <Mail size={16} className="text-gray-400" /> Notify
                            Vendor...
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-3 py-2.5 font-medium text-xs text-red-500 border-t border-gray-50 mt-1 focus:bg-red-50">
                            <Ban size={16} /> Deactivate Vendor
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm border-t pt-6">
            <p className="text-gray-500">
              Total{" "}
              <span className="text-gray-900 font-medium">
                {tabFilteredData.length} items
              </span>
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded"
                disabled={currentPage === 1}
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
                      "h-8 w-8 rounded font-medium",
                      currentPage === page
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "text-gray-500",
                    )}
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
                disabled={currentPage === totalPages}
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
        </Card>
      </div>

      <CustomDialog
        isOpen={showNotifyModal}
        onClose={() => setShowNotifyModal(false)}
        title="Notify Vendor..."
      >
        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600">
            Send a <span className="font-bold text-gray-900">WhatsApp</span>{" "}
            notification to selected stores:
          </p>
          <div className="space-y-4">
            {[
              "Notify of New Order Alert",
              "Prepare Order #1002 for Pickup",
              "Inform About Order #1002 Cancellation",
              "Custom Message",
            ].map((opt) => (
              <div
                key={opt}
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setNotifyType(opt)}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    notifyType === opt ? "border-[#E86B35]" : "border-gray-300",
                  )}
                >
                  {notifyType === opt && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#E86B35]" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    notifyType === opt ? "text-gray-900" : "text-gray-500",
                  )}
                >
                  {opt}
                </span>
              </div>
            ))}
            {notifyType === "Custom Message" && (
              <Textarea
                placeholder="Type here..."
                className="min-h-[120px] border-gray-200 focus:border-[#E86B35] rounded-lg resize-none"
              />
            )}
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
            <Button
              variant="outline"
              onClick={() => setShowNotifyModal(false)}
              className="px-6 h-11 font-semibold text-gray-500 border-gray-200 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              className="px-6 h-11 font-semibold bg-[#E86B35] text-white hover:bg-[#d15d2c] rounded-lg"
              onClick={() => {
                toast.success("Message sent");
                setShowNotifyModal(false);
              }}
            >
              Send Message
            </Button>
          </div>
        </div>
      </CustomDialog>
    </div>
  );
}
