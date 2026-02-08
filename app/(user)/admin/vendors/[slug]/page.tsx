"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronDown,
  UserCheck,
  Mail,
  ExternalLink,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Separate Tab Components
import DetailsTab from "./_components/DetailsTab";
import KYCDocumentsTab from "./_components/KYCDocumentsTab";
import ItemsTab from "./_components/ItemsTab";
import OrdersTab from "./_components/OrderTabs";
import RemittanceTab from "./_components/RemittanceTab";
import ActivityLogsTab from "./_components/ActivityLogsTab";
// import AccessAccountModal from "./_components/AccessAccountModal";

const TABS = [
  "Details",
  "Items",
  "Orders",
  "Remittance",
  "KYC documents",
  "Activity logs",
];

export default function VendorDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState("Details");
  const [isAccessModalOpen, setIsAccessModalOpen] = React.useState(false);

  return (
    /* YOUR REQUESTED SCROLL LOGIC */
    <div className="h-screen overflow-y-auto bg-white">
      <div className="max-w-[1200px] mx-auto pt-8 px-6 pb-20">
        {/* Breadcrumb */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 text-sm font-medium"
        >
          <ChevronLeft size={18} />
          Vendors / #{params.id}
        </button>

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1577214495773-b142e1799b95?auto=format&fit=crop&q=80&w=200"
                alt="Profile"
              />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-gray-900">
                  Sushi Place
                </h1>
                <Badge className="bg-[#EBFBF0] text-[#22C55E] border-none px-3 py-0.5 text-[10px] font-semibold uppercase">
                  Approved
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                Joined on: 15th Aug 2024.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 border-gray-200 text-gray-700 font-semibold h-10 px-5 rounded-lg"
                >
                  More Actions <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 p-1.5 shadow-lg border-gray-100 rounded-xl"
              >
                <DropdownMenuItem className="gap-3 py-2.5 font-medium text-xs text-gray-700">
                  <UserCheck size={16} className="text-gray-400" /> Mark Vendor
                  as...
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 py-2.5 font-medium text-xs text-gray-700">
                  <Mail size={16} className="text-gray-400" /> Notify Vendor...
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-3 py-2.5 font-medium text-xs text-gray-700 cursor-pointer"
                  onClick={() => setIsAccessModalOpen(true)}
                >
                  <ExternalLink size={16} className="text-gray-400" /> Access
                  vendor acct.
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 py-2.5 font-medium text-xs text-red-500 border-t border-gray-50 mt-1">
                  <Flag size={16} /> Flag Vendor
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-8 border-b border-gray-200 mb-8 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-3 text-sm transition-all relative whitespace-nowrap",
                activeTab === tab
                  ? "text-[#E86B35]"
                  : "text-gray-400 hover:text-gray-600",
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E86B35]" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Components */}
        <div className="animate-in fade-in duration-300">
          {activeTab === "Details" && <DetailsTab />}
          {activeTab === "Items" && <ItemsTab />}
          {activeTab === "Orders" && <OrdersTab />}
          {activeTab === "Remittance" && <RemittanceTab />}
          {activeTab === "KYC documents" && <KYCDocumentsTab />}
          {activeTab === "Activity logs" && <ActivityLogsTab />}
          {/* Add more conditions as components are created */}
        </div>
      </div>

      {/* <AccessAccountModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        vendorName="Sushi Place"
      /> */}
    </div>
  );
}
