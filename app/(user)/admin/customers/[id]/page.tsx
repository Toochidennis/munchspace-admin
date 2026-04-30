"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CustomerDetailsView from "../_components/CustomerDetailsView";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ApiCustomerDetail {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  shippingAddress: {
    streetName: string;
    city: string;
    state: string | null;
  } | null;
  registeredAt: string;
  isActive: boolean;
  status: string;
  flagged: boolean;
  suspended: boolean;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

export default function CustomerDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [customer, setCustomer] = useState<ApiCustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await authenticatedFetch(`/admin/customers/${id}`);
        const apiRes = await parseApiResponse(res);

        if (apiRes?.success) {
          // Assuming the API returns the customer object in apiRes.data
          setCustomer(apiRes.data);
        } else {
          toast.error(apiRes?.message || "Failed to load customer details");
          router.push("/admin/customers");
        }
      } catch (error) {
        toast.error("An error occurred loading the customer");
        router.push("/admin/customers");
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchCustomer();
    }
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto bg-[#F8FAFC] p-6">
      <CustomerDetailsView
        customer={customer}
        onBack={() => router.push("/admin/customers")}
      />
    </div>
  );
}
