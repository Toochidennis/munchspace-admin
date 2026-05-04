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
  X,
  Ban,
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
import { toast } from "sonner";

// Separate Tab Components
import DetailsTab from "./_components/DetailsTab";
import KYCDocumentsTab from "./_components/KYCDocumentsTab";
import DeliveriesTab from "./_components/DeliveriesTab";
import RemittanceTab from "./_components/RemittanceTab";
import ActivityLogsTab from "./_components/ActivityLogsTab";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
          "relative w-full bg-white shadow-xl overflow-hidden rounded animate-in zoom-in-95 duration-200",
          maxWidth,
        )}
      >
        <div className="flex border-b items-center justify-between px-6 py-4 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
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

export default function RiderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const riderId = params.slug as string;
  const [activeTab, setActiveTab] = React.useState("Details");
  const [profile, setProfile] = React.useState<RiderProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Modals
  const [notifyModalOpen, setNotifyModalOpen] = React.useState(false);
  const [markAsModalOpen, setMarkAsModalOpen] = React.useState(false);
  const [suspendModalOpen, setSuspendModalOpen] = React.useState(false);
  const [customMessage, setCustomMessage] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [statusKey, setStatusKey] = React.useState("");
  const [statusReason, setStatusReason] = React.useState("");
  const [suspendReason, setSuspendReason] = React.useState("");

  const fetchProfile = React.useCallback(async () => {
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
  }, [riderId]);

  React.useEffect(() => {
    if (riderId) {
      fetchProfile();
    }
  }, [fetchProfile, riderId]);

  const handleMarkStatus = async () => {
    if (!profile || !statusKey) return;

    setIsProcessing(true);
    try {
      const res = await authenticatedFetch(
        `/admin/riders/${profile.riderId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            statusKey,
            reason: statusReason || "Updated by admin",
          }),
        }
      );
      const result = await parseApiResponse(res);
      if (result?.success) {
        toast.success("Rider status updated successfully");
        setMarkAsModalOpen(false);
        fetchProfile();
      } else {
        toast.error(result?.message || "Failed to update status");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleSuspension = async () => {
    if (!profile) return;
    const isSuspended = profile.status.toLowerCase() === "suspended";
    if (isSuspended) {
      confirmSuspension(true, "");
    } else {
      setSuspendReason("");
      setSuspendModalOpen(true);
    }
  };

  const confirmSuspension = async (isUnsuspending: boolean, reason: string) => {
    if (!profile) return;
    setIsProcessing(true);
    const endpoint = isUnsuspending 
      ? `/admin/riders/${profile.riderId}/unsuspend` 
      : `/admin/riders/${profile.riderId}/suspend`;
    
    try {
      const res = await authenticatedFetch(
        endpoint,
        {
          method: "PATCH",
          body: JSON.stringify(isUnsuspending ? {} : { reason }),
        }
      );
      const result = await parseApiResponse(res);
      if (result?.success) {
        toast.success(`Rider ${isUnsuspending ? "unsuspended" : "suspended"} successfully`);
        setSuspendModalOpen(false);
        fetchProfile();
      } else {
        toast.error(result?.message || `Failed to ${isUnsuspending ? "unsuspend" : "suspend"} rider`);
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNotify = async () => {
    if (!customMessage.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
      toast.success("Notification sent to rider");
      setNotifyModalOpen(false);
      setCustomMessage("");
      setIsProcessing(false);
    }, 1000);
  };

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
                <DropdownMenuItem 
                  className="gap-3 py-3 font-bold text-xs text-gray-700 cursor-pointer"
                  onClick={() => {
                    setStatusKey(profile.status.toLowerCase());
                    setStatusReason("");
                    setMarkAsModalOpen(true);
                  }}
                >
                  <UserCheck size={16} className="text-gray-400" /> Mark Rider
                  as...
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="gap-3 py-3 font-bold text-xs text-gray-700 cursor-pointer"
                  onClick={() => setNotifyModalOpen(true)}
                >
                  <Mail size={16} className="text-gray-400" /> Notify Rider...
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={cn(
                    "gap-3 py-3 font-bold text-xs border-t mt-1 cursor-pointer",
                    profile.status.toLowerCase() === "suspended" ? "text-green-600" : "text-red-500"
                  )}
                  onClick={handleToggleSuspension}
                  disabled={isProcessing}
                >
                  <Ban size={16} /> {profile.status.toLowerCase() === "suspended" ? "Unsuspend Rider" : "Suspend Rider"}
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

      {/* Mark As Modal */}
      <CustomModal
        isOpen={markAsModalOpen}
        onClose={() => setMarkAsModalOpen(false)}
        title="Mark Rider As"
        maxWidth="sm:max-w-[500px]"
        footer={
          <>
            <Button variant="outline" onClick={() => setMarkAsModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#E86B35] hover:bg-[#d15d2c] text-white font-medium"
              onClick={handleMarkStatus}
              disabled={isProcessing || !statusKey}
            >
              {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Update Status"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Change status for rider: <span className="font-medium">{profile.fullName}</span>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
            <Select value={statusKey} onValueChange={setStatusKey}>
              <SelectTrigger className="w-full border-gray-300 rounded-md p-3 text-sm h-11 focus:ring-2 focus:ring-[#E86B35]">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent className="z-[110]">
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending_verification">Pending Verification</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <textarea
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Enter reason for status change..."
              rows={3}
              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E86B35] resize-y min-h-[100px]"
            />
          </div>
        </div>
      </CustomModal>

      {/* Notify Modal */}
      <CustomModal
        isOpen={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        title="Notify Rider"
        footer={
          <>
            <Button variant="outline" onClick={() => setNotifyModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#E86B35] hover:bg-[#d15d2c] text-white font-bold"
              onClick={handleNotify}
              disabled={isProcessing || !customMessage.trim()}
            >
              {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Send Message"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Send message to: <span className="font-bold">{profile.fullName}</span>
          </p>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Type your message here..."
            rows={5}
            className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#E86B35] resize-none"
          />
        </div>
      </CustomModal>

      {/* Suspend Modal */}
      <CustomModal
        isOpen={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        title="Suspend Rider"
        maxWidth="sm:max-w-[500px]"
        footer={
          <>
            <Button variant="outline" onClick={() => setSuspendModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-red-500 hover:bg-red-600 text-white font-medium"
              onClick={() => confirmSuspension(false, suspendReason)}
              disabled={isProcessing || !suspendReason.trim()}
            >
              {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Suspend Rider"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Provide a reason for suspending rider: <span className="font-medium">{profile.fullName}</span>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Suspension</label>
            <Select value={suspendReason} onValueChange={setSuspendReason}>
              <SelectTrigger className="w-full border-gray-300 rounded-md p-3 text-sm h-11 focus:ring-2 focus:ring-red-500">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent className="z-[110]">
                <SelectItem value="Repeated delivery misconduct">Repeated delivery misconduct</SelectItem>
                <SelectItem value="Late deliveries">Frequent late deliveries</SelectItem>
                <SelectItem value="Customer complaints">High volume of customer complaints</SelectItem>
                <SelectItem value="Policy violation">Violation of company policy</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {suspendReason === "Other" && (
             <textarea
               onChange={(e) => setSuspendReason(e.target.value)}
               placeholder="Specify the reason..."
               rows={3}
               className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y min-h-[100px]"
             />
          )}
        </div>
      </CustomModal>
    </div>
  );
}
