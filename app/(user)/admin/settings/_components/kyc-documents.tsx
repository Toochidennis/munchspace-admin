"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  X,
  Plus,
  Edit2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MinusCircle,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface KYCDocument {
  id: string;
  name: string;
  type: string;
  target: "vendors" | "delivery";
  required: boolean;
  lastUpdated: string;
  shortDescription: string;
  customerInstructions: string;
  docCount: number;
}

export default function KYCDocumentsPage() {
  const [activeTab, setActiveTab] = React.useState<string>("vendors");

  const [documents, setDocuments] = React.useState<KYCDocument[]>([
    {
      id: "1",
      name: "Business Registration Certificate",
      type: "Image Upload",
      target: "vendors",
      required: true,
      lastUpdated: "Tue Dec 03 2024 14:42:24",
      shortDescription: "Used to verify business ownership and legal status.",
      customerInstructions:
        "Upload a clear, full-page image of your CAC or equivalent.",
      docCount: 1,
    },
    {
      id: "2",
      name: "Tax Identification Number (TIN)",
      type: "Text Entry",
      target: "vendors",
      required: true,
      lastUpdated: "Wed Dec 04 2024 09:15:00",
      shortDescription: "Official tax registration number.",
      customerInstructions:
        "Enter your 10 or 12 digit TIN as issued by the authorities.",
      docCount: 1,
    },
    {
      id: "3",
      name: "Store Front Photo",
      type: "Image Upload",
      target: "vendors",
      required: false,
      lastUpdated: "Thu Dec 05 2024 11:20:00",
      shortDescription: "Visual verification of the physical location.",
      customerInstructions:
        "Take a photo showing the store name and entrance clearly.",
      docCount: 2,
    },
    {
      id: "4",
      name: "Utility Bill",
      type: "Image Upload",
      target: "vendors",
      required: true,
      lastUpdated: "Fri Dec 06 2024 10:00:00",
      shortDescription: "Proof of business address.",
      customerInstructions:
        "Must be from the last 3 months (Electricity, Water, or Waste).",
      docCount: 1,
    },
    {
      id: "5",
      name: "Driver's License",
      type: "Image Upload",
      target: "delivery",
      required: true,
      lastUpdated: "Fri Dec 06 2024 14:42:24",
      shortDescription: "Valid government-issued driving permit.",
      customerInstructions:
        "Ensure both the front and back of the license are captured.",
      docCount: 2,
    },
    {
      id: "6",
      name: "Vehicle Insurance",
      type: "PDF Document",
      target: "delivery",
      required: true,
      lastUpdated: "Sat Dec 07 2024 10:30:00",
      shortDescription: "Proof of active insurance for the registered vehicle.",
      customerInstructions:
        "Upload the digital PDF certificate provided by your insurer.",
      docCount: 1,
    },
    {
      id: "7",
      name: "Guarantor Form",
      type: "Image Upload",
      target: "delivery",
      required: true,
      lastUpdated: "Sun Dec 08 2024 16:00:00",
      shortDescription: "Signed document from a verified guarantor.",
      customerInstructions:
        "Download the template, fill it, and upload a scanned copy.",
      docCount: 1,
    },
    {
      id: "8",
      name: "Proof of Residence",
      type: "Image Upload",
      target: "delivery",
      required: true,
      lastUpdated: "Mon Dec 09 2024 09:00:00",
      shortDescription: "Verified home address documentation.",
      customerInstructions:
        "Upload a recent utility bill or tenancy agreement.",
      docCount: 1,
    },
  ]);

  const filteredDocs = documents.filter((doc) => doc.target === activeTab);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
  const currentItems = filteredDocs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const [showModal, setShowModal] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [deleteDialog, setDeleteDialog] = React.useState<{
    show: boolean;
    id: string | null;
    name: string;
  }>({
    show: false,
    id: null,
    name: "",
  });

  const [formData, setFormData] = React.useState({
    target: "vendors",
    type: "Image Upload",
    name: "",
    shortDesc: "",
    instructions: "",
    count: "1",
    isRequired: true,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Document name is required";
    if (!formData.shortDesc.trim())
      newErrors.shortDesc = "Short description is required";
    if (!formData.instructions.trim())
      newErrors.instructions = "Customer instructions are required";
    if (!formData.count || parseInt(formData.count) < 1)
      newErrors.count = "Must be at least 1";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenEdit = (doc: KYCDocument) => {
    setIsEditMode(true);
    setEditingId(doc.id);
    setFormData({
      target: doc.target,
      type: doc.type,
      name: doc.name,
      shortDesc: doc.shortDescription,
      instructions: doc.customerInstructions,
      count: doc.docCount.toString(),
      isRequired: doc.required,
    });
    setShowModal(true);
  };

  const confirmDelete = (doc: KYCDocument) => {
    setDeleteDialog({ show: true, id: doc.id, name: doc.name });
  };

  const executeDelete = () => {
    if (deleteDialog.id) {
      setDocuments((prev) => prev.filter((doc) => doc.id !== deleteDialog.id));
      toast.success(`Document requirement removed`);
      setDeleteDialog({ show: false, id: null, name: "" });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const timestamp = new Date().toLocaleString();

      if (isEditMode && editingId) {
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === editingId
              ? {
                  ...doc,
                  name: formData.name,
                  type: formData.type,
                  target: formData.target as "vendors" | "delivery",
                  required: formData.isRequired,
                  shortDescription: formData.shortDesc,
                  customerInstructions: formData.instructions,
                  docCount: parseInt(formData.count),
                  lastUpdated: timestamp,
                }
              : doc,
          ),
        );
        toast.success("Document updated successfully");
      } else {
        const newDoc: KYCDocument = {
          id: Math.random().toString(36).substr(2, 9),
          name: formData.name,
          type: formData.type,
          target: formData.target as "vendors" | "delivery",
          required: formData.isRequired,
          lastUpdated: timestamp,
          shortDescription: formData.shortDesc,
          customerInstructions: formData.instructions,
          docCount: parseInt(formData.count),
        };
        setDocuments([newDoc, ...documents]);
        toast.success("Document requirement created");
      }
      closeModal();
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setEditingId(null);
    setErrors({});
    setFormData({
      target: activeTab === "vendors" ? "vendors" : "delivery",
      type: "Image Upload",
      name: "",
      shortDesc: "",
      instructions: "",
      count: "1",
      isRequired: true,
    });
  };

  // CLEAN TAB STYLE: restaured to your exact specification
  const tabTriggerClass = cn(
    "rounded-none border-0 border-b-3 border-transparent bg-transparent px-2 pb-1 font-semibold shadow-none transition-all",
    "data-[state=active]:border-[#E86B35] data-[state=active]:text-[#E86B35] data-[state=active]:bg-transparent data-[state=active]:shadow-none",
    "hover:text-[#E86B35]/70",
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Customer Documents
          </h1>
          <p className="text-slate-500 mt-1">
            Manage document requirements for vendors and delivery agents.
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-[#E86B35] hover:bg-[#d45a2a] text-white gap-2 h-11 px-6 rounded-md font-semibold"
        >
          <Plus size={18} /> Add New Document
        </Button>
      </div>

      <Card className="border border-slate-200 shadow-none rounded-xl overflow-hidden bg-white">
        <div className="p-4 border-b border-slate-100">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v);
              setCurrentPage(1);
            }}
            className="w-full border-b"
          >
            <TabsList className="bg-white rounded-none shadow-none h-auto p-0 gap-8">
              <TabsTrigger value="vendors" className={tabTriggerClass}>
                Vendors
              </TabsTrigger>
              <TabsTrigger value="delivery" className={tabTriggerClass}>
                Delivery Agents
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Document Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Required</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {currentItems.length > 0 ? (
                currentItems.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">{doc.name}</td>
                    <td className="px-6 py-4 text-slate-500">{doc.type}</td>
                    <td className="px-6 py-4">{doc.required ? "Yes" : "No"}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                      {doc.lastUpdated}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(doc)}
                          className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => confirmDelete(doc)}
                          className="p-2 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <MinusCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-20 text-center text-slate-400"
                  >
                    No documents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center gap-6 py-6 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            {totalPages > 0 &&
              Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    className={cn(
                      "h-8 w-8 text-xs font-medium",
                      currentPage === page
                        ? "bg-[#E86B35] text-white hover:bg-[#d45a2a]"
                        : "text-slate-500 hover:bg-slate-100",
                    )}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ),
              )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={closeModal}
          />
          <div className="relative bg-white w-full max-w-[620px] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                {isEditMode
                  ? "Edit Document Requirement"
                  : "New Document Requirement"}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              <p className="text-sm text-slate-500 leading-relaxed">
                Use this form to define documents users must submit for
                verification. The document name and instructions will be shown
                to customers during upload.
              </p>

              <Tabs
                value={formData.target}
                onValueChange={(v) => handleInputChange("target", v)}
                className="w-full border-b"
              >
                <TabsList className="bg-white rounded-none justify-start h-auto p-0 gap-6">
                  <TabsTrigger value="vendors" className={tabTriggerClass}>
                    Vendors
                  </TabsTrigger>
                  <TabsTrigger value="delivery" className={tabTriggerClass}>
                    Delivery Agents
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-2 pt-2">
                <Label className="text-sm font-semibold">
                  Document Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => handleInputChange("type", v)}
                >
                  <SelectTrigger className="h-12! w-full border-slate-200 focus:ring-orange-500 focus:border-[#E86B35]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Image Upload">Image Upload</SelectItem>
                    <SelectItem value="Text Entry">Text Entry</SelectItem>
                    <SelectItem value="PDF Document">PDF Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Document Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Bank Statement"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={cn(
                    "h-12 border-slate-200 focus-visible:ring-0 focus-visible:border-[#E86B35]",
                    errors.name && "border-red-500",
                  )}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Short Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  placeholder="e.g. Used to verify business ownership."
                  value={formData.shortDesc}
                  onChange={(e) =>
                    handleInputChange("shortDesc", e.target.value)
                  }
                  className={cn(
                    "min-h-[100px] border-slate-200 resize-none focus-visible:ring-0 focus-visible:border-[#E86B35]",
                    errors.shortDesc && "border-red-500",
                  )}
                />
                {errors.shortDesc && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.shortDesc}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Customer Instructions <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  placeholder="e.g. Upload a clear, full-page image."
                  value={formData.instructions}
                  onChange={(e) =>
                    handleInputChange("instructions", e.target.value)
                  }
                  className={cn(
                    "min-h-[100px] border-slate-200 resize-none focus-visible:ring-0 focus-visible:border-[#E86B35]",
                    errors.instructions && "border-red-500",
                  )}
                />
                {errors.instructions && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.instructions}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Number of Documents Required{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={formData.count}
                  onChange={(e) => handleInputChange("count", e.target.value)}
                  className={cn(
                    "h-12 border-slate-200 focus-visible:ring-0 focus-visible:border-[#E86B35]",
                    errors.count && "border-red-500",
                  )}
                />
                {errors.count && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.count}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 mt-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900">
                    Required Document
                  </p>
                  <p className="text-xs text-slate-500">
                    Must submit this document before proceeding.
                  </p>
                </div>
                <Switch
                  checked={formData.isRequired}
                  onCheckedChange={(v) => handleInputChange("isRequired", v)}
                  className="data-[state=checked]:bg-[#E86B35]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 py-4 bg-gray-50 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={closeModal}
                className="h-11 px-8 border-slate-300 bg-white font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="h-11 px-8 bg-[#E86B35] hover:bg-[#d45a2a] text-white font-semibold min-w-[160px]"
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isEditMode ? (
                  "Save Changes"
                ) : (
                  "Create Document"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteDialog.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteDialog({ ...deleteDialog, show: false })}
          />
          <div className="relative bg-white w-full max-w-[420px] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Delete Requirement
              </h3>
              <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                Are you sure you want to remove{" "}
                <span className="font-bold text-slate-800">
                  "{deleteDialog.name}"
                </span>
                ?
              </p>
            </div>
            <div className="flex gap-3 p-6 py-4 bg-gray-50 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() =>
                  setDeleteDialog({ show: false, id: null, name: "" })
                }
                className="flex-1 h-11 border-slate-300 text-slate-600 font-semibold bg-white hover:bg-slate-50"
              >
                Keep it
              </Button>
              <Button
                onClick={executeDelete}
                className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
