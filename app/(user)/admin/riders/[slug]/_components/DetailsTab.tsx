"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function DetailsTab() {
  // Static data representing the vendor's settings
  const workingHoursData = DAYS_OF_WEEK.reduce(
    (acc, day) => ({
      ...acc,
      [day]: { enabled: day !== "Sunday", start: "08:00", end: "20:00" },
    }),
    {},
  );

  const formatTime = (time: string) => {
    if (!time) return "00:00 AM";
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const formattedHours = h % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Store Information Card */}
      <Card className="p-4 border shadow-none rounded-xl bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Store Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-10 gap-x-12">
          {[
            { label: "Store Name", value: "Bo Cafe" },
            { label: "Store Display Name", value: "Bo Cafe" },
            { label: "Email", value: "bocafe1600@gmail.com" },
            { label: "Phone", value: "+123 456 7898" },
            { label: "Established Date", value: "04 Aug, 2009" },
            {
              label: "Store Address",
              value: "BLK 15 26 Ayoade Olubowale Cres. Lagos State",
            },
            { label: "Business Status", value: "Operational" },
            { label: "Restaurant Type", value: "Casual Dining, Fast-Casual" },
            { label: "Service Options", value: "Take-Out, Take-In, Delivery" },
            { label: "Website", value: "N/A" },
            { label: "Store Activation Code", value: "GH65TY" },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-[11px] tracking-wider text-gray-400 font-semibold mb-2">
                {item.label}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Bank Account */}
      <Card className="p-4 border shadow-none rounded-xl bg-white flex justify-between">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 bg-[#E86B35] rounded-lg flex items-center justify-center text-white font-semibold text-[10px] leading-tight text-center">
            GT BANK
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">
              Ayomide Joshua
            </p>
            <p className="text-xs text-gray-500 font-medium">
              0123456789 (GTBank)
            </p>
          </div>
        </div>
      </Card>

      {/* Working Hours - READ ONLY ADMIN VIEW */}
      <Card className="md:p-4 p-4 border shadow-none rounded-xl bg-white">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="working-hours" className="border-none">
            <AccordionTrigger className="text-lg font-semibold text-gray-900 hover:no-underline p-0">
              Working Hours
            </AccordionTrigger>
            <AccordionContent className="pt-8 pb-0">
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => {
                  const data = (workingHoursData as any)[day];

                  return (
                    <div
                      key={day}
                      className="flex items-center justify-between rounded-xl border border-gray-100 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={data.enabled}
                          disabled // Admin cannot toggle
                          className="data-[state=checked]:bg-[#E86B35] opacity-80 cursor-default"
                        />
                        <span
                          className={cn(
                            "font-semibold text-sm",
                            data.enabled ? "text-gray-900" : "text-gray-400",
                          )}
                        >
                          {day}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {data.enabled ? (
                          <span className="text-sm font-semibold text-gray-600">
                            {formatTime(data.start)} - {formatTime(data.end)}
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-red-400 tracking-tight">
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
