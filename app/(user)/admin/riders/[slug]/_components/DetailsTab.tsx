"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import { format } from "date-fns";

interface RiderDetails {
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phoneLine1: string;
    phoneLine2: string;
  };
  address: {
    houseNumber: string;
    streetName: string;
    state: string;
    lga: string;
    city: string;
  };
  accountDetails: {
    logoUrl: string | null;
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
}

export default function DetailsTab({ riderId }: { riderId: string }) {
  const [data, setData] = useState<RiderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authenticatedFetch(`/admin/riders/${riderId}/details`);
      const apiRes = await parseApiResponse(res);
      
      if (apiRes?.success) {
        setData(apiRes.data);
      } else {
        setError(apiRes?.message || "Failed to load rider details");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rider details");
      console.error("Failed to fetch rider details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (riderId) {
      fetchDetails();
    }
  }, [riderId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[400px]">
        <div className="flex items-center gap-2 text-gray-500 font-medium">
          <Loader2 className="h-5 w-5 animate-spin text-[#E86B35]" />
          Loading rider details...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-red-500 font-medium">{error || "No details found for this rider."}</p>
        <button 
          onClick={fetchDetails}
          className="text-sm font-bold text-[#E86B35] hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const personalInfo = [
    { label: "First Name", value: data.personalInfo.firstName },
    { label: "Last Name", value: data.personalInfo.lastName },
    { 
      label: "Date of Birth (DOB)", 
      value: data.personalInfo.dateOfBirth ? format(new Date(data.personalInfo.dateOfBirth), "dd/MM/yyyy") : "N/A" 
    },
    { label: "Phone Line 1", value: data.personalInfo.phoneLine1 },
    { label: "Phone Line 2", value: data.personalInfo.phoneLine2 },
  ];

  const addressInfo = [
    { label: "House Number", value: data.address.houseNumber },
    { label: "Street Name", value: data.address.streetName },
    { label: "State", value: data.address.state },
    { label: "City", value: data.address.city },
    { label: "LGA", value: data.address.lga },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Personal Information Card */}
      <Card className="p-6 border border-gray-100 shadow-sm rounded-xl bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-6">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-10 gap-x-12">
          {personalInfo.map((item, i) => (
            <div key={i}>
              <p className="text-[11px] tracking-wider text-gray-400 font-bold mb-2 uppercase">
                {item.label}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {item.value || "N/A"}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Address Information Card */}
      <Card className="p-6 border border-gray-100 shadow-sm rounded-xl bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-6">
          Address Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-10 gap-x-12">
          {addressInfo.map((item, i) => (
            <div key={i}>
              <p className="text-[11px] tracking-wider text-gray-400 font-bold mb-2 uppercase">
                {item.label}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {item.value || "N/A"}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Bank Account */}
      <Card className="p-6 border border-gray-100 shadow-sm rounded-xl bg-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-[8px] leading-tight text-center p-2 uppercase">
            {data.accountDetails.bankName || "BANK"}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 mb-1">
              {data.accountDetails.accountName}
            </p>
            <p className="text-xs text-gray-400 font-medium font-mono">
              {data.accountDetails.accountNumber} ({data.accountDetails.bankName})
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
