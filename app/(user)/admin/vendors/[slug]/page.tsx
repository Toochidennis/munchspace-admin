"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronDown,
  UserCheck,
  Mail,
  ExternalLink,
  Flag,
  X,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
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

export default function VendorDetailsPage() {
  const router = useRouter();
  const { slug } = useParams() as { slug: string };
  const [activeTab, setActiveTab] = React.useState("Details");
  const [isAccessModalOpen, setIsAccessModalOpen] = React.useState(false);
  const [vendorData, setVendorData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Status Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState<string>("active");
  const [statusReason, setStatusReason] = React.useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const [statusError, setStatusError] = React.useState("");

  // Notify Modal State
  const [isNotifyModalOpen, setIsNotifyModalOpen] = React.useState(false);
  const [notifyMessage, setNotifyMessage] = React.useState("");
  const [isSendingNotify, setIsSendingNotify] = React.useState(false);

  React.useEffect(() => {
    const fetchVendorDetails = async () => {
      try {
        setIsLoading(true);
        const res = await authenticatedFetch(`/admin/businesses/${slug}`);
        const result = await parseApiResponse(res);
        if (result?.success) {
          setVendorData(result.data);
        } else {
          setError(result?.message || "Failed to load vendor details");
        }
      } catch (err) {
        setError("An error occurred while fetching vendor details");
      } finally {
        setIsLoading(false);
      }
    };
    if (slug) fetchVendorDetails();
  }, [slug]);

  const handleUpdateStatus = async () => {
    if (!statusReason.trim()) {
      setStatusError("Reason is required");
      return;
    }
    
    try {
      setIsUpdatingStatus(true);
      setStatusError("");
      
      const payload = {
        statusKey: selectedStatus,
        reason: statusReason,
      };

      const res = await authenticatedFetch(`/admin/businesses/${vendorData?.businessInfo?.id}/status`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      
      const result = await parseApiResponse(res);
      
      if (result?.success || res.ok) {
        toast.success("Vendor status updated successfully");
        setVendorData((prev: any) => ({
          ...prev,
          businessInfo: {
            ...prev.businessInfo,
            status: {
              ...prev.businessInfo.status,
              state: selectedStatus.toUpperCase()
            }
          }
        }));
        setIsStatusModalOpen(false);
      } else {
        toast.error(result?.message || "Failed to update status");
      }
    } catch (err) {
      toast.error("An error occurred while updating status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#E86B35]" />
      </div>
    );
  }

  if (error || !vendorData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <p className="text-gray-500 mb-4">{error || "Vendor not found"}</p>
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    );
  }

  const { vendor, businessInfo } = vendorData;

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
          Vendors / #{vendor?.id?.slice(vendor?.id?.length > 4 ? -4 : 0).toUpperCase() || slug}
        </button>

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
              {vendor?.businessLogo ? (
                <img
                  src={vendor.businessLogo}
                  alt={businessInfo?.displayName || businessInfo?.legalName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 font-semibold text-xl">
                  {(businessInfo?.displayName || businessInfo?.legalName || "?").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {businessInfo?.displayName || businessInfo?.legalName}
                </h1>
                <Badge 
                  className={cn(
                    "border-none px-3 py-0.5 text-[10px] font-semibold uppercase",
                    businessInfo?.status?.state === "ACTIVE" ? "bg-[#EBFBF0] text-[#22C55E]" : 
                    businessInfo?.status?.state === "PENDING_REVIEW" ? "bg-yellow-100 text-yellow-700" :
                    businessInfo?.status?.state === "REJECTED" ? "bg-red-100 text-red-700" :
                    businessInfo?.status?.state === "DEACTIVATED" ? "bg-gray-100 text-gray-700" :
                    businessInfo?.status?.state === "SUSPENDED" ? "bg-red-100 text-red-600" :
                    "bg-blue-100 text-blue-700" // ONBOARDING, DRAFT
                  )}
                >
                  {businessInfo?.status?.state?.replace("_", " ") || "UNKNOWN"}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                Joined on: {vendor?.joinedAt ? format(new Date(vendor.joinedAt), "do MMM yyyy") : "Unknown"}
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
                <DropdownMenuItem 
                  className="gap-3 py-2.5 font-medium text-xs text-gray-700 cursor-pointer"
                  onClick={() => {
                    setSelectedStatus(businessInfo?.status?.state?.toLowerCase() || "active");
                    setStatusReason("");
                    setStatusError("");
                    setIsStatusModalOpen(true);
                  }}
                >
                  <UserCheck size={16} className="text-gray-400" /> Mark Vendor
                  as...
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="gap-3 py-2.5 font-medium text-xs text-gray-700 cursor-pointer"
                  onClick={() => {
                    setNotifyMessage("");
                    setIsNotifyModalOpen(true);
                  }}
                >
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
          {activeTab === "Details" && <DetailsTab data={vendorData} />}
          {activeTab === "Items" && <ItemsTab businessId={businessInfo?.id} />}
          {activeTab === "Orders" && <OrdersTab businessId={businessInfo?.id} />}
          {activeTab === "Remittance" && <RemittanceTab />}
          {activeTab === "KYC documents" && <KYCDocumentsTab businessId={businessInfo?.id} />}
          {activeTab === "Activity logs" && <ActivityLogsTab businessId={businessInfo?.id} />}
          {/* Add more conditions as components are created */}
        </div>
      </div>

      {/* <AccessAccountModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        vendorName="Sushi Place"
      /> */}
      <AccessAccountModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        title="Confirm action"
        maxWidth="sm:max-w-[540px]"
        footer={
          <>
            <Button
              className="px-8 rounded bg-white border-3 text-gray-800 h-10"
              onClick={() => setIsAccessModalOpen(false)}
            >
              Cancel
            </Button>
            <Button className="bg-munchprimary hover:bg-munchprimaryDark text-white px-6 rounded h-10">
              Yes , confirm
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-gray-700">
              Are you sure you want to access Sushi Place's account? All actions
              will be recorded in the activity log.
            </p>
          </div>
        </div>
      </AccessAccountModal>

      {/* Status Modal */}
      <AccessAccountModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Mark vendor as..."
        maxWidth="sm:max-w-[540px]"
        footer={
          <>
            <Button
              variant="outline"
              className="px-8 rounded border-gray-200 text-gray-800 h-10"
              onClick={() => setIsStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#E86B35] hover:bg-[#d15d2c] text-white px-6 rounded h-10 min-w-[100px]"
              onClick={handleUpdateStatus}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Mark <span className="font-bold">{businessInfo?.displayName || businessInfo?.legalName}</span> as...
            </p>
            <RadioGroup
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              className="space-y-3"
            >
              {[
                { label: "Active", value: "active" },
                { label: "Suspended", value: "suspended" },
                { label: "Rejected", value: "rejected" },
                { label: "Pending Review", value: "pending_review" },
              ].map((s) => (
                <div key={s.value} className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={s.value}
                    id={s.value}
                    className="border-gray-300 text-[#E86B35] focus:ring-[#E86B35]"
                  />
                  <Label
                    htmlFor={s.value}
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    {s.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">
              Internal Note <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={statusReason}
              onChange={(e) => {
                setStatusReason(e.target.value);
                setStatusError("");
              }}
              className={cn(
                "min-h-[100px] border-gray-200 rounded-md focus-visible:ring-[#E86B35]",
                statusError && "border-red-500"
              )}
              placeholder="Briefly explain this update..."
            />
            {statusError && (
              <p className="text-xs text-red-500 font-medium">{statusError}</p>
            )}
          </div>
        </div>
      </AccessAccountModal>

      {/* Notify Modal */}
      <AccessAccountModal
        isOpen={isNotifyModalOpen}
        onClose={() => {
          setIsNotifyModalOpen(false);
          setNotifyMessage("");
        }}
        title="Notify Vendor"
        maxWidth="sm:max-w-[500px]"
        footer={
          <>
            <Button
              variant="outline"
              className="px-8 rounded border-gray-200 text-gray-800 h-10"
              onClick={() => {
                setIsNotifyModalOpen(false);
                setNotifyMessage("");
              }}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#E86B35] hover:bg-[#d15d2c] text-white px-6 rounded h-10 min-w-[100px]"
              disabled={!notifyMessage.trim() || isSendingNotify}
              onClick={async () => {
                if (!notifyMessage.trim()) return;

                setIsSendingNotify(true);
                try {
                  const res = await authenticatedFetch(
                    `/admin/businesses/${businessInfo?.id}/messages`,
                    {
                      method: "POST",
                      body: JSON.stringify({
                        recipient: "vendor",
                        message: notifyMessage.trim(),
                      }),
                    }
                  );
                  const result = await parseApiResponse(res);

                  if (result?.success) {
                    toast.success("Message sent to vendor successfully");
                    setIsNotifyModalOpen(false);
                    setNotifyMessage("");
                  } else {
                    toast.error(result?.message || "Failed to send message to vendor");
                  }
                } catch (err) {
                  toast.error("An error occurred while sending message");
                } finally {
                  setIsSendingNotify(false);
                }
              }}
            >
              {isSendingNotify ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Send a message to vendor:{" "}
            <span className="font-medium">
              {businessInfo?.displayName || businessInfo?.legalName}
            </span>
          </p>
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </Label>
            <Textarea
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
              placeholder="Type your message here..."
              className="min-h-[120px] border-gray-200 rounded-md focus-visible:ring-[#E86B35] resize-y"
            />
          </div>
        </div>
      </AccessAccountModal>
    </div>
  );
}

function AccessAccountModal({
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
        <div className="flex border-b items-center justify-between px-6 py-4">
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