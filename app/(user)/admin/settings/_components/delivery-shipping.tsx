"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Edit2, Loader2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";

interface DeliveryZone {
  state: {
    id: string;
    name: string;
  };
  baseFee: number;
  feePerKm: number;
  minFee: number;
  maxFee: number;
  isActive: boolean;
}

export function DeliveryShipping() {
  const [deliveryZones, setDeliveryZones] = React.useState<DeliveryZone[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<"new" | "edit">("new");
  const [isSaving, setIsSaving] = React.useState(false);
  const [availableStates, setAvailableStates] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [formData, setFormData] = React.useState({
    stateId: "",
    baseFee: "0",
    feePerKm: "0",
    minFee: "0",
    maxFee: "0",
  });

  const fetchStates = async () => {
    try {
      const res = await authenticatedFetch(
        "/meta/states?countryId=cmoih7g69004g01lies7ayxfd",
      );
      const result = await parseApiResponse(res);
      if (result?.success) {
        setAvailableStates(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch states:", error);
    }
  };

  const fetchDeliverySettings = async () => {
    setIsLoading(true);
    try {
      const res = await authenticatedFetch("/admin/settings/delivery");
      const result = await parseApiResponse(res);

      if (result?.success) {
        // Handling the nested result.data.data structure
        const zones = Array.isArray(result.data?.data) ? result.data.data : [];
        setDeliveryZones(zones);
      } else {
        toast.error(result?.message || "Failed to fetch delivery settings");
      }
    } catch (error) {
      toast.error("An error occurred while fetching delivery settings");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDeliverySettings();
    fetchStates();
  }, []);

  const handleOpenModal = (zone?: DeliveryZone) => {
    if (zone) {
      setModalMode("edit");
      setFormData({
        stateId: zone.state.id,
        baseFee: zone.baseFee.toString(),
        feePerKm: zone.feePerKm.toString(),
        minFee: zone.minFee.toString(),
        maxFee: zone.maxFee.toString(),
      });
    } else {
      setModalMode("new");
      setFormData({
        stateId: "",
        baseFee: "0",
        feePerKm: "0",
        minFee: "0",
        maxFee: "0",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.stateId) {
      toast.error("Please select a state");
      return;
    }

    setIsSaving(true);
    try {
      const method = modalMode === "new" ? "POST" : "POST";
      const url =
        modalMode === "new"
          ? "/admin/settings/delivery"
          : `/admin/settings/delivery/${formData.stateId}`;

      const res = await authenticatedFetch(url, {
        method,
        body: JSON.stringify({
          stateId: formData.stateId,
          baseFee: parseFloat(formData.baseFee),
          feePerKm: parseFloat(formData.feePerKm),
          minFee: parseFloat(formData.minFee),
          maxFee: parseFloat(formData.maxFee),
        }),
      });

      const result = await parseApiResponse(res);
      console.log(result)
      if (result?.success) {
        toast.success(
          `Delivery settings ${modalMode === "new" ? "created" : "updated"} successfully`,
        );
        setIsModalOpen(false);
        fetchDeliverySettings();
      } else {
        toast.error(result?.message || "Failed to save settings");
      }
    } catch (error) {
      toast.error("An error occurred while saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (stateId: string, currentStatus: boolean) => {
    setDeliveryZones((prev) =>
      prev.map((zone) =>
        zone.state.id === stateId
          ? { ...zone, isActive: !currentStatus }
          : zone,
      ),
    );

    try {
      const res = await authenticatedFetch(
        `/admin/settings/delivery/${stateId}/toggle`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive: !currentStatus }),
        },
      );
      const result = await parseApiResponse(res);
      if (!result?.success) {
        setDeliveryZones((prev) =>
          prev.map((zone) =>
            zone.state.id === stateId
              ? { ...zone, isActive: currentStatus }
              : zone,
          ),
        );
        toast.error(result?.message || "Failed to update status");
      }
    } catch (error) {
      setDeliveryZones((prev) =>
        prev.map((zone) =>
          zone.state.id === stateId
            ? { ...zone, isActive: currentStatus }
            : zone,
        ),
      );
      toast.error("An error occurred while updating status");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    })
      .format(value)
      .replace("NGN", "₦");
  };

  const calculatePreview = (
    base: number,
    perKm: number,
    min: number,
    max: number,
    distance: number,
  ) => {
    let cost = base + perKm * distance;
    if (cost < min) cost = min;
    if (cost > max) cost = max;
    return cost;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Delivery & Shipping
          </CardTitle>
          <CardDescription className="text-gray-500 mt-2 max-w-xl">
            Configure delivery options, shipping fees, and zones to optimize
            logistics and customer satisfaction.
          </CardDescription>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-[#E86B35] hover:bg-[#d15d2c] text-white px-6 h-11 rounded-md font-bold gap-2"
        >
          <Plus size={20} /> New
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#E86B35]" />
        </div>
      ) : (
        <div className="space-y-6">
          {Array.isArray(deliveryZones) &&
            deliveryZones.map((zone) => (
              <div
                key={zone.state.id}
                className="border border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white"
              >
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    {zone.state.name}
                  </h3>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={zone.isActive}
                      onCheckedChange={() =>
                        handleToggle(zone.state.id, zone.isActive)
                      }
                      className="data-[state=checked]:bg-[#E86B35]"
                    />
                    <span className="text-sm font-medium text-gray-500">
                      Enabled
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="border border-gray-100 rounded-lg overflow-hidden bg-gray-50/30">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-gray-100">
                          <TableHead className="font-bold text-gray-900 h-14 px-6 bg-gray-50/50">
                            Base Fee
                          </TableHead>
                          <TableHead className="font-bold text-gray-900 h-14 px-6 bg-gray-50/50 border-l border-gray-100">
                            Fee per KM
                          </TableHead>
                          <TableHead className="font-bold text-gray-900 h-14 px-6 bg-gray-50/50 border-l border-gray-100">
                            Minimum Fee
                          </TableHead>
                          <TableHead className="font-bold text-gray-900 h-14 px-6 bg-gray-50/50 border-l border-gray-100">
                            Maximum Fee
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="hover:bg-transparent border-none">
                          <TableCell className="h-16 px-6 text-[15px] font-medium text-gray-700 bg-white">
                            {formatCurrency(zone.baseFee)}
                          </TableCell>
                          <TableCell className="h-16 px-6 text-[15px] font-medium text-gray-700 bg-white border-l border-gray-100">
                            {formatCurrency(zone.feePerKm)}
                          </TableCell>
                          <TableCell className="h-16 px-6 text-[15px] font-medium text-gray-700 bg-white border-l border-gray-100">
                            {formatCurrency(zone.minFee)}
                          </TableCell>
                          <TableCell className="h-16 px-6 text-[15px] font-medium text-gray-700 bg-white border-l border-gray-100">
                            {formatCurrency(zone.maxFee)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-6 space-y-3">
                    <h4 className="text-[14px] font-medium text-gray-400">
                      Estimated Delivery Cost (Preview):
                    </h4>
                    <div className="space-y-2 text-[14px] font-bold text-gray-900">
                      <p>
                        2 km <span className="mx-2 text-gray-400">→</span>{" "}
                        {formatCurrency(
                          calculatePreview(
                            zone.baseFee,
                            zone.feePerKm,
                            zone.minFee,
                            zone.maxFee,
                            2,
                          ),
                        )}
                      </p>
                      <p>
                        5 km <span className="mx-2 text-gray-400">→</span>{" "}
                        {formatCurrency(
                          calculatePreview(
                            zone.baseFee,
                            zone.feePerKm,
                            zone.minFee,
                            zone.maxFee,
                            5,
                          ),
                        )}
                      </p>
                      <p>
                        10 km <span className="mx-2 text-gray-400">→</span>{" "}
                        {formatCurrency(
                          calculatePreview(
                            zone.baseFee,
                            zone.feePerKm,
                            zone.minFee,
                            zone.maxFee,
                            10,
                          ),
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <Button
                      onClick={() => handleOpenModal(zone)}
                      variant="outline"
                      className="h-10 border-gray-200 text-gray-600 font-bold gap-2 px-5 rounded-md hover:bg-gray-50"
                    >
                      Edit <Edit2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      <CustomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalMode === "new"
            ? "Add delivery and shipping"
            : "Edit delivery and shipping"
        }
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="px-8 h-11 border-gray-200 text-gray-600 font-bold rounded-md hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 h-11 bg-[#E86B35] hover:bg-[#d15d2c] text-white font-bold rounded-md min-w-[100px]"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save"}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-500">
              Delivery State <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.stateId}
              onValueChange={(val) =>
                setFormData((prev) => ({ ...prev, stateId: val }))
              }
              disabled={modalMode === "edit"}
            >
              <SelectTrigger className="h-12 border-gray-200 focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {availableStates.map((state) => (
                  <SelectItem key={state.id} value={state.id}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-400 whitespace-nowrap">
                Delivery Pricing
              </span>
              <div className="h-px bg-gray-100 w-full" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500">
                  Base Fee <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 font-medium">
                    ₦
                  </span>
                  <Input
                    type="number"
                    value={formData.baseFee}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        baseFee: e.target.value,
                      }))
                    }
                    className="pl-8 h-12 border-gray-200 focus-visible:ring-0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500">
                  Fee per km <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 font-medium">
                    ₦
                  </span>
                  <Input
                    type="number"
                    value={formData.feePerKm}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        feePerKm: e.target.value,
                      }))
                    }
                    className="pl-8 h-12 border-gray-200 focus-visible:ring-0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500">
                  Minimum fee <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 font-medium">
                    ₦
                  </span>
                  <Input
                    type="number"
                    value={formData.minFee}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        minFee: e.target.value,
                      }))
                    }
                    className="pl-8 h-12 border-gray-200 focus-visible:ring-0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500">
                  Maximum fee <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 font-medium">
                    ₦
                  </span>
                  <Input
                    type="number"
                    value={formData.maxFee}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxFee: e.target.value,
                      }))
                    }
                    className="pl-8 h-12 border-gray-200 focus-visible:ring-0"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50/50 rounded-lg space-y-3">
            <h4 className="text-[14px] font-medium text-gray-400">
              Estimated Delivery Cost (Preview):
            </h4>
            <div className="space-y-2 text-[14px] font-bold text-gray-900">
              <p>
                2 km <span className="mx-2 text-gray-400">→</span>{" "}
                {formatCurrency(
                  calculatePreview(
                    parseFloat(formData.baseFee || "0"),
                    parseFloat(formData.feePerKm || "0"),
                    parseFloat(formData.minFee || "0"),
                    parseFloat(formData.maxFee || "0"),
                    2,
                  ),
                )}
              </p>
              <p>
                5 km <span className="mx-2 text-gray-400">→</span>{" "}
                {formatCurrency(
                  calculatePreview(
                    parseFloat(formData.baseFee || "0"),
                    parseFloat(formData.feePerKm || "0"),
                    parseFloat(formData.minFee || "0"),
                    parseFloat(formData.maxFee || "0"),
                    5,
                  ),
                )}
              </p>
              <p>
                10 km <span className="mx-2 text-gray-400">→</span>{" "}
                {formatCurrency(
                  calculatePreview(
                    parseFloat(formData.baseFee || "0"),
                    parseFloat(formData.feePerKm || "0"),
                    parseFloat(formData.minFee || "0"),
                    parseFloat(formData.maxFee || "0"),
                    10,
                  ),
                )}
              </p>
            </div>
          </div>
        </div>
      </CustomModal>
    </div>
  );
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
          "relative w-full bg-white shadow-xl overflow-hidden rounded-xl animate-in zoom-in-95 duration-200",
          maxWidth,
        )}
      >
        <div className="flex border-b items-center justify-between px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
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
