"use client";

import * as React from "react";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export function ServiceChargePayment() {
  // Current States
  const [commission, setCommission] = React.useState("8");
  const [payoutDay, setPayoutDay] = React.useState("Monday");
  const [payoutType, setPayoutType] = React.useState("Weekly");
  const [commissionType, setCommissionType] = React.useState("Percentage");

  // Original States (to track changes)
  const [originalValues, setOriginalValues] = React.useState({
    commission: "8",
    payoutDay: "Monday",
    payoutType: "Weekly",
    commissionType: "Percentage",
  });

  const [showConfirm, setShowConfirm] = React.useState(false);
  const [confirmType, setConfirmType] = React.useState<"commission" | "payout">(
    "commission",
  );
  const [notifyVendors, setNotifyVendors] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Check if sections have changed
  const hasCommissionChanged =
    commission !== originalValues.commission ||
    commissionType !== originalValues.commissionType;

  const hasPayoutChanged =
    payoutDay !== originalValues.payoutDay ||
    payoutType !== originalValues.payoutType;

  const handleSaveAttempt = (type: "commission" | "payout") => {
    if (type === "commission" && !commission.trim()) {
      setError("Commission value is required");
      return;
    }
    setError(null);
    setConfirmType(type); // Set which message to show
    setShowConfirm(true);
  };

  const handleConfirmUpdate = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setOriginalValues({
        commission,
        payoutDay,
        payoutType,
        commissionType,
      });

      toast.success("Settings updated successfully");
      setShowConfirm(false);
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto relative">
      <CardHeader className="px-0 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-medium">
            Service Charges & Payment
          </CardTitle>
          <CardDescription>
            Manage vendor's platform commissions and payment schedules
          </CardDescription>
        </div>
      </CardHeader>

      <div className="space-y-6 mt-6">
        {/* Vendor Platform Commission */}
        <Card className="p-6 border border-slate-200 shadow-none rounded-lg">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-1 max-w-md">
              <h3 className="text-lg font-bold text-slate-900">
                Vendor Platform Commission
              </h3>
              <p className="text-sm text-slate-500">
                Define the fee applied to every product listed by vendors as a
                percentage or flat rate.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="inline-flex w-fit gap-2 p-1 rounded-md">
                {["Percentage (%)", "Flat fee (NGN)"].map((type) => {
                  const currentType = type.startsWith("Percentage")
                    ? "Percentage"
                    : "Flat";
                  return (
                    <button
                      key={type}
                      onClick={() => setCommissionType(currentType)}
                      className={cn(
                        "px-4 py-1.5 text-xs font-semibold rounded h-8 transition-all",
                        commissionType === currentType
                          ? "bg-black text-white shadow-sm"
                          : "bg-gray-100 text-slate-600 hover:text-slate-900",
                      )}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>

              <div className="w-full space-y-1.5">
                <div className="flex items-center gap-3">
                  <Input
                    value={commission}
                    onChange={(e) => {
                      setCommission(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Enter value"
                    className={cn(
                      "h-11 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-gray-400 w-[280px]",
                      error
                        ? "border-red-500 bg-red-50/30"
                        : "border-slate-200",
                    )}
                  />
                  <Button
                    onClick={() => handleSaveAttempt("commission")}
                    disabled={!hasCommissionChanged}
                    className="h-11 px-6 bg-munchprimary hover:bg-munchprimaryDark text-white rounded font-medium disabled:bg-gray-400 disabled:text-white"
                  >
                    Save Changes
                  </Button>
                </div>
                {error && (
                  <p className="text-[13px] font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Vendor Payout Schedule */}
        <Card className="p-6 border border-slate-200 shadow-none rounded-lg">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-1 max-w-md">
              <h3 className="text-lg font-bold text-slate-900">
                Vendor Payout Schedule
              </h3>
              <p className="text-sm text-slate-500">
                Set the frequency and criteria for releasing payments to vendors
                for their earnings.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="inline-flex w-fit gap-2 p-1 rounded-md">
                {["Weekly", "Monthly"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setPayoutType(type)}
                    className={cn(
                      "px-4 py-1.5 text-xs font-semibold rounded h-8 transition-all",
                      payoutType === type
                        ? "bg-black text-white shadow-sm"
                        : "bg-gray-100 text-slate-600 hover:text-slate-900",
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 w-full">
                <Select value={payoutDay} onValueChange={setPayoutDay}>
                  <SelectTrigger className="w-full md:w-[280px] h-11 focus:ring-0 focus:ring-offset-0 focus:border-gray-400">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monday">Monday</SelectItem>
                    <SelectItem value="Tuesday">Tuesday</SelectItem>
                    <SelectItem value="Wednesday">Wednesday</SelectItem>
                    <SelectItem value="Thursday">Thursday</SelectItem>
                    <SelectItem value="Friday">Friday</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => handleSaveAttempt("payout")}
                  disabled={!hasPayoutChanged}
                  className="h-11 px-6 bg-munchprimary hover:bg-munchprimaryDark text-white rounded font-medium disabled:bg-gray-400 disabled:text-white"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* CUSTOM DIALOG COMPONENT */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isSaving && setShowConfirm(false)}
          />

          <div className="relative bg-white w-full max-w-[620px] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex bg-gray-100 items-center justify-between p-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                Confirm action
              </h2>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                disabled={isSaving}
              >
                <X size={23} />
              </button>
            </div>

            <div className="p-8 space-y-5">
              <div className="space-y-4">
                <p className="text-slate-600 text-[16px]">
                  Are you sure you want to update the{" "}
                  <span className="font-semibold text-slate-900">
                    {confirmType === "commission"
                      ? "Vendor Platform Commission"
                      : "Vendor Payout Schedule"}
                  </span>
                  {confirmType === "commission" ? " fee?" : "?"}
                </p>
                <p className="text-slate-600 text-[16px]">
                  {confirmType === "commission"
                    ? "This action will be applied on all and new product listing."
                    : "This update will change the frequency of payouts for all vendors."}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Checkbox
                  id="notify-modal"
                  checked={notifyVendors}
                  onCheckedChange={(checked) => setNotifyVendors(!!checked)}
                  className="h-5 w-5 border-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <label
                  htmlFor="notify-modal"
                  className="text-[15px] font-semibold text-slate-900 cursor-pointer select-none"
                >
                  Notify the vendors via email about this update.
                </label>
              </div>
            </div>

            <div className="flex justify-end items-center gap-3 p-6 pt-0 bg-gray-100 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="px-8 h-12 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 rounded-lg"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmUpdate}
                disabled={isSaving}
                className="px-8 h-12 bg-[#E86B35] hover:bg-[#d45a2a] text-white font-semibold rounded-lg min-w-[140px]"
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Yes, confirm"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
