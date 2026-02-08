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
  Calendar,
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
import CustomerDetailsView from "./_components/CustomerDetailsView";

interface Customer {
  id: string;
  email: string;
  regDate: string;
  totalOrder: number;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

const initialData: Customer[] = [
  ...Array.from({ length: 22 }).map((_, i) => ({
    id: `#${1000 + i}`,
    email: `active_user_${i}@gmail.com`,
    regDate: "Fri Nov 29 2024 02:14:24",
    totalOrder: Math.floor(Math.random() * 5),
    status: "ACTIVE" as const,
  })),
  ...Array.from({ length: 4 }).map((_, i) => ({
    id: `#${2000 + i}`,
    email: `inactive_user_${i}@gmail.com`,
    regDate: "Wed Dec 04 2024 10:10:12",
    totalOrder: 0,
    status: "INACTIVE" as const,
  })),
  ...Array.from({ length: 3 }).map((_, i) => ({
    id: `#${3000 + i}`,
    email: `suspended_user_${i}@gmail.com`,
    regDate: "Mon Jan 12 2026 14:22:05",
    totalOrder: 2,
    status: "SUSPENDED" as const,
  })),
];

// --- Custom Dialog Component ---
const CustomDialog = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default function CustomersPage() {
  const [view, setView] = React.useState<"list" | "details">("list");
  const [selectedCustomer, setSelectedCustomer] =
    React.useState<Customer | null>(null);
  const [activeTab, setActiveTab] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCustomers, setSelectedCustomers] = React.useState<string[]>(
    [],
  );
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [showNotifyModal, setShowNotifyModal] = React.useState(false);
  const [showLogsModal, setShowLogsModal] = React.useState(false);
  const [customMsgChecked, setCustomMsgChecked] = React.useState(false);

  // --- API Simulation ---
  const simulateApiAction = (actionName: string) => {
    toast.promise(new Promise((res) => setTimeout(res, 1000)), {
      loading: `Processing ${actionName}...`,
      success: () => {
        setShowNotifyModal(false);
        return `${actionName} successful`;
      },
      error: "Error processing request",
    });
  };

