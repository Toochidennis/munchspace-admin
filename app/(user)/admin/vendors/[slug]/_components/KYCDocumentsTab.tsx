"use client";

import React, { useState, useEffect } from "react";
import { X, Paperclip, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
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
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full bg-white shadow-xl overflow-hidden rounded-md animate-in zoom-in-95 duration-200",
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
        <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Types ---
type DocStatus =
  | "Verified"
  | "Rejected"
  | "Required"
  | "In Review"
  | "Incomplete"
  | "Pending Submission";

interface KYCDocument {
  id: string;
  title: string;
  description: string;
  status: DocStatus;
  files?: { name: string; date: string; url?: string }[];
  tin?: string;
  ownerType?: string;
}

export default function KYCDocumentsTab({ businessId }: { businessId?: string }) {
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!businessId) return;
      try {
        setIsLoading(true);
        const res = await authenticatedFetch(`/admin/businesses/${businessId}/documents`);
        const result = await parseApiResponse(res);
        if (result?.success) {
          const apiDocs = result.data.documents.map((doc: any) => {
            const files = [];
            if (doc.inputType === "FILE" && doc.fileUrl) {
              files.push({
                name: doc.fileUrl.split('/').pop() || "Document",
                url: doc.fileUrl,
                date: doc.uploadedAt ? format(new Date(doc.uploadedAt), "MMM d, yyyy • h:mm a") : "",
              });
            }
            
            let statusValue = doc.status?.label || "Pending Submission";
            if (statusValue === "Pending Review") statusValue = "In Review";

            return {
              id: doc.id,
              title: doc.name,
              description: doc.description,
              status: statusValue as DocStatus,
              files: files.length > 0 ? files : undefined,
              tin: doc.inputType === "TEXT" ? doc.value : undefined, // Assuming text might be TIN, adjust if needed
              ownerType: doc.ownerType || "BUSINESS",
            };
          });
          setDocuments(apiDocs);
        }
      } catch (err) {
        toast.error("Failed to fetch documents");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocuments();
  }, [businessId]);

  const [selectedDoc, setSelectedDoc] = useState<KYCDocument | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Form State
  const [actionValue, setActionValue] = useState<"Approve" | "Reject">("Approve");
  const [vendorMessage, setVendorMessage] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [errors, setErrors] = useState<{ message?: string; note?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenModal = (doc: KYCDocument) => {
    setSelectedDoc(doc);
    setActionValue("Approve");
    setVendorMessage("");
    setInternalNote("");
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedDoc) return;
    
    const newErrors: { message?: string; note?: string } = {};
    if (actionValue === "Reject" && !vendorMessage.trim()) {
      newErrors.message = "Message to vendor is required";
    }
    if (!internalNote.trim()) {
      newErrors.note = "Internal note is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const endpoint = actionValue === "Approve" 
        ? `/admin/documents/${selectedDoc.id}/approve` 
        : `/admin/documents/${selectedDoc.id}/reject`;
        
      const payload = actionValue === "Approve" 
        ? { ownerType: selectedDoc.ownerType || "BUSINESS", note: internalNote }
        : { ownerType: selectedDoc.ownerType || "BUSINESS", rejectionReason: vendorMessage, note: internalNote };

      const res = await authenticatedFetch(endpoint, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      const result = await parseApiResponse(res);
      console.log(result, payload)

      if (result?.success || res.ok) {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === selectedDoc.id 
              ? { ...d, status: result?.status === "APPROVED" || actionValue === "Approve" ? "Verified" : "Rejected" } 
              : d,
          ),
        );
        toast.success(`Document ${actionValue === "Approve" ? "approved" : "rejected"} successfully`);
        setModalOpen(false);
      } else {
        toast.error(result?.message || `Failed to ${actionValue.toLowerCase()} document`);
      }
    } catch (err) {
      toast.error("An error occurred while updating document status");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#E86B35]" />
      </div>
    );
  }

  if (!documents.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        No KYC documents found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <Card
          key={doc.id}
          className="p-6 border-gray-100 shadow-none rounded-md"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0 pr-4">
              <h3 className="text-lg font-bold text-gray-900">{doc.title}</h3>
              <p className="text-sm text-gray-500 max-w-[500px]">{doc.description}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span
                className={cn(
                  "text-[12px] px-2.5 py-1 rounded-md font-medium whitespace-nowrap flex-shrink-0",
                  doc.status === "Verified" && "bg-green-50 text-green-700",
                  doc.status === "In Review" && "bg-gray-100 text-gray-700",
                  doc.status === "Pending Submission" &&
                    "bg-blue-50 text-blue-600",
                  (doc.status === "Rejected" || doc.status === "Required") &&
                    "bg-red-50 text-red-600",
                  doc.status === "Incomplete" && "bg-orange-50 text-orange-700",
                )}
              >
                {doc.status}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-[#E86B35] text-[#E86B35] hover:bg-orange-50 font-normal rounded-md whitespace-nowrap flex-shrink-0"
                onClick={() => handleOpenModal(doc)}
              >
                Mark document as...
              </Button>
            </div>
          </div>

          {doc.files && doc.files.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400">
                Submitted docs:
              </p>
              <div className="grid grid-cols-1 gap-2">
                {doc.files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 bg-[#F8F9FA] border border-gray-100 p-2.5 rounded-md w-fit max-w-full"
                  >
                    <div 
                      className="flex items-center gap-2 text-[#3b82f6] hover:underline cursor-pointer min-w-0"
                      title={file.name}
                      onClick={() => {
                        if (file.url) window.open(file.url, "_blank");
                      }}
                    >
                      <Paperclip size={14} className="flex-shrink-0" />
                      <span className="text-sm font-medium truncate max-w-[150px] md:max-w-[250px]">{file.name}</span>
                    </div>
                    <div className="w-[1px] h-4 bg-gray-200 flex-shrink-0"></div>
                    <span className="text-[12px] text-gray-500 flex-shrink-0">
                      Uploaded on: {file.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {doc.tin && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400">
                Submitted TIN:
              </p>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 p-2.5 rounded-md w-fit">
                <span className="text-sm font-medium text-gray-700">
                  {doc.tin}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(doc.tin!);
                    toast.success("Copied!");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          )}
        </Card>
      ))}

      <CustomModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Mark document as..."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="h-10 border-gray-200 rounded-md"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-10 px-8 bg-[#E86B35] hover:bg-[#d15d2c] text-white rounded-md flex items-center justify-center min-w-[100px]"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Mark{" "}
              <span className="font-bold">
                Sushi Place {selectedDoc?.title}
              </span>{" "}
              as..
            </p>
            <RadioGroup
              value={actionValue}
              onValueChange={(v) => setActionValue(v as "Approve" | "Reject")}
              className="space-y-3"
            >
              {["Approve", "Reject"].map((s) => (
                <div key={s} className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={s}
                    id={s}
                    className="border-gray-300 text-[#E86B35] focus:ring-[#E86B35]"
                  />
                  <Label
                    htmlFor={s}
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    {s}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {actionValue === "Reject" && (
            <div className="space-y-1.5">
              <Label className="text-sm font-normal text-gray-700">
                Message to Vendor <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={vendorMessage}
                onChange={(e) => {
                  setVendorMessage(e.target.value);
                  setErrors((p) => ({ ...p, message: "" }));
                }}
                className={cn(
                  "min-h-[100px] border-gray-200 rounded-md focus-visible:ring-[#E86B35]",
                  errors.message && "border-red-500",
                )}
                placeholder="Explain why the document was not verified..."
              />
              {errors.message && (
                <p className="text-xs text-red-500 font-medium">
                  {errors.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm font-normal text-gray-700">
              Internal Note <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={internalNote}
              onChange={(e) => {
                setInternalNote(e.target.value);
                setErrors((p) => ({ ...p, note: "" }));
              }}
              className={cn(
                "min-h-[100px] border-gray-200 rounded-md focus-visible:ring-[#E86B35]",
                errors.note && "border-red-500",
              )}
              placeholder="Briefly explain this update..."
            />
            {errors.note && (
              <p className="text-xs text-red-500 font-medium">{errors.note}</p>
            )}
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
