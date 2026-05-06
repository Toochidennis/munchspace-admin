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
import { authenticatedFetch, parseApiResponse } from "@/lib/api";

interface KYCDocument {
  id: string;
  key: string;
  label: string;
  shortDescription: string;
  description: string;
  entityType: "vendor" | "business" | "rider";
  inputType: "file" | "text";
  isRequired: boolean;
  isActive: boolean;
  updatedAt: string;
}

export default function KYCDocumentsPage() {
  const [activeTab, setActiveTab] = React.useState<string>("vendor");
  const [documents, setDocuments] = React.useState<KYCDocument[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  const [showModal, setShowModal] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [formData, setFormData] = React.useState({
    entityType: "vendor",
    inputType: "file",
    title: "",
    shortDescription: "",
    description: "",
    isRequired: true,
  });

  const fetchDocuments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authenticatedFetch(
        `/admin/settings/documents?page=${currentPage}&limit=10&entityType=${activeTab}`,
      );
      const result = await parseApiResponse(res);
      if (result?.success) {
        setDocuments(result.data.data);
        const meta = result.data.meta;
        setTotalPages(
          meta.totalPages || Math.ceil(meta.total / meta.limit) || 1,
        );
      }
    } catch (error) {
      toast.error("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, currentPage]);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

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

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, isActive: !currentStatus } : doc,
      ),
    );

    try {
      const res = await authenticatedFetch(
        `/admin/settings/documents/${id}/toggle`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive: !currentStatus }),
        },
      );
      const result = await parseApiResponse(res);
      if (!result?.success) {
        // Rollback
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === id ? { ...doc, isActive: currentStatus } : doc,
          ),
        );
        toast.error(result?.message || "Failed to update status");
      } else {
        toast.success(
          `Document requirement ${!currentStatus ? "enabled" : "disabled"}`,
        );
      }
    } catch (error) {
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === id ? { ...doc, isActive: currentStatus } : doc,
        ),
      );
      toast.error("An error occurred while updating status");
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Document title is required";
    if (!formData.shortDescription.trim())
      newErrors.shortDescription = "Short description is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenEdit = (doc: KYCDocument) => {
    setIsEditMode(true);
    setEditingId(doc.id);
    setFormData({
      entityType: doc.entityType,
      inputType: doc.inputType,
      title: doc.label || "",
      shortDescription: doc.shortDescription,
      description: doc.description,
      isRequired: doc.isRequired,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const method = isEditMode ? "PATCH" : "POST";
      const url = isEditMode
        ? `/admin/settings/documents/${editingId}`
        : "/admin/settings/documents";

      const payload = {
        entityType: formData.entityType,
        inputType: formData.inputType,
        title: formData.title,
        shortDescription: formData.shortDescription,
        description: formData.description,
        isRequired: formData.isRequired,
      };

      const res = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const result = await parseApiResponse(res);
      if (result?.success) {
        toast.success(
          isEditMode ? "Document updated" : "Document requirement created",
        );
        closeModal();
        fetchDocuments();
      } else {
        toast.error(result?.message || "Failed to save document");
      }
    } catch (error) {
      toast.error("An error occurred");
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
      entityType: activeTab as any,
      inputType: "file",
      title: "",
      shortDescription: "",
      description: "",
      isRequired: true,
    });
  };

  const tabTriggerClass = cn(
    "rounded-none border-0 border-b-3 border-transparent bg-transparent px-2 pb-1 font-semibold shadow-none transition-all",
    "data-[state=active]:border-[#E86B35] data-[state=active]:text-[#E86B35] data-[state=active]:bg-transparent data-[state=active]:shadow-none",
    "hover:text-[#E86B35]/70",
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Customer Documents
          </h1>
          <p className="text-slate-500 mt-1">
            Manage document requirements for vendors, businesses, and riders.
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
              <TabsTrigger value="vendor" className={tabTriggerClass}>
                Vendors
              </TabsTrigger>
              <TabsTrigger value="business" className={tabTriggerClass}>
                Business
              </TabsTrigger>
              <TabsTrigger value="rider" className={tabTriggerClass}>
                Riders
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-[400px]">
              <Loader2 className="animate-spin text-[#E86B35]" size={32} />
            </div>
          ) : (
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
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold">{doc.label}</td>
                      <td className="px-6 py-4 text-slate-500 capitalize">
                        {doc.inputType}
                      </td>
                      <td className="px-6 py-4">
                        {doc.isRequired ? "Yes" : "No"}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                        {new Date(doc.updatedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              {doc.isActive ? "Active" : "Inactive"}
                            </span>
                            <Switch
                              checked={doc.isActive}
                              onCheckedChange={() =>
                                handleToggleActive(doc.id, doc.isActive)
                              }
                              className="data-[state=checked]:bg-[#E86B35]"
                            />
                          </div>
                          <button
                            onClick={() => handleOpenEdit(doc)}
                            className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <Edit2 size={16} />
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
          )}
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
                      "h-8 w-8 text-xs font-semibold",
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
              <h2 className="text-lg font-semibold text-slate-900">
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
              <Tabs
                value={formData.entityType}
                onValueChange={(v) => handleInputChange("entityType", v)}
                className="w-full border-b"
              >
                <TabsList className="bg-white rounded-none justify-start h-auto p-0 gap-6">
                  <TabsTrigger value="vendor" className={tabTriggerClass}>
                    Vendors
                  </TabsTrigger>
                  <TabsTrigger value="business" className={tabTriggerClass}>
                    Business
                  </TabsTrigger>
                  <TabsTrigger value="rider" className={tabTriggerClass}>
                    Riders
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-2 pt-2">
                <Label className="text-sm font-semibold">
                  Input Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.inputType}
                  onValueChange={(v) => handleInputChange("inputType", v)}
                >
                  <SelectTrigger className="h-12 w-full border-slate-200 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="file">File/Image Upload</SelectItem>
                    <SelectItem value="text">Text Entry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Document Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. CAC Certificate"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={cn(
                    "h-12 border-slate-200 focus-visible:ring-0 focus-visible:border-[#E86B35]",
                    errors.title && "border-red-500",
                  )}
                />
                {errors.title && (
                  <p className="text-xs text-red-500 font-semibold">
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Short Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  placeholder="e.g. Used to verify business ownership."
                  value={formData.shortDescription}
                  onChange={(e) =>
                    handleInputChange("shortDescription", e.target.value)
                  }
                  className={cn(
                    "min-h-[80px] border-slate-200 resize-none focus-visible:ring-0 focus-visible:border-[#E86B35]",
                    errors.shortDescription && "border-red-500",
                  )}
                />
                {errors.shortDescription && (
                  <p className="text-xs text-red-500 font-semibold">
                    {errors.shortDescription}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Customer Instructions <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  placeholder="e.g. Upload your CAC registration certificate"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className={cn(
                    "min-h-[100px] border-slate-200 resize-none focus-visible:ring-0 focus-visible:border-[#E86B35]",
                    errors.description && "border-red-500",
                  )}
                />
                {errors.description && (
                  <p className="text-xs text-red-500 font-semibold">
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-slate-900">
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
                className="h-11 px-8 border-slate-300 bg-white font-medium text-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="h-11 px-8 bg-[#E86B35] hover:bg-[#d45a2a] text-white font-medium min-w-[160px]"
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
    </div>
  );
}
