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
  Image as ImageIcon,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  description: string;
  parent: string;
  lastUpdated: string;
  image?: string | null;
}

export function ProductCategories() {
  const [categories, setCategories] = React.useState<Category[]>(
    Array.from({ length: 50 }, (_, i) => ({
      id: (i + 1).toString(),
      name:
        i % 3 === 0 ? "Beverages" : i % 3 === 1 ? "Snacks" : "Fresh Produce",
      description: `Description for category ${i + 1}`,
      parent: i % 5 === 0 ? "Drinks" : "-",
      lastUpdated: new Date(Date.now() - i * 3600000)
        .toString()
        .split(" GMT")[0],
      image: null,
    })),
  );

  // Pagination States
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const totalPages = Math.ceil(categories.length / itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(
          1,
          "...",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
    }
    return pages;
  };

  const currentItems = categories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Form States
  const [showModal, setShowModal] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [catName, setCatName] = React.useState("");
  const [catDesc, setCatDesc] = React.useState("");
  const [catParent, setCatParent] = React.useState("none");
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  // Inline Validation States
  const [errors, setErrors] = React.useState<{ name?: string; desc?: string }>(
    {},
  );

  // Delete States
  const [deleteModal, setDeleteModal] = React.useState<{
    show: boolean;
    id: string | null;
    name: string;
  }>({
    show: false,
    id: null,
    name: "",
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const resetForm = React.useCallback(() => {
    setCatName("");
    setCatDesc("");
    setCatParent("none");
    setPreviewUrl(null);
    setIsEditMode(false);
    setEditingId(null);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (category: Category) => {
    resetForm();
    setIsEditMode(true);
    setEditingId(category.id);
    setCatName(category.name);
    setCatDesc(category.description);
    setCatParent(
      category.parent === "-" ? "none" : category.parent.toLowerCase(),
    );
    setPreviewUrl(category.image || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    // Validate Inline instead of Toast
    const newErrors: { name?: string; desc?: string } = {};
    if (!catName.trim()) newErrors.name = "Category name is required";
    if (!catDesc.trim()) newErrors.desc = "Description is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const timestamp = new Date().toString().split(" GMT")[0];
      const categoryData = {
        name: catName,
        description: catDesc,
        parent:
          catParent === "none"
            ? "-"
            : catParent.charAt(0).toUpperCase() + catParent.slice(1),
        lastUpdated: timestamp,
        image: previewUrl,
      };

      if (isEditMode && editingId) {
        setCategories((prev) =>
          prev.map((c) => (c.id === editingId ? { ...c, ...categoryData } : c)),
        );
      } else {
        const newCat: Category = {
          id: Math.random().toString(36).substr(2, 9),
          ...categoryData,
        };
        setCategories((prev) => [newCat, ...prev]);
      }

      toast.success(isEditMode ? "Category updated" : "Category created");
      handleCloseModal();
    } catch (error) {
      // Logic for unexpected errors if necessary
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    setCategories((prev) => prev.filter((c) => c.id !== deleteModal.id));
    toast.success(`Category "${deleteModal.name}" deleted successfully`);
    if (currentItems.length === 1 && currentPage > 1)
      setCurrentPage(currentPage - 1);
    setDeleteModal({ show: false, id: null, name: "" });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative">
      {/* Header */}
      <div className="flex items-start justify-between mt-5">
        <div className="px-0 pt-0">
          <h1 className="text-2xl font-bold text-slate-900">
            Product Categories
          </h1>
          <p className="text-slate-500 mt-1">
            Manage product categories that vendors use to organize their
            products.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-[#E86B35] hover:bg-[#d45a2a] text-white gap-2 h-11 px-6 rounded-md font-semibold"
        >
          <Plus size={18} /> Add New Category
        </Button>
      </div>

      <Card className="border border-slate-200 shadow-none rounded-xl overflow-hidden mt-15 bg-white">
        <div className="overflow-x-auto min-h-[550px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 w-24">Image</th>
                <th className="px-6 py-4">Category Name</th>
                <th className="px-6 py-4">Parent Category</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4 text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentItems.map((cat) => (
                <tr
                  key={cat.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-3">
                    <div className="h-10 w-10 rounded-md bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon size={18} className="text-slate-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">
                    {cat.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{cat.parent}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {cat.lastUpdated}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteModal({
                            show: true,
                            id: cat.id,
                            name: cat.name,
                          })
                        }
                        className="p-2 hover:bg-red-50 rounded-md text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="flex items-center justify-center gap-6 text-sm border-t pt-6 pb-6 bg-white">
          <p className="text-gray-500">
            Total{" "}
            <span className="text-gray-900 font-medium">
              {categories.length} items
            </span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft size={18} />
            </Button>
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, i) => (
                <Button
                  key={i}
                  variant={currentPage === page ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 w-8 rounded font-medium",
                    currentPage === page
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "text-gray-500",
                  )}
                  onClick={() =>
                    typeof page === "number" && setCurrentPage(page)
                  }
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight size={18} />
            </Button>
          </div>
          <Select
            value={`${itemsPerPage}`}
            onValueChange={(v) => {
              setItemsPerPage(Number(v));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[110px] h-10 bg-gray-50 border-gray-200 text-xs font-medium rounded">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCloseModal}
          />
          <div className="relative bg-white w-full max-w-[580px] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex bg-gray-50 items-center justify-between p-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                {isEditMode
                  ? "Edit Product Category"
                  : "Create Product Category"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto text-slate-700">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Category Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    if (errors.name)
                      setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="e.g. Beverages"
                  className={cn(
                    "h-12 border-slate-200",
                    errors.name && "border-red-500 focus-visible:ring-red-500",
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
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={catDesc}
                  onChange={(e) => {
                    setCatDesc(e.target.value);
                    if (errors.desc)
                      setErrors((prev) => ({ ...prev, desc: undefined }));
                  }}
                  placeholder="Description..."
                  className={cn(
                    "min-h-[100px] border-slate-200 resize-none",
                    errors.desc && "border-red-500 focus-visible:ring-red-500",
                  )}
                />
                {errors.desc && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.desc}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Category Image</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed border-slate-200 rounded-lg transition-all cursor-pointer group relative overflow-hidden",
                    previewUrl
                      ? "p-2 min-h-[180px]"
                      : "p-10 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50",
                  )}
                >
                  {previewUrl ? (
                    <div className="relative w-full h-full rounded-md overflow-hidden">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-[180px] object-cover rounded-md"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeImage}
                          className="gap-2"
                        >
                          <Trash2 size={14} /> Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-slate-200 p-3 rounded-md mb-4 text-slate-500 group-hover:bg-slate-300 transition-colors">
                        <ImageIcon size={24} />
                      </div>
                      <p className="text-sm text-slate-600">
                        <span className="text-blue-500 font-bold underline">
                          Click here
                        </span>{" "}
                        to upload file
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Parent Category</Label>
                <Select value={catParent} onValueChange={setCatParent}>
                  <SelectTrigger className="h-12! w-full border-slate-200">
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="drinks">Drinks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end items-center gap-3 p-6 py-3 bg-gray-50 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                className="px-8 h-10 border-slate-300 text-slate-600 font-semibold bg-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-10 h-10 bg-[#E86B35] hover:bg-[#d45a2a] text-white font-semibold"
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isEditMode ? (
                  "Save Changes"
                ) : (
                  "Create Category"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDeleteModal({ ...deleteModal, show: false })}
          />
          <div className="relative bg-white w-full max-w-[400px] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Delete Category
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-700">
                  "{deleteModal.name}"
                </span>
                ?
              </p>
            </div>
            <div className="flex justify-center gap-3 p-6 py-4 bg-gray-50 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() =>
                  setDeleteModal({ show: false, id: null, name: "" })
                }
                className="flex-1 h-10 border-slate-300 text-slate-600 font-semibold bg-white"
              >
                No, Keep it
              </Button>
              <Button
                onClick={handleDelete}
                className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
