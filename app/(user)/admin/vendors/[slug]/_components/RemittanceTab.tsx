"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Camera,
  X,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// --- Custom Modal Component ---
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
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full bg-white shadow-xl overflow-hidden rounded-md animate-in zoom-in-95 duration-200",
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
        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Remittance Component ---
export default function RemittanceTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Table Data & Pagination State ---
  const [historyData, setHistoryData] = useState(() =>
    Array.from({ length: 45 }, (_, i) => ({
      id: i,
      amount: `N${(170500 - i * 1000).toLocaleString()}`,
      destination: "GT bank (0123456789)",
      receiptName: `document_${String(i + 1).padStart(3, "0")}.png`,
      receiptUrl: "#",
      date: "24th May, 2024",
      performedBy: i === 4 ? "Admin (Josh Lambe)" : "System",
    })),
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- Form State ---
  const [payoutAmount, setPayoutAmount] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Logic: Filtering & Pagination ---
  const filteredMembers = useMemo(() => {
    return historyData.filter((item) =>
      item.amount.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [historyData, searchQuery]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedData = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Modified logic: Show all if 5 or fewer, otherwise show range with ellipses
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
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
    }
    return pages;
  };

  // --- Logic: File Handling ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setErrors((prev) => ({ ...prev, receipt: "" }));
    }
  };

  const removeFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Logic: Submission ---
  const handleSave = () => {
    const newErrors: { [key: string]: string } = {};
    if (!payoutAmount) newErrors.amount = "Payout amount is required";
    if (!previewUrl) newErrors.receipt = "Please upload a receipt";
    if (!internalNote) newErrors.note = "Internal note is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newRecord = {
      id: Date.now(),
      amount: `N${Number(payoutAmount).toLocaleString()}`,
      destination: "GT bank (0123456789)",
      receiptName: "manual_payout.png",
      receiptUrl: previewUrl || "#",
      date: "7th Feb, 2026",
      performedBy: "Admin (Manual)",
    };

    setHistoryData([newRecord, ...historyData]);
    setIsModalOpen(false);
    resetForm();
    setCurrentPage(1); // Jump to page 1 to see the new record
  };

  const resetForm = () => {
    setPayoutAmount("");
    setInternalNote("");
    setPreviewUrl(null);
    setErrors({});
  };

  return (
    <div className="w-full space-y-6">
      {/* Metrics Section */}
      <Card className="grid grid-cols-1 md:grid-cols-4 border border-gray-100 shadow-none rounded-xl overflow-hidden bg-white">
        <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100">
          <p className="text-sm text-gray-500 mb-1 font-medium">Total Sales</p>
          <p className="text-xl font-bold text-gray-900">N 152,000</p>
        </div>
        <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100">
          <p className="text-sm text-gray-500 mb-1 font-medium">
            Number of Completed Order
          </p>
          <p className="text-xl font-bold text-gray-900">10,241</p>
        </div>
        <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100">
          <p className="text-sm text-gray-500 mb-1 font-medium">
            Total Amount Remitted
          </p>
          <p className="text-xl font-bold text-gray-900">N 120,000</p>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-1 font-medium">Next Payment</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-gray-900">N 32,000</p>
            <span className="text-[10px] bg-[#FFF8F1] text-[#E86B35] px-2 py-0.5 rounded-full border border-[#FFE7D6] font-medium">
              due in 4 days
            </span>
          </div>
        </div>
      </Card>

      {/* History Table */}
      <Card className="border border-gray-100 shadow-none rounded-xl bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">History</h2>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 border-gray-200 pr-10 focus-visible:ring-1 focus-visible:ring-gray-200"
              />
              <Search
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#E86B35] hover:bg-[#d15d2c] text-white h-10 px-6 rounded-lg font-medium"
            >
              Record Manual Payout
            </Button>
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-900">Amount</th>
              <th className="p-4 font-semibold text-gray-900">Destination</th>
              <th className="p-4 font-semibold text-gray-900">Receipt</th>
              <th className="p-4 font-semibold text-gray-900">Date</th>
              <th className="p-4 font-semibold text-gray-900">Performed By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/20">
                <td className="p-4 text-gray-900 font-medium">{item.amount}</td>
                <td className="p-4 text-gray-600">{item.destination}</td>
                <td className="p-4">
                  <a
                    href={item.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-500 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100/50"
                  >
                    <Paperclip size={14} />
                    <span className="text-xs font-medium underline">
                      {item.receiptName}
                    </span>
                  </a>
                </td>
                <td className="p-4 text-gray-600">{item.date}</td>
                <td className="p-4 text-gray-900 font-medium">
                  {item.performedBy}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Section */}
        <div className="flex items-center justify-center gap-6 text-sm border-t pt-6 mt-4">
          <p className="text-gray-500">
            Total{" "}
            <span className="text-gray-900 font-medium">
              {filteredMembers.length} items
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

      {/* Manual Payout Modal */}
      <CustomModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="Record Manual Payout"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="h-10 border-gray-200 text-gray-600 font-semibold rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="h-10 px-8 bg-[#E86B35] hover:bg-[#d15d2c] text-white font-semibold rounded-lg"
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-600 leading-relaxed">
            This action records a payout that was completed outside the system
            to{" "}
            <span className="font-bold text-gray-900">
              Sushi Place account.
            </span>{" "}
            No funds will be transferred.
          </p>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Payout Amount <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="0.00"
                value={payoutAmount}
                onChange={(e) => {
                  setPayoutAmount(e.target.value);
                  setErrors((prev) => ({ ...prev, amount: "" }));
                }}
                className={cn(
                  "h-11 border-gray-200",
                  errors.amount && "border-red-500",
                )}
              />
              {errors.amount && (
                <p className="text-xs text-red-500 font-medium">
                  {errors.amount}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Select Vendor's account <span className="text-red-500">*</span>
              </label>
              <Select defaultValue="gtbank">
                <SelectTrigger className="h-11! w-full border-gray-200">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gtbank">GT bank (0123456789)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Payout Receipt <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />

              {!previewUrl ? (
                <div
                  className={cn(
                    "border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center bg-[#FAFAFA]",
                    errors.receipt && "border-red-500",
                  )}
                >
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm border border-gray-50">
                    <Camera className="text-gray-400" size={24} />
                  </div>
                  <p className="text-sm text-gray-600">
                    <span
                      className="text-blue-500 font-bold underline cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Click here
                    </span>{" "}
                    to upload file
                  </p>
                  <p className="text-xs text-gray-400 mt-1 text-center max-w-[280px]">
                    Upload proof of payment.
                  </p>
                </div>
              ) : (
                <div className="relative border border-gray-200 rounded-xl p-2 bg-gray-50 flex flex-col items-center group">
                  <button
                    onClick={removeFile}
                    className="absolute top-2 right-2 p-1 bg-white border rounded-full text-red-500 shadow-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-[180px] rounded-lg object-contain"
                  />
                </div>
              )}
              {errors.receipt && (
                <p className="text-xs text-red-500 font-medium">
                  {errors.receipt}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Internal Note <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="For internal records."
                value={internalNote}
                onChange={(e) => {
                  setInternalNote(e.target.value);
                  setErrors((prev) => ({ ...prev, note: "" }));
                }}
                className={cn(
                  "min-h-[100px] border-gray-200 resize-none",
                  errors.note && "border-red-500",
                )}
              />
              {errors.note && (
                <p className="text-xs text-red-500 font-medium">
                  {errors.note}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="skip"
                className="rounded border-gray-300 data-[state=checked]:bg-[#E86B35] data-[state=checked]:border-[#E86B35]"
              />
              <label
                htmlFor="skip"
                className="text-sm text-gray-700 font-medium cursor-pointer"
              >
                Skip next automatic payout for this vendor.
              </label>
            </div>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
