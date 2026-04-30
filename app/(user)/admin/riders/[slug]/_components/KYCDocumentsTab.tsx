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

type DocStatus = "Verified" | "Rejected" | "Required" | "In Review" | "Incomplete" | "Pending Submission";

export default function KYCDocumentsTab({ riderId }: { riderId: string }) {
  const [documents, setDocuments] = useState([
    {
      id: "photo",
      title: "Vehicle Photo",
      description: "Clear photo of the rider's vehicle.",
      status: "Pending Submission" as DocStatus,
      files: [
        { name: "front_view.png", date: "Aug 20, 2024 • 8:45 PM" },
        { name: "side_view.png", date: "Aug 20, 2024 • 8:45 PM" },
        { name: "rear_view.png", date: "Aug 20, 2024 • 8:45 PM" },
      ],
    },
    {
      id: "docs",
      title: "Vehicle Documents",
      description: "All required vehicle documents",
      status: "Rejected" as DocStatus,
      files: [
        { name: "document_001.png", date: "Aug 20, 2024 • 8:45 PM" },
        { name: "document_001.png", date: "Aug 20, 2024 • 8:45 PM" },
      ],
    }
  ]);

  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusValue, setStatusValue] = useState<DocStatus>("Incomplete");
  const [vendorMessage, setVendorMessage] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const handleOpenModal = (doc: any) => {
    setSelectedDoc(doc);
    setStatusValue(doc.status === "Pending Submission" ? "In Review" : doc.status);
    setVendorMessage("");
    setInternalNote("");
    setIsModalOpen(true);
  };

  const handleSave = () => {
    setDocuments(prev => prev.map(d => d.id === selectedDoc.id ? { ...d, status: statusValue } : d));
    toast.success("Document status updated");
    setIsModalOpen(false);
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
            { label: "Vehicle Type", value: "Motocycle" },
            { label: "Vehicle Make", value: "Toyota" },
            { label: "License Plate Number", value: "AD-1450 MM" },
            { label: "Phone Line 1", value: "+123 456 7898" },
            { label: "Phone Line 2", value: "+123 456 7898" },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-[11px] tracking-wider text-gray-400 font-bold mb-2 uppercase">
                {item.label}
              </p>
              <p className="text-sm font-bold text-gray-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Document Cards */}
      {documents.map((doc) => (
        <Card key={doc.id} className="p-6 border border-gray-100 shadow-sm rounded-xl bg-white">
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">{doc.title}</h3>
              <p className="text-sm text-gray-400 font-medium">{doc.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={cn(
                "border-none px-3 py-1 rounded-md text-[10px] font-bold transition-colors",
                doc.status === "Pending Submission" ? "bg-blue-50 text-blue-500" : 
                doc.status === "Rejected" ? "bg-red-50 text-red-500" :
                doc.status === "Verified" ? "bg-green-50 text-green-500" :
                doc.status === "Incomplete" ? "bg-orange-50 text-orange-500" : "bg-gray-50 text-gray-500"
              )}>
                {doc.status}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-[#E86B35] text-[#E86B35] hover:bg-orange-50 font-bold rounded-md px-4"
                onClick={() => handleOpenModal(doc)}
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
              {doc.files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-6 bg-[#F9FAFB] border border-gray-100 p-2.5 rounded-lg w-fit min-w-[400px]"
                >
                  <div className="flex items-center gap-2 text-blue-500 hover:underline cursor-pointer">
                    <Paperclip size={14} className="text-gray-400" />
                    <span className="text-xs font-bold">{file.name}</span>
                  </div>
                  <div className="w-[1px] h-3 bg-gray-200" />
                  <span className="text-[10px] text-gray-400 font-medium">
                    Uploaded on: {file.date}
                  </span>
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
              className="h-10 rounded-md bg-[#E86B35] hover:bg-[#d15d2c] text-white font-bold px-8"
            >
              Submit
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-700">
            Mark <span className="font-bold">James Lanko {selectedDoc?.title}</span> as..
          </p>

          <RadioGroup value={statusValue} onValueChange={(v) => setStatusValue(v as DocStatus)} className="space-y-4">
            {["Verified", "Rejected", "Required", "In Review", "Incomplete"].map((s) => (
              <div key={s} className="flex items-center space-x-3">
                <RadioGroupItem value={s} id={s} className="border-gray-300 text-[#E86B35]" />
                <Label htmlFor={s} className="text-sm font-bold text-gray-700 cursor-pointer">{s}</Label>
              </div>
            ))}
          </RadioGroup>

          {statusValue !== "Verified" && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">
                Message to Vendor <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder={statusValue === "Incomplete" ? "This message will be included in the email sent to the vendor. e.g. The CAC document uploaded is incomplete. Please provide the full registration certificate showing the company name and RC number." : "Explain why the document was not verified..."}
                value={vendorMessage}
                onChange={(e) => setVendorMessage(e.target.value)}
                className="min-h-[120px] border-gray-200 rounded-lg text-sm placeholder:text-gray-400 italic"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">
              Internal Note <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder={statusValue === "Incomplete" ? "For internal records. Not visible to the vendor. Briefly explain why you’re updating James Lanko's CAC documents" : "Briefly explain this update..."}
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              className="min-h-[120px] border-gray-200 rounded-lg text-sm placeholder:text-gray-400 italic"
            />
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
