"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  UserCheck,
  Mail,
  Flag,
  MoreHorizontal,
  Loader2,
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
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import { format } from "date-fns";

// Separate Tab Components
import DetailsTab from "./_components/DetailsTab";
import KYCDocumentsTab from "./_components/KYCDocumentsTab";
import DeliveriesTab from "./_components/DeliveriesTab";
import RemittanceTab from "./_components/RemittanceTab";
import ActivityLogsTab from "./_components/ActivityLogsTab";

const TABS = [
  "Details",
  "Deliveries",
  "Remittance",
  "KYC Documents",
  "Activity logs",
];

interface RiderProfile {
  riderId: string;
  fullName: string;
  profilePictureUrl: string | null;
  registeredAt: string;
  status: string;
  onlineStatus: string;
  openFlagCount: number;
}

export default function RiderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const riderId = params.slug as string;
  const [activeTab, setActiveTab] = React.useState("Details");
  const [profile, setProfile] = React.useState<RiderProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchProfile() {
      try {
        setIsLoading(true);
        const res = await authenticatedFetch(`/admin/riders/${riderId}`);
        const apiRes = await parseApiResponse(res);
        if (apiRes?.success) {
          setProfile(apiRes.data.profile);
        }
      } catch (error) {
        console.error("Failed to fetch rider profile:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (riderId) {
      fetchProfile();
    }
  }, [riderId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#E86B35]" />
          <p className="text-gray-500 font-medium font-inter">Loading rider profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 font-medium">Rider profile not found.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.fullName}`;

  return (
    <div className="min-h-screen bg-white overflow-y-auto scrollbar-hide">
      <div className="max-w-[1400px] mx-auto pt-8 px-6 pb-20">
        {/* Breadcrumb */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors mb-8 text-sm font-medium"
        >
          <ChevronLeft size={18} />
          Riders / #{riderId}
        </button>

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-orange-100 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
              <img
                src={profile.profilePictureUrl || defaultAvatar}
                alt={profile.fullName}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.fullName}
                </h1>
                <Badge className={cn(
                  "border-none px-3 py-0.5 text-[10px] font-bold uppercase rounded",
                  profile.status === "Approved" ? "bg-[#22C55E] text-white" :
                  profile.status === "Suspended" ? "bg-red-500 text-white" :
                  "bg-orange-500 text-white"
                )}>
                  {profile.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mt-1 font-medium">
                Joined on: {profile.registeredAt ? format(new Date(profile.registeredAt), "do MMM yyyy") : "N/A"}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 border-gray-200 text-gray-600 font-semibold h-10 px-5 rounded-lg hover:bg-gray-50"
                >
                  More Actions <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 p-1.5 shadow-xl border-gray-100 rounded-xl"
              >
                <DropdownMenuItem className="gap-3 py-3 font-bold text-xs text-gray-700 cursor-pointer">
                  <UserCheck size={16} className="text-gray-400" /> Mark Rider
                  as...
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 py-3 font-bold text-xs text-gray-700 cursor-pointer">
                  <Mail size={16} className="text-gray-400" /> Notify Rider...
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 py-3 font-bold text-xs text-red-500 border-t mt-1 cursor-pointer">
                  <Flag size={16} /> Suspend Rider
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-8 border-b border-gray-100 mb-8 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-3 text-sm font-bold transition-all relative whitespace-nowrap",
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

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
          {activeTab === "Details" && <DetailsTab riderId={riderId} />}
          {activeTab === "Deliveries" && <DeliveriesTab riderId={riderId} />}
          {activeTab === "Remittance" && <RemittanceTab riderId={riderId} />}
          {activeTab === "KYC Documents" && <KYCDocumentsTab riderId={riderId} />}
          {activeTab === "Activity logs" && <ActivityLogsTab riderId={riderId} />}
        </div>
      </div>
    </div>
  );
}