  // --- Filter Logic ---
  const filteredMembers = React.useMemo(() => {
    return initialData.filter((c) => {
      const matchesTab =
        activeTab === "all" || c.status.toLowerCase() === activeTab;
      const matchesSearch =
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.includes(searchQuery);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  // Dynamic Tab Counts
  const counts = React.useMemo(
    () => ({
      all: initialData.length,
      active: initialData.filter((c) => c.status === "ACTIVE").length,
      inactive: initialData.filter((c) => c.status === "INACTIVE").length,
      suspended: initialData.filter((c) => c.status === "SUSPENDED").length,
    }),
    [],
  );

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const currentItems = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const toggleSelectAll = () => {
    if (selectedCustomers.length === currentItems.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(currentItems.map((c) => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
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

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#F8FAFC]">
      <div className="flex-1 overflow-y-auto p-6">
        {view === "details" && selectedCustomer ? (
          <CustomerDetailsView
            customer={selectedCustomer}
            onBack={() => setView("list")}
            onShowLogs={() => setShowLogsModal(true)}
          />
        ) : (
          <div className="max-w-[1600px] mx-auto space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-slate-900">
                Total ({filteredMembers.length})
              </h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-slate-400"
                  onClick={() => simulateApiAction("Refresh")}
                >
                  <RotateCcw size={18} />
                </Button>
                <Select defaultValue="7">
                  <SelectTrigger className="w-[160px] h-9 bg-white border-slate-200 text-sm font-semibold">
                    <Calendar size={14} className="mr-2 text-slate-400" />
                    <SelectValue placeholder="Last 7 days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
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
                      className="pl-9 h-10 border-slate-200 bg-slate-50/50"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="h-10 text-xs font-semibold border-slate-200 text-slate-600 gap-2"
                      onClick={() => simulateApiAction("Export")}
                    >
                      <Download size={14} /> Download
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 text-xs font-semibold border-slate-200 text-slate-600 gap-2"
                    >
                      <Filter size={14} /> Filter
                    </Button>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-transparent border-b border-slate-100 w-full justify-start h-auto p-0 gap-4 rounded-none">
                    <TabsTrigger value="all" className={tabTriggerClass}>
                      All {counts.all}
                    </TabsTrigger>
                    <TabsTrigger value="active" className={tabTriggerClass}>
                      Active {counts.active}
                    </TabsTrigger>
                    <TabsTrigger value="inactive" className={tabTriggerClass}>
                      Inactive {counts.inactive}
                    </TabsTrigger>
                    <TabsTrigger value="suspended" className={tabTriggerClass}>
                      Suspended {counts.suspended}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-900">
                    Selected: {selectedCustomers.length}
                  </span>
                  <Button
                    disabled={selectedCustomers.length === 0}
                    variant="outline"
                    className="h-9 text-xs bg-slate-50 border-slate-200 gap-2 text-slate-600"
                    onClick={() => setShowNotifyModal(true)}
                  >
                    <Mail size={14} /> Notify Customer...
                  </Button>
                  <Button
                    disabled={selectedCustomers.length === 0}
                    variant="outline"
                    className="h-9 text-xs bg-slate-50 border-slate-200 text-slate-600"
                    onClick={() => simulateApiAction("Bulk Suspension")}
                  >
                    Suspend Account
                  </Button>
                </div>

                {/* Main Table */}
                <div className="rounded-md border border-slate-100 overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider">
                      <tr>
                        <th className="p-4 w-10">
                          <Checkbox
                            checked={
                              selectedCustomers.length ===
                                currentItems.length && currentItems.length > 0
                            }
                            onCheckedChange={toggleSelectAll}
                            className="border-slate-300 data-[state=checked]:bg-[#E86B35] data-[state=checked]:border-[#E86B35]"
                          />
                        </th>
                        <th className="p-4">Customer ID</th>
                        <th className="p-4">Customer Email</th>
                        <th className="p-4">Reg. Date</th>
                        <th className="p-4 text-center">Total Order</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {currentItems.map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="p-4">
                            <Checkbox
                              checked={selectedCustomers.includes(c.id)}
                              onCheckedChange={() => toggleSelect(c.id)}
                              className="border-slate-300 data-[state=checked]:bg-[#E86B35] data-[state=checked]:border-[#E86B35]"
                            />
                          </td>
                          <td className="p-4 font-bold text-slate-900">
                            {c.id}
                          </td>
                          <td className="p-4 text-slate-600 font-medium">
                            {c.email}
                          </td>
                          <td className="p-4 text-slate-500">{c.regDate}</td>
                          <td className="p-4 text-center font-bold">
                            {c.totalOrder}
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                "font-bold px-2 py-0.5 rounded text-[10px] uppercase",
                                c.status === "ACTIVE"
                                  ? "bg-green-100 text-green-700"
                                  : c.status === "SUSPENDED"
                                    ? "bg-red-100 text-red-600"
                                    : "bg-gray-100 text-gray-600",
                              )}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-slate-100"
                                >
                                  <MoreHorizontal
                                    size={14}
                                    className="text-slate-400"
                                  />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48 p-1 rounded-lg shadow-xl"
                              >
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCustomer(c);
                                    setView("details");
                                  }}
                                  className="gap-2 text-xs py-2.5 font-semibold cursor-pointer"
                                >
                                  <Eye size={14} /> View Details
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
                                <DropdownMenuItem
                                  onClick={() =>
                                    simulateApiAction("Account Flagging")
                                  }
                                  className="gap-2 text-xs py-2.5 font-semibold text-red-600 border-t cursor-pointer"
                                >
                                  <AlertCircle size={14} /> Flag Customer's
                                  acct.
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
                <div className="flex items-center justify-center gap-6 text-sm border-t pt-6">
                  <p className="text-slate-500 font-medium">
                    Total{" "}
                    <span className="text-slate-900">
                      {filteredMembers.length} items
                    </span>
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
                              : "text-slate-500",
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
                    onValueChange={(v) => setItemsPerPage(Number(v))}
                  >
                    <SelectTrigger className="w-[110px] h-9 bg-slate-50 border-slate-200 text-xs font-bold">
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
        )}
      </div>

      {/* --- NOTIFY DIALOG (Shared Design) --- */}
      <CustomDialog
        isOpen={showNotifyModal}
        onClose={() => {
          setShowNotifyModal(false);
          setCustomMsgChecked(false);
        }}
        title="Notify Customer..."
      >
        <div className="p-6 space-y-6 bg-white">
          <p className="text-sm text-slate-600">
            Send a <span className="font-bold text-slate-900">Email</span>{" "}
            notification to{" "}
            <span className="font-bold text-slate-900">
              {selectedCustomer?.email ||
                `${selectedCustomers.length} selected customers`}
            </span>
            :
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 border border-slate-100 rounded-lg bg-slate-50/30">
              <Checkbox
                id="pop1"
                className="mt-0.5 data-[state=checked]:bg-[#E86B35] border-slate-300"
              />
              <label
                htmlFor="pop1"
                className="text-xs font-bold text-slate-700 cursor-pointer leading-tight"
              >
                Notify customer to clear their cart before items run out of
                stock
              </label>
            </div>
            <div className="flex items-start gap-3 p-4 border border-slate-100 rounded-lg bg-slate-50/30">
              <Checkbox
                id="pop2"
                checked={customMsgChecked}
                onCheckedChange={(v: boolean) => setCustomMsgChecked(v)}
                className="mt-0.5 data-[state=checked]:bg-[#E86B35] border-slate-300"
              />
              <label
                htmlFor="pop2"
                className="text-xs font-bold text-slate-700 cursor-pointer"
              >
                Custom Message
              </label>
            </div>

            {customMsgChecked && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <Textarea
                  placeholder="Type your message here..."
                  className="text-xs border-slate-200 min-h-[120px] focus-visible:ring-1 focus-visible:ring-[#E86B35] focus:border-[#E86B35] rounded-lg shadow-none"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowNotifyModal(false)}
              className="h-10 text-xs font-bold rounded-lg px-6 border-slate-200 text-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={() => simulateApiAction("Notification")}
              className="h-10 text-xs font-bold bg-[#E86B35] hover:bg-[#d15d2c] text-white rounded-lg px-6 shadow-lg shadow-orange-100/50"
            >
              Send Message
            </Button>
          </div>
        </div>
      </CustomDialog>

      {/* Activity Logs Modal */}
      <CustomDialog
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        title="Activity logs"
      >
        <div className="p-6 h-64 text-xs font-bold text-slate-400 flex items-center justify-center italic">
          No recent activity found for this user.
        </div>
      </CustomDialog>
    </div>
  );
}
