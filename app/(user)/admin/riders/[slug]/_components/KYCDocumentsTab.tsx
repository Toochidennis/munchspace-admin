"use client";

import React, { useState } from "react";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";

// --- Custom Modal Component ---
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
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full bg-white shadow-xl overflow-hidden rounded-lg animate-in zoom-in-95 duration-200",
          maxWidth,
        )}
      >
        <div className="flex border-b items-center justify-between px-6 py-5">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

type DocStatus = "Verified" | "Rejected";

export default function KYCDocumentsTab({ riderId }: { riderId: string }) {
  const [sections, setSections] = useState<any[]>([]);
  const [vehicleInfo, setVehicleInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await authenticatedFetch(`/admin/riders/${riderId}/documents`);
      const result = await parseApiResponse(res);
      if (result?.success && result.data) {
        const { vehicleInfo: vi, ...rest } = result.data;
        setVehicleInfo(vi);
        setSections(Object.values(rest));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [riderId]);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusValue, setStatusValue] = useState<DocStatus>("Verified");
  const [vendorMessage, setVendorMessage] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenModal = (doc: any) => {
    setSelectedDoc(doc);
    const apiStatus = doc.sectionStatus?.label;
    setStatusValue(apiStatus === "Rejected" ? "Rejected" : "Verified");
    setVendorMessage("");
    setNote("");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedDoc) return;
    setIsSaving(true);
    
    try {
      const isApproving = statusValue === "Verified";
      const endpoint = `/admin/riders/${riderId}/documents/${selectedDoc.section}/${isApproving ? 'approve' : 'reject'}`;
      
      const payload = isApproving 
        ? { note: note || "Documents reviewed and approved during onboarding checks." }
        : { rejectionReason: vendorMessage || "Submitted files are invalid or unreadable.", note: note || "Please request reupload for this section." };

      const res = await authenticatedFetch(endpoint, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      
      const result = await parseApiResponse(res);
      if (result?.success) {
        toast.success(`Document marked as ${statusValue}`);
        setIsModalOpen(false);
        fetchDocuments();
      } else {
        toast.error(result?.message || "Failed to update document status");
      }
    } catch (err) {
      toast.error("An error occurred");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Vehicle Information */}
      <Card className="p-6 border border-gray-100 shadow-sm rounded-xl bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-6">
          Vehicle Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-10 gap-x-12">
          {[
            { label: "Vehicle Type", value: vehicleInfo?.vehicleType?.label || "N/A" },
            { label: "Vehicle Make", value: vehicleInfo?.make || "N/A" },
            { label: "License Plate Number", value: vehicleInfo?.plateNumber || "N/A" },
            { label: "Vehicle Model", value: vehicleInfo?.model || "N/A" },
            { label: "Vehicle Color", value: vehicleInfo?.color || "N/A" },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-[11px] tracking-wider text-gray-400 font-bold mb-2 uppercase">
                {item.label}
              </p>
              <p className="text-sm font-bold text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Document Cards */}
      {sections.map((section: any) => (
        <Card
          key={section.section}
          className="p-6 border border-gray-100 shadow-sm rounded-xl bg-white"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">{section.label}</h3>
              <p className="text-sm text-gray-400 font-medium">
                Documents related to {section.label?.toLowerCase() || "this section"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                className={cn(
                  "border-none px-3 py-1 rounded-md text-[10px] font-bold transition-colors uppercase",
                  section.sectionStatus?.label === "Pending Review"
                    ? "bg-blue-50 text-blue-500"
                    : section.sectionStatus?.label === "Rejected"
                      ? "bg-red-50 text-red-500"
                      : section.sectionStatus?.label === "Approved"
                        ? "bg-green-50 text-green-500"
                        : "bg-gray-50 text-gray-500",
                )}
              >
                {section.sectionStatus?.label || "Unknown"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-[#E86B35] text-[#E86B35] hover:bg-orange-50 font-bold rounded-md px-4"
                onClick={() => handleOpenModal(section)}
              >
                Mark document as...
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-2">
              Submitted docs:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {section.items?.map((file: any) => (
                <div
                  key={file.id}
                  className="flex items-center gap-6 bg-[#F9FAFB] border border-gray-100 p-2.5 rounded-lg w-fit min-w-[400px]"
                >
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-blue-500 hover:underline cursor-pointer"
                  >
                    <Paperclip size={14} className="text-gray-400" />
                    <span className="text-xs font-bold">{file.type?.label}</span>
                  </a>
                  <div className="w-[1px] h-3 bg-gray-200" />
                  <span className="text-[10px] text-gray-400 font-medium">
                    Uploaded on: {new Date(file.uploadedAt).toLocaleDateString()}
                  </span>
                  <div className="w-[1px] h-3 bg-gray-200" />
                  <Badge
                    className={cn(
                      "border-none px-2 py-0.5 rounded-md text-[9px] font-bold transition-colors uppercase",
                      file.status?.label === "Pending Review"
                        ? "bg-blue-50 text-blue-500"
                        : file.status?.label === "Rejected"
                          ? "bg-red-50 text-red-500"
                          : file.status?.label === "Approved"
                            ? "bg-green-50 text-green-500"
                            : "bg-gray-50 text-gray-500",
                    )}
                  >
                    {file.status?.label || "Unknown"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}

      {/* Mark Document Modal */}
      <CustomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Mark document as..."
        maxWidth="sm:max-w-[500px]"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="h-10 rounded-md border-gray-200 font-bold text-gray-600 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-10 rounded-md bg-[#E86B35] hover:bg-[#d15d2c] text-white font-bold px-8"
            >
              {isSaving ? "Saving..." : "Submit"}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-700">
            Mark{" "}
            <span className="font-bold">{selectedDoc?.label}</span>{" "}
            as..
          </p>

          <RadioGroup
            value={statusValue}
            onValueChange={(v) => setStatusValue(v as DocStatus)}
            className="space-y-4"
          >
            {[
              "Verified",
              "Rejected",
            ].map((s) => (
              <div key={s} className="flex items-center space-x-3">
                <RadioGroupItem
                  value={s}
                  id={s}
                  className="border-gray-300 text-[#E86B35]"
                />
                <Label
                  htmlFor={s}
                  className="text-sm font-bold text-gray-700 cursor-pointer"
                >
                  {s}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {statusValue !== "Verified" && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">
                Message to Vendor <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Explain why the document was rejected..."
                value={vendorMessage}
                onChange={(e) => setVendorMessage(e.target.value)}
                className="min-h-[120px] border-gray-200 rounded-lg text-sm placeholder:text-gray-400 italic"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">
              Note <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder={
                statusValue === "Verified" 
                  ? "Documents reviewed and approved during onboarding checks." 
                  : "Please request reupload for this section."
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[120px] border-gray-200 rounded-lg text-sm placeholder:text-gray-400 italic"
            />
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
