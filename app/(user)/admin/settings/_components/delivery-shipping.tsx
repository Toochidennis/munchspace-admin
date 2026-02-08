"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  X,
  Plus,
  Edit2,
  Loader2,
  Trash2,
  Check,
  ChevronsUpDown,
  ChevronsDown,
  ChevronDown,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT - Abuja",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

interface RadiusTier {
  id: string;
  from: string;
  to: string;
  fee: string;
}

interface DeliveryZone {
  id: string;
  state: string;
  method: "fixed" | "radius";
  fixedFee?: string;
  radiusTiers?: RadiusTier[];
  enabled: boolean;
}

export function DeliveryShipping() {
  const [deliveryZones, setDeliveryZones] = React.useState<DeliveryZone[]>([
    {
      id: "initial-1",
      state: "Lagos",
      method: "fixed",
      fixedFee: "2500",
      enabled: true,
    },
    {
      id: "initial-2",
      state: "Ogun",
      method: "radius",
      radiusTiers: [
        { id: "r1", from: "0", to: "30", fee: "3500" },
        { id: "r2", from: "40", to: "100", fee: "5500" },
        { id: "r3", from: "101", to: "500", fee: "8000" },
      ],
      enabled: true,
    },
  ]);

  const [showModal, setShowModal] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [openSearch, setOpenSearch] = React.useState(false);

  const [selectedState, setSelectedState] = React.useState("");
  const [deliveryMethod, setDeliveryMethod] = React.useState<
    "fixed" | "radius"
  >("fixed");
  const [fixedFee, setFixedFee] = React.useState("");
  const [radiusTiers, setRadiusTiers] = React.useState<RadiusTier[]>([
    { id: "1", from: "0", to: "10", fee: "" },
  ]);

  // Logic: Get states that are NOT currently in the list
  // If in Edit Mode, we include the state currently being edited
  const availableStates = NIGERIAN_STATES.filter((state) => {
    const isAlreadyUsed = deliveryZones.some((zone) => zone.state === state);
    if (isEditMode && editingId) {
      const currentEditingZone = deliveryZones.find((z) => z.id === editingId);
      return !isAlreadyUsed || state === currentEditingZone?.state;
    }
    return !isAlreadyUsed;
  });

  const resetForm = () => {
    setSelectedState("");
    setDeliveryMethod("fixed");
    setFixedFee("");
    setRadiusTiers([{ id: "1", from: "0", to: "10", fee: "" }]);
    setIsEditMode(false);
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (zone: DeliveryZone) => {
    setIsEditMode(true);
    setEditingId(zone.id);
    setSelectedState(zone.state);
    setDeliveryMethod(zone.method);
    if (zone.method === "fixed") {
      setFixedFee(zone.fixedFee || "");
    } else {
      setRadiusTiers(zone.radiusTiers || []);
    }
    setShowModal(true);
  };

  const addRadiusRow = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setRadiusTiers([...radiusTiers, { id: newId, from: "", to: "", fee: "" }]);
  };

  const removeRadiusRow = (id: string) => {
    if (radiusTiers.length > 1) {
      setRadiusTiers(radiusTiers.filter((tier) => tier.id !== id));
    }
  };

  const handleSubmit = async () => {
    if (!selectedState) {
      toast.error("Please select a state");
      return;
    }
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newZoneData: DeliveryZone = {
        id:
          isEditMode && editingId
            ? editingId
            : Math.random().toString(36).substr(2, 9),
        state: selectedState,
        method: deliveryMethod,
        fixedFee: deliveryMethod === "fixed" ? fixedFee : undefined,
        radiusTiers: deliveryMethod === "radius" ? radiusTiers : undefined,
        enabled: true,
      };

      if (isEditMode) {
        setDeliveryZones((prev) =>
          prev.map((zone) => (zone.id === editingId ? newZoneData : zone)),
        );
      } else {
        setDeliveryZones((prev) => [...prev, newZoneData]);
      }

      toast.success(
        isEditMode
          ? "Settings updated successfully"
          : "Delivery settings created successfully",
      );
      setShowModal(false);
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleZoneStatus = (id: string) => {
    setDeliveryZones((prev) =>
      prev.map((zone) =>
        zone.id === id ? { ...zone, enabled: !zone.enabled } : zone,
      ),
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative">
      <div className="flex items-start justify-between mt-5">
        <div className="px-0 pt-0">
          <h1 className="text-xl font-bold text-slate-900">
            Delivery & Shipping
          </h1>
          <p className="text-slate-500 mt-1">
            Configure delivery options, shipping fees, and zones to optimize
            logistics and customer satisfaction.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-[#E86B35] hover:bg-[#d45a2a] text-white gap-2 h-11 px-6 rounded-lg font-semibold"
        >
          <Plus size={18} /> New
        </Button>
      </div>

      <div className="space-y-6 mt-15">
        {deliveryZones.map((zone) => (
          <Card
            key={zone.id}
            className="p-6 border border-slate-200 shadow-none rounded-md"
          >
            <div className="flex items-center justify-between pb-4 border-b">
              <h3 className="text-lg font-semibold text-slate-900">
                {zone.state} state
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">
                  {zone.enabled ? "Enabled" : "Disabled"}
                </span>
                <Switch
                  checked={zone.enabled}
                  onCheckedChange={() => toggleZoneStatus(zone.id)}
                  className="data-[state=checked]:bg-[#E86B35]"
                />
              </div>
            </div>

            {zone.method === "fixed" ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  Shipping fee (Fixed price)
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex w-full max-w-[320px]">
                    <span className="inline-flex items-center px-4 rounded-l-md border border-r-0 border-slate-200 bg-gray-100 text-slate-500 text-sm">
                      NGN
                    </span>
                    <Input
                      value={zone.fixedFee}
                      readOnly
                      className="rounded-md rounded-l-none border-slate-200 focus-visible:ring-0 h-11 bg-gray-100"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleOpenEdit(zone)}
                    className="h-11 px-4 border-slate-200 text-slate-700 bg-white font-semibold gap-2 rounded-md"
                  >
                    Edit <Edit2 size={16} />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 border border-gray-200">
                      <tr>
                        <th className="px-6 py-4 font-medium border-slate-200 border-r">
                          From (KM)
                        </th>
                        <th className="px-6 py-4 font-medium border-slate-200 border-r">
                          To (KM)
                        </th>
                        <th className="px-6 py-4 font-medium">
                          Shipping Fee (NGN)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {zone.radiusTiers?.map((tier) => (
                        <tr
                          key={tier.id}
                          className="border-b border-slate-50 last:border-0 bg-white"
                        >
                          <td className="px-6 py-4 border-slate-200 border-r">
                            {tier.from}
                          </td>
                          <td className="px-6 py-4 border-slate-200 border-r">
                            {tier.to}
                          </td>
                          <td className="px-6 py-4">{tier.fee}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    variant="outline"
                    onClick={() => handleOpenEdit(zone)}
                    className="h-10 px-4 border-slate-200 text-slate-700 font-semibold gap-2"
                  >
                    Edit <Edit2 size={16} />
                  </Button>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isSaving && setShowModal(false)}
          />
          <div className="relative bg-white w-full max-w-[620px] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex bg-gray-100 items-center justify-between p-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                {isEditMode
                  ? "Edit delivery and shipping"
                  : "New delivery and shipping"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={23} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <Label className="text-[15px] font-semibold text-slate-900">
                  Delivery State <span className="text-red-500">*</span>
                </Label>
                <Popover open={openSearch} onOpenChange={setOpenSearch}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full h-12 justify-between border-slate-200 font-normal text-slate-600 hover:bg-white"
                    >
                      {selectedState
                        ? `${selectedState} state`
                        : "Select state"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search state..."
                        className="h-11"
                      />
                      <CommandList>
                        <CommandEmpty>
                          No state found or all states configured.
                        </CommandEmpty>
                        <CommandGroup>
                          {availableStates.map((state) => (
                            <CommandItem
                              key={state}
                              value={state}
                              onSelect={(val) => {
                                setSelectedState(val);
                                setOpenSearch(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedState === state
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {state} state
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-4">
                <Label className="text-[15px] font-semibold text-slate-900">
                  Delivery fee method
                </Label>
                <RadioGroup
                  value={deliveryMethod}
                  onValueChange={(val) =>
                    setDeliveryMethod(val as "fixed" | "radius")
                  }
                  className="space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem
                      value="fixed"
                      id="fixed"
                      className="h-5 w-5 text-munchprimary border-munchprimary data-[state=unchecked]:border-slate-300 focus:ring-0 focus:ring-offset-0"
                    />
                    <Label
                      htmlFor="fixed"
                      className="font-medium cursor-pointer transition-colors"
                    >
                      Fixed price
                    </Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <RadioGroupItem
                      value="radius"
                      id="radius"
                      className="h-5 w-5 text-munchprimary border-munchprimary data-[state=unchecked]:border-slate-300 focus:ring-0 focus:ring-offset-0"
                    />
                    <Label
                      htmlFor="radius"
                      className="font-medium cursor-pointer transition-colors"
                    >
                      Radius (km)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {deliveryMethod === "fixed" ? (
                <div className="space-y-2">
                  <Label className="text-[15px] font-semibold text-slate-900">
                    Shipping Fee
                  </Label>
                  <div className="flex w-full">
                    <span className="inline-flex items-center px-4 rounded-l-md border border-r-0 border-slate-200 bg-slate-50 text-slate-600 text-sm font-semibold">
                      NGN
                    </span>
                    <Input
                      value={fixedFee}
                      onChange={(e) => setFixedFee(e.target.value)}
                      placeholder="3,500"
                      className="rounded-l-none border-slate-200 h-12 focus-visible:ring-0"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-[1fr_1fr_1.5fr_40px] gap-4 items-end">
                    <Label className="text-xs font-semibold text-slate-500 uppercase">
                      From
                    </Label>
                    <Label className="text-xs font-semibold text-slate-500 uppercase">
                      To
                    </Label>
                    <Label className="text-xs font-semibold text-slate-500 uppercase">
                      Fee
                    </Label>
                    <div />
                  </div>
                  {radiusTiers.map((tier, index) => (
                    <div
                      key={tier.id}
                      className="grid grid-cols-[1fr_1fr_1.5fr_40px] gap-4 items-center"
                    >
                      <Input
                        value={tier.from}
                        onChange={(e) => {
                          const newTiers = [...radiusTiers];
                          newTiers[index].from = e.target.value;
                          setRadiusTiers(newTiers);
                        }}
                        placeholder="0"
                        className="h-12 border-slate-200"
                      />
                      <Input
                        value={tier.to}
                        onChange={(e) => {
                          const newTiers = [...radiusTiers];
                          newTiers[index].to = e.target.value;
                          setRadiusTiers(newTiers);
                        }}
                        placeholder="10"
                        className="h-12 border-slate-200"
                      />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                          N
                        </span>
                        <Input
                          value={tier.fee}
                          onChange={(e) => {
                            const newTiers = [...radiusTiers];
                            newTiers[index].fee = e.target.value;
                            setRadiusTiers(newTiers);
                          }}
                          placeholder="0.00"
                          className="h-12 pl-7 border-slate-200"
                        />
                      </div>
                      <button
                        onClick={() => removeRadiusRow(tier.id)}
                        className="text-slate-400 hover:text-red-500 disabled:opacity-30"
                        disabled={radiusTiers.length === 1}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addRadiusRow}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm font-bold w-fit"
                  >
                    Add another row
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end items-center gap-3 p-6 py-3 bg-gray-100 border-t border-slate-200 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="px-8 h-10 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 rounded-lg"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-10 h-10 bg-[#E86B35] hover:bg-[#d45a2a] text-white font-semibold rounded-md"
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isEditMode ? (
                  "Save"
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
