"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Edit2,
  MinusCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PayoutAssignment {
  ownerId: string;
  ownerType: "BUSINESS" | "RIDER";
  schedule: "daily" | "weekly" | "monthly";
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  isLastDayOfMonth: boolean;
  nextRunAt: string;
  lastUpdated: string;
  commissionValue: number | null;
  commissionType: "percentage" | "flat" | null;
}

function CustomModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-[580px]",
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
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full bg-white shadow-2xl overflow-hidden rounded-xl animate-in zoom-in-95 duration-200",
          maxWidth,
        )}
      >
        <div className="flex border-b items-center justify-between px-6 py-4 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            className="text-slate-400 hover:text-slate-600 transition-colors"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-slate-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ServiceChargePayment() {
  const [activeSubTab, setActiveSubTab] = React.useState<"BUSINESS" | "RIDER">(
    "BUSINESS",
  );
  const [data, setData] = React.useState<PayoutAssignment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [totalItems, setTotalItems] = React.useState(0);

  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{
    ownerId: string;
    ownerType: string;
  } | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [formValues, setFormValues] = React.useState({
    commission: "",
    commissionType: "percentage" as "percentage" | "flat",
    schedule: "weekly" as "weekly" | "monthly",
    dayOfWeek: "1",
    dayOfMonth: "1",
    isLastDayOfMonth: false,
    notify: true,
    ownerId: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const fetchPayouts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authenticatedFetch(
        `/admin/settlement/payout-assignments?page=${currentPage}&limit=${itemsPerPage}&ownerType=${activeSubTab}`,
      );
      const result = await parseApiResponse(res);
      if (result?.success) {
        setData(result.data.data);
        setTotalItems(result.data.meta.total);
      }
    } catch (error) {
      toast.error("Failed to load payout assignments");
    } finally {
      setIsLoading(false);
    }
  }, [activeSubTab, currentPage, itemsPerPage]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await authenticatedFetch(
        `/admin/settlement/payout-assignments?ownerId=${deleteTarget.ownerId}&ownerType=${deleteTarget.ownerType}`,
        {
          method: "DELETE",
          body: JSON.stringify({}),
        },
      );
      const result = await parseApiResponse(res);
      if (result?.success) {
        toast.success("Payout assignment deleted successfully");
        setDeleteTarget(null);
        fetchPayouts();
      } else {
        toast.error(result?.message || "Failed to delete payout assignment");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!formValues.commission) {
      newErrors.commission = "Please enter a commission value";
    } else {
      const val = parseFloat(formValues.commission);
      if (formValues.commissionType === "percentage" && val > 100) {
        newErrors.commission = "Percentage cannot be more than 100";
      }
    }
    if (!formValues.ownerId) {
      newErrors.ownerId = `Please select ${activeSubTab === "BUSINESS" ? "a vendor" : "a rider"}`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      const body = {
        ownerType: activeSubTab,
        applyToAll: formValues.ownerId === "all",
        schedule: formValues.schedule,
        dayOfWeek:
          formValues.schedule === "weekly"
            ? parseInt(formValues.dayOfWeek)
            : null,
        dayOfMonth:
          formValues.schedule === "monthly" && !formValues.isLastDayOfMonth
            ? parseInt(formValues.dayOfMonth)
            : null,
        isLastDayOfMonth:
          formValues.schedule === "monthly" && formValues.isLastDayOfMonth,
        commission: parseFloat(formValues.commission),
        commissionType: formValues.commissionType,
        notify: formValues.notify,
      };

      const res = await authenticatedFetch(
        "/admin/settlement/payout-assignments",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
      const result = await parseApiResponse(res);
      console.log(result);
      if (result?.success) {
        toast.success("Payout assignment saved successfully");
        setIsEditModalOpen(false);
        fetchPayouts();
      } else {
        toast.error(result?.message || "Failed to save payout assignment");
      }
    } catch (error) {
      toast.error("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (item?: PayoutAssignment) => {
    if (item) {
      setFormValues({
        commission: item.commissionValue?.toString() || "",
        commissionType: item.commissionType || "percentage",
        schedule: item.schedule === "daily" ? "weekly" : item.schedule,
        dayOfWeek: item.dayOfWeek?.toString() || "1",
        dayOfMonth: item.dayOfMonth?.toString() || "1",
        isLastDayOfMonth: item.isLastDayOfMonth,
        notify: true,
        ownerId: item.ownerId || "",
      });
    } else {
      setFormValues({
        commission: "",
        commissionType: "percentage",
        schedule: "weekly",
        dayOfWeek: "1",
        dayOfMonth: "1",
        isLastDayOfMonth: false,
        notify: true,
        ownerId: "",
      });
    }
    setIsEditModalOpen(true);
    setErrors({});
  };

  React.useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const formatSchedule = (item: PayoutAssignment) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    if (item.schedule === "weekly" && item.dayOfWeek !== null) {
      return `Weekly - ${days[item.dayOfWeek]}`;
    }
    if (item.schedule === "monthly") {
      return item.isLastDayOfMonth
        ? "Monthly - Last Day"
        : `Monthly - Day ${item.dayOfMonth}`;
    }
    return item.schedule.charAt(0).toUpperCase() + item.schedule.slice(1);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const daysOfWeek = [
    { label: "Monday", value: "1" },
    { label: "Tuesday", value: "2" },
    { label: "Wednesday", value: "3" },
    { label: "Thursday", value: "4" },
    { label: "Friday", value: "5" },
    { label: "Saturday", value: "6" },
    { label: "Sunday", value: "0" },
  ];

  const daysOfMonth = Array.from({ length: 31 }, (_, i) => ({
    label: `Day ${i + 1}`,
    value: `${i + 1}`,
  }));

  return (
    <div className="mx-auto relative space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-900">
          Commission & Payout Management
        </h2>
        <p className="text-slate-500 text-[15px]">
          Set platform fees and control payout schedules for vendors and
          delivery agents
        </p>
      </div>

      <div className="flex gap-8 border-b border-slate-200">
        <button
          onClick={() => {
            setActiveSubTab("BUSINESS");
            setCurrentPage(1);
          }}
          className={cn(
            "pb-4 text-[15px] font-medium transition-all relative",
            activeSubTab === "BUSINESS"
              ? "text-munchprimary"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          Vendor
          {activeSubTab === "BUSINESS" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-munchprimary" />
          )}
        </button>
        <button
          onClick={() => {
            setActiveSubTab("RIDER");
            setCurrentPage(1);
          }}
          className={cn(
            "pb-4 text-[15px] font-medium transition-all relative",
            activeSubTab === "RIDER"
              ? "text-munchprimary"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          Delivery Agents
          {activeSubTab === "RIDER" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-munchprimary" />
          )}
        </button>
      </div>

      <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <div className="flex items-center justify-between p-6">
          <h3 className="text-lg font-bold text-slate-800">
            {activeSubTab === "BUSINESS"
              ? "Vendor Platform Commission"
              : "Delivery Agent Platform Commission"}
          </h3>
          <Button
            onClick={() => openEditModal()}
            className="bg-munchprimary hover:bg-munchprimaryDark text-white gap-2 h-11 px-6 rounded-lg font-bold transition-colors"
          >
            <Plus size={20} />
            Add New
          </Button>
        </div>

        <div className="overflow-x-auto min-h-[300px] relative border-t border-slate-100">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-munchprimary h-8 w-8" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="h-16 px-6 text-[13px] font-bold text-slate-900">
                    {activeSubTab === "BUSINESS" ? "Vendors" : "Riders"}
                  </TableHead>
                  <TableHead className="h-16 px-6 text-[13px] font-bold text-slate-900 border-l border-slate-100">
                    Type
                  </TableHead>
                  <TableHead className="h-16 px-6 text-[13px] font-bold text-slate-900 border-l border-slate-100">
                    Value
                  </TableHead>
                  <TableHead className="h-16 px-6 text-[13px] font-bold text-slate-900 border-l border-slate-100">
                    Payout Schedule
                  </TableHead>
                  <TableHead className="h-16 px-6 text-[13px] font-bold text-slate-900 border-l border-slate-100">
                    Last Updated
                  </TableHead>
                  <TableHead className="h-16 px-6 text-center border-l border-slate-100 text-slate-900 font-bold">
                    -
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length > 0 ? (
                  data.map((item) => (
                    <TableRow
                      key={item.ownerId}
                      className="hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0"
                    >
                      <TableCell className="py-6 px-6 text-[14px] text-slate-700 font-medium">
                        {activeSubTab === "BUSINESS"
                          ? "All Vendors"
                          : "All Riders"}
                      </TableCell>
                      <TableCell className="py-6 px-6 text-[14px] text-slate-600 border-l border-slate-100 capitalize">
                        {item.commissionType || "—"}
                      </TableCell>
                      <TableCell className="py-6 px-6 text-[14px] text-slate-600 border-l border-slate-100">
                        {item.commissionValue !== null
                          ? item.commissionType === "percentage"
                            ? `${item.commissionValue}%`
                            : `N ${item.commissionValue.toLocaleString()}`
                          : "—"}
                      </TableCell>
                      <TableCell className="py-6 px-6 text-[14px] text-slate-600 border-l border-slate-100">
                        {formatSchedule(item)}
                      </TableCell>
                      <TableCell className="py-6 px-6 text-[14px] text-slate-600 border-l border-slate-100">
                        {new Date(item.lastUpdated)
                          .toLocaleString("en-GB", {
                            weekday: "short",
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          .replace(",", "")}
                      </TableCell>
                      <TableCell className="py-6 px-6 border-l border-slate-100">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                ownerId: item.ownerId,
                                ownerType: item.ownerType,
                              })
                            }
                            className="p-2.5 rounded-lg border border-slate-200 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm"
                          >
                            <MinusCircle size={16} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-20 text-slate-400 font-medium"
                    >
                      No payout assignments found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 py-8 border-t border-slate-100 bg-white">
          <p className="text-slate-400 text-sm">
            Total{" "}
            <span className="text-slate-900 font-medium">
              {totalItems} items
            </span>
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              <ChevronLeft size={18} />
            </Button>

            <div className="flex items-center gap-1.5">
              {Array.from(
                { length: Math.min(totalPages, 5) },
                (_, i) => i + 1,
              ).map((page) => (
                <Button
                  key={page}
                  variant="ghost"
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "h-9 min-w-[36px] px-1 rounded text-sm font-bold transition-all",
                    currentPage === page
                      ? "border border-munchprimary text-munchprimary bg-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  {page}
                </Button>
              ))}
              {totalPages > 5 && (
                <span className="text-slate-400 px-1">...</span>
              )}
              {totalPages > 5 && (
                <Button
                  variant="ghost"
                  onClick={() => setCurrentPage(totalPages)}
                  className={cn(
                    "h-9 min-w-[36px] px-1 rounded text-sm font-bold",
                    currentPage === totalPages
                      ? "border border-munchprimary text-munchprimary bg-white shadow-sm"
                      : "text-slate-500",
                  )}
                >
                  {totalPages}
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((prev) => prev + 1)}
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
            <SelectTrigger className="w-[120px] h-10 bg-white border-slate-200 text-slate-600 text-xs font-bold focus:ring-0 rounded-lg shadow-sm">
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

      {/* EDIT/CREATE MODAL */}
      <CustomModal
        isOpen={isEditModalOpen}
        onClose={() => !isSaving && setIsEditModalOpen(false)}
        title={
          formValues.commission === ""
            ? `Update ${activeSubTab === "BUSINESS" ? "Vendor" : "Rider"} Platform Commission`
            : `Update ${activeSubTab === "BUSINESS" ? "Vendor" : "Rider"} Platform Commission`
        }
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="px-8 h-12 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 rounded-lg"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 h-12 bg-munchprimary hover:bg-munchprimaryDark text-white font-semibold rounded-lg min-w-[140px]"
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex gap-2">
            <button
              onClick={() =>
                setFormValues({ ...formValues, commissionType: "percentage" })
              }
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-bold transition-all border",
                formValues.commissionType === "percentage"
                  ? "bg-slate-900 text-white border-slate-900 shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
              )}
            >
              Percentage (%)
            </button>
            <button
              onClick={() =>
                setFormValues({ ...formValues, commissionType: "flat" })
              }
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-bold transition-all border",
                formValues.commissionType === "flat"
                  ? "bg-slate-900 text-white border-slate-900 shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
              )}
            >
              Flat fee (NGN)
            </button>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold">
              Value <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                {formValues.commissionType === "percentage" ? "" : "N"}
              </span>
              <Input
                type="number"
                value={formValues.commission}
                onChange={(e) =>
                  setFormValues({ ...formValues, commission: e.target.value })
                }
                placeholder={
                  formValues.commissionType === "percentage"
                    ? "e.g. 15"
                    : "e.g. 1200.00"
                }
                className={cn(
                  "h-12 bg-white border-slate-200 focus:ring-munchprimary rounded-lg text-base font-medium",
                  formValues.commissionType === "flat" ? "pl-8" : "pl-4",
                  errors.commission && "border-red-500 focus:ring-red-500",
                )}
              />
              {formValues.commissionType === "percentage" && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                  %
                </span>
              )}
            </div>
            {errors.commission && (
              <p className="text-red-500 text-xs font-medium">{errors.commission}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold">
              {activeSubTab === "BUSINESS" ? "Vendors" : "Riders"}{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={formValues.ownerId} 
              onValueChange={(val) => setFormValues({ ...formValues, ownerId: val })}
            >
              <SelectTrigger className={cn(
                "h-12 w-full border-slate-200 rounded-lg text-slate-500 bg-white",
                errors.ownerId && "border-red-500",
              )}>
                <SelectValue placeholder={`Select ${activeSubTab === "BUSINESS" ? "vendor" : "rider"}`} />
              </SelectTrigger>
              <SelectContent className="z-[110]">
                <SelectItem value="all">
                  All {activeSubTab === "BUSINESS" ? "Vendors" : "Riders"}
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.ownerId && (
              <p className="text-red-500 text-xs font-medium">{errors.ownerId}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="text-slate-700 font-semibold min-w-[120px]">
                Payout schedule
              </Label>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setFormValues({ ...formValues, schedule: "weekly" })
                }
                className={cn(
                  "px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
                  formValues.schedule === "weekly"
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100",
                )}
              >
                Weekly
              </button>
              <button
                onClick={() =>
                  setFormValues({ ...formValues, schedule: "monthly" })
                }
                className={cn(
                  "px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
                  formValues.schedule === "monthly"
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100",
                )}
              >
                Monthly
              </button>
            </div>

            <Select
              value={
                formValues.schedule === "weekly"
                  ? formValues.dayOfWeek
                  : formValues.isLastDayOfMonth
                  ? "last"
                  : formValues.dayOfMonth
              }
              onValueChange={(val) => {
                if (formValues.schedule === "weekly") {
                  setFormValues({ ...formValues, dayOfWeek: val });
                } else {
                  if (val === "last") {
                    setFormValues({
                      ...formValues,
                      isLastDayOfMonth: true,
                      dayOfMonth: "1",
                    });
                  } else {
                    setFormValues({
                      ...formValues,
                      isLastDayOfMonth: false,
                      dayOfMonth: val,
                    });
                  }
                }
              }}
            >
              <SelectTrigger className="h-12 w-full border-slate-200 rounded-lg text-slate-700 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[110]">
                {formValues.schedule === "weekly" ? (
                  daysOfWeek.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    {daysOfMonth.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="last">Last Day of Month</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <Checkbox
              id="notify"
              checked={formValues.notify}
              onCheckedChange={(checked) =>
                setFormValues({ ...formValues, notify: checked === true })
              }
              className="h-5 w-5 border-slate-300 data-[state=checked]:bg-munchprimary data-[state=checked]:border-munchprimary"
            />
            <Label
              htmlFor="notify"
              className="text-[15px] font-bold text-slate-700 cursor-pointer"
            >
              Notify the {activeSubTab === "BUSINESS" ? "vendors" : "riders"} via email about this update.
            </Label>
          </div>
        </div>
      </CustomModal>

      {/* DELETE CONFIRMATION MODAL */}
      <CustomModal
        isOpen={deleteTarget !== null}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        title="Confirm action"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="px-8 h-12 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 rounded-lg"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="px-8 h-12 bg-munchprimary hover:bg-munchprimaryDark text-white font-semibold rounded-lg min-w-[140px]"
            >
              {isDeleting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Yes, confirm"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-600 text-[16px]">
            Are you sure you want to update the{" "}
            <span className="font-semibold text-slate-900">
              {activeSubTab === "BUSINESS"
                ? "Vendor Platform Commission"
                : "Delivery Agent Platform Commission"}
            </span>?
          </p>
          <p className="text-slate-600 text-[16px]">
            This action will remove the payout assignment for this{" "}
            {activeSubTab === "BUSINESS" ? "vendor" : "rider"}.
          </p>
        </div>
      </CustomModal>
    </div>
  );
}
