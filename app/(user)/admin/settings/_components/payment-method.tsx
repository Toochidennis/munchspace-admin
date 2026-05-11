"use client";

import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Provider {
  id: string;
  name: string;
  isAssigned: boolean;
}

interface PaymentMethodType {
  code: string;
  label: string;
  isActive: boolean;
  requiresProvider: boolean;
  assignedProvider: { id: string; name: string } | null;
  availableProviders: Provider[];
}

export function PaymentMethod() {
  const [methods, setMethods] = useState<PaymentMethodType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);

  const [localState, setLocalState] = useState<Record<string, { isActive: boolean; gatewayId: string }>>({});

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const res = await authenticatedFetch("/admin/settings/payment-methods");
      const result = await parseApiResponse(res);
      if (result?.success) {
        setMethods(result.data);
        const newLocalState: any = {};
        result.data.forEach((m: PaymentMethodType) => {
          newLocalState[m.code] = {
            isActive: m.isActive,
            gatewayId: m.assignedProvider?.id || (m.availableProviders.length > 0 ? m.availableProviders[0].id : "")
          };
        });
        setLocalState(newLocalState);
      }
    } catch (err) {
      toast.error("Failed to fetch payment methods");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (method: PaymentMethodType, isActive: boolean) => {
    setUpdatingCode(method.code);
    // Optimistic update
    setLocalState((prev) => ({ ...prev, [method.code]: { ...prev[method.code], isActive } }));
    try {
      const res = await authenticatedFetch(`/admin/settings/payment-methods/${method.code}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ isActive })
      });
      const result = await parseApiResponse(res);
      if (result?.success) {
        toast.success(`${method.label} ${isActive ? 'enabled' : 'disabled'}`);
        setMethods((prev) => prev.map(m => m.code === method.code ? { ...m, isActive } : m));
      } else {
        toast.error(result?.message || "Failed to toggle payment method");
        // Revert local state
        setLocalState((prev) => ({ ...prev, [method.code]: { ...prev[method.code], isActive: method.isActive } }));
      }
    } catch (err) {
      toast.error("An error occurred while toggling payment method");
      // Revert local state
      setLocalState((prev) => ({ ...prev, [method.code]: { ...prev[method.code], isActive: method.isActive } }));
    } finally {
      setUpdatingCode(null);
    }
  };

  const handleSave = async (method: PaymentMethodType) => {
    setUpdatingCode(method.code);
    try {
      const state = localState[method.code];
      const payload = {
        providerId: state.gatewayId
      };
      
      const res = await authenticatedFetch(`/admin/settings/payment-methods/${method.code}/provider`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      const result = await parseApiResponse(res);
      if (result?.success) {
        toast.success(`${method.label} provider updated`);
        setMethods((prev) => prev.map(m => m.code === method.code ? {
          ...m,
          assignedProvider: m.availableProviders.find(p => p.id === state.gatewayId) || null
        } : m));
      } else {
        toast.error(result?.message || "Failed to update provider");
      }
    } catch (err) {
      toast.error("Failed to update provider");
    } finally {
      setUpdatingCode(null);
    }
  };

  const hasChanges = (method: PaymentMethodType) => {
    const state = localState[method.code];
    if (!state) return false;
    if (method.requiresProvider) {
      const originalGateway = method.assignedProvider?.id || "";
      if (state.gatewayId !== originalGateway) return true;
    }
    return false;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#E86B35]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Payment Method Settings</h2>
        <p className="text-gray-500 text-sm mt-1 font-normal">
          Configure how customers pay for items on the platform.
        </p>
      </div>

      <div className="space-y-6">
        {methods.map((method) => {
          const state = localState[method.code];
          if (!state) return null;

          return (
            <div key={method.code} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div className={cn("px-6 py-5 flex items-center justify-between", method.requiresProvider && "border-b border-gray-100")}>
                <h3 className="text-[17px] font-semibold text-gray-900 flex items-center gap-2">
                  {method.label}
                  {!method.requiresProvider && updatingCode === method.code && (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  )}
                </h3>
                <Switch
                  checked={state.isActive}
                  disabled={updatingCode === method.code}
                  onCheckedChange={(val) => handleToggle(method, val)}
                  className="data-[state=checked]:bg-[#E86B35]"
                />
              </div>

              {method.requiresProvider && (
                <div className="px-6 py-5">
                  <div className="mb-4">
                    <h4 className="text-[14px] font-semibold text-gray-900">Payment Gateway</h4>
                    <p className="text-[13px] text-gray-500 font-normal">Select the provider that will process {method.label} payments:</p>
                  </div>
                  
                  {method.availableProviders.length > 0 ? (
                    <RadioGroup
                      value={state.gatewayId}
                      onValueChange={(val) => setLocalState((prev) => ({ ...prev, [method.code]: { ...prev[method.code], gatewayId: val } }))}
                      className="space-y-3"
                    >
                      {method.availableProviders.map((provider) => (
                        <div key={provider.id} className="flex items-center space-x-3">
                          <RadioGroupItem value={provider.id} id={`${method.code}-${provider.id}`} className="h-5 w-5 text-[#E86B35] border-gray-400 data-[state=checked]:border-[#E86B35]" />
                          <Label htmlFor={`${method.code}-${provider.id}`} className="text-[15px] font-normal text-gray-700 cursor-pointer">{provider.name}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No providers available.</p>
                  )}

                  <div className="mt-6 flex justify-end">
                    <Button 
                      disabled={!hasChanges(method) || updatingCode === method.code} 
                      onClick={() => handleSave(method)}
                      className="bg-gray-200 disabled:bg-gray-200 text-white disabled:text-gray-400 shadow-none font-normal px-6 transition-colors"
                      style={hasChanges(method) ? { backgroundColor: "#E86B35", color: "#FFF" } : undefined}
                    >
                      {updatingCode === method.code && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
