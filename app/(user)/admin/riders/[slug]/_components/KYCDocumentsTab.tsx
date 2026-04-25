"use client";

import React, { useState } from "react";
import { X, Paperclip, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  files?: { name: string; date: string }[];
  tin?: string;
}

export default function KYCDocumentsTab() {
  const [documents, setDocuments] = useState<KYCDocument[]>([
    {
      id: "cac",
      title: "CAC Documents",
      description: "Business registration verification (CAC)",
      status: "In Review",
      files: [
        { name: "document_001.png", date: "Aug 20, 2024 • 8:45 PM" },
        { name: "document_011.png", date: "Aug 20, 2024 • 8:45 PM" },
      ],
    },
    {
      id: "owner_id",
      title: "Owner/Signatory ID",
      description: "Business ownership/signature Id",
      status: "Pending Submission",
    },
    {
      id: "health_safety",
      title: "Food/Health Safety Certificate",
      description: "Business food/health certificate",
      status: "Rejected",
      files: [{ name: "document_001.png", date: "Aug 20, 2024 • 8:45 PM" }],
    },
    {
      id: "tin",
      title: "Tax Identification Number (TIN)",
      description: "Business tax identification number",
      status: "Verified",
      tin: "01234567896",
    },
  ]);

  const [selectedDoc, setSelectedDoc] = useState<KYCDocument | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Form State
  const [statusValue, setStatusValue] = useState<DocStatus>("Verified");
  const [vendorMessage, setVendorMessage] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [errors, setErrors] = useState<{ message?: string; note?: string }>({});

  const handleOpenModal = (doc: KYCDocument) => {
    setSelectedDoc(doc);
    setStatusValue(
      doc.status === "Pending Submission" ? "In Review" : doc.status,
    );
    setVendorMessage("");
    setInternalNote("");
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = () => {
    const newErrors: { message?: string; note?: string } = {};
    if (statusValue !== "Verified" && !vendorMessage.trim()) {
      newErrors.message = "Message to vendor is required";
    }
    if (!internalNote.trim()) {
      newErrors.note = "Internal note is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === selectedDoc?.id ? { ...d, status: statusValue } : d,
      ),
    );

    toast.success(`Document marked as ${statusValue}`);
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <Card
          key={doc.id}
          className="p-6 border-gray-100 shadow-none rounded-md"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{doc.title}</h3>
              <p className="text-sm text-gray-500">{doc.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "text-[12px] px-2.5 py-1 rounded-md font-medium",
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
                className="h-9 border-[#E86B35] text-[#E86B35] hover:bg-orange-50 font-semibold rounded-md"
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
                    className="flex items-center gap-4 bg-gray-50/50 border border-gray-100 p-2.5 rounded-md w-fit min-w-[340px]"
                  >
                    <div className="flex items-center gap-2 text-blue-500 hover:underline cursor-pointer">
                      <Paperclip size={14} />
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                    <span className="text-[12px] text-gray-400">
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
              className="h-10 px-8 bg-[#E86B35] hover:bg-[#d15d2c] text-white rounded-md"
            >
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
              value={statusValue}
              onValueChange={(v) => setStatusValue(v as DocStatus)}
              className="space-y-3"
            >
              {[
                "Verified",
                "Rejected",
                "Required",
                "In Review",
                "Incomplete",
              ].map((s) => (
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

          {statusValue !== "Verified" && (
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">
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
            <Label className="text-sm font-semibold text-gray-700">
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
