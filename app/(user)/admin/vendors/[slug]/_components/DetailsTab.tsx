"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const DAYS_OF_WEEK = [
  { name: "Sunday", id: 0 },
  { name: "Monday", id: 1 },
  { name: "Tuesday", id: 2 },
  { name: "Wednesday", id: 3 },
  { name: "Thursday", id: 4 },
  { name: "Friday", id: 5 },
  { name: "Saturday", id: 6 },
];

export default function DetailsTab({ data }: { data?: any }) {
  if (!data) return null;

  const { vendor, businessInfo, payoutAccount, workingHours } = data;

  const formatTimeStr = (isoString: string) => {
    if (!isoString) return "00:00 AM";
    try {
      // In JS, date objects created from '1970-01-01T08:00:00.000Z' will be parsed in local time.
      // Alternatively, we can use date-fns or slice
      return format(new Date(isoString), "h:mm a");
    } catch {
      return "Invalid Time";
    }
  };

  const storeInfoFields = [
    { label: "Store Name", value: businessInfo?.legalName || "N/A" },
    { label: "Store Display Name", value: businessInfo?.displayName || "N/A" },
    { label: "Email", value: businessInfo?.email || "N/A" },
    { label: "Phone", value: businessInfo?.phone || "N/A" },
    { 
      label: "Established Date", 
      value: businessInfo?.establishedAt 
        ? format(new Date(businessInfo.establishedAt), "dd MMM, yyyy") 
        : "N/A" 
    },
    {
      label: "Store Address",
      value: businessInfo?.contact 
        ? [
            businessInfo.contact.addressLine1,
            businessInfo.contact.city,
            businessInfo.contact.state,
            businessInfo.contact.country
          ].filter(Boolean).join(", ")
        : "N/A",
    },
    { label: "Business Status", value: businessInfo?.status?.state || "N/A" },
    { label: "Restaurant Type", value: businessInfo?.businessType || "N/A" },
    { 
      label: "Service Options", 
      value: businessInfo?.serviceOperations?.length 
        ? businessInfo.serviceOperations.map((s: any) => s.name).join(", ") 
        : "N/A" 
    },
    { label: "Website", value: businessInfo?.onlinePresence?.website || "N/A" },
    { label: "Store ID", value: businessInfo?.id || "N/A" },
  ];

  return (
    <div className="space-y-6">
      {/* Store Information Card */}
      <Card className="p-4 border shadow-none rounded-xl bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Store Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-10 gap-x-12">
          {storeInfoFields.map((item, i) => (
            <div key={i}>
              <p className="text-[11px] tracking-wider text-gray-400 font-normal mb-2 uppercase">
                {item.label}
              </p>
              <p className="text-sm font-normal text-gray-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Bank Account */}
      <Card className="p-4 border shadow-none rounded-xl bg-white flex justify-between">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 bg-[#E86B35] rounded-lg flex items-center justify-center text-white font-normal text-[10px] leading-tight text-center px-2 min-w-[52px]">
            {payoutAccount?.bankName ? payoutAccount.bankName.substring(0, 8).toUpperCase() : "BANK"}
          </div>
          <div>
            <p className="text-sm font-normal text-gray-900 mb-1">
              {payoutAccount?.accountName || "N/A"}
            </p>
            <p className="text-xs text-gray-500 font-medium">
              {payoutAccount?.accountNumber || "N/A"} ({payoutAccount?.bankName || "Unknown Bank"})
            </p>
          </div>
        </div>
      </Card>

      {/* Working Hours - READ ONLY ADMIN VIEW */}
      <Card className="md:p-4 p-4 border shadow-none rounded-xl bg-white">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="working-hours" className="border-none">
            <AccordionTrigger className="text-lg font-normal text-gray-900 hover:no-underline p-0">
              Working Hours
            </AccordionTrigger>
            <AccordionContent className="pt-8 pb-0">
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => {
                  // Find the matching working hour config, fallback to disabled
                  const data = workingHours?.find((wh: any) => wh.dayOfWeek === day.id) || null;
                  const isEnabled = !!data;

                  return (
                    <div
                      key={day.name}
                      className="flex items-center justify-between rounded-xl border border-gray-100 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={isEnabled}
                          disabled // Admin cannot toggle
                          className="data-[state=checked]:bg-[#E86B35] opacity-80 cursor-default"
                        />
                        <span
                          className={cn(
                            "font-normal text-sm",
                            isEnabled ? "text-gray-900" : "text-gray-400",
                          )}
                        >
                          {day.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isEnabled ? (
                          <span className="text-sm font-normal text-gray-600">
                            {formatTimeStr(data.openingTime)} - {formatTimeStr(data.closingTime)}
                          </span>
                        ) : (
                          <span className="text-sm font-normal text-red-400 tracking-tight">
                            Closed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  );
}
