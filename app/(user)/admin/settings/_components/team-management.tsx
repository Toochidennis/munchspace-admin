"use client";

import * as React from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const INITIAL_TEAM = Array.from({ length: 85 }, (_, i) => ({
  id: i + 1,
  firstName: [
    "Lela",
    "Rex",
    "Teresa",
    "Sammuel",
    "Beth",
    "Johnnie",
    "Candace",
    "Blake",
    "Levi",
    "John",
  ][i % 10],
  lastName: [
    "Mraz",
    "Rowe",
    "Hane",
    "Kirlin",
    "Fritsch",
    "Beahan",
    "Hilpert",
    "Legros",
    "Orn",
    "Marsh",
  ][i % 10],
  role:
    i % 3 === 0 ? "Admin" : i % 3 === 1 ? "Vendor Manager" : "Order Manager",
  workEmail: `work${i + 1}@munchspace.com`,
  personalEmail: `user${i + 1}@gmail.com`,
  phone: "080 1244 7851",
  lastLoggedIn: "Tue Dec 03 2024 14:42:24",
}));

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

export function TeamManagement() {
  const [members, setMembers] = React.useState(INITIAL_TEAM);
  const [search, setSearch] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  const [isNewModalOpen, setIsNewModalOpen] = React.useState(false);
  const [editMember, setEditMember] = React.useState<any>(null);
  const [deleteMember, setDeleteMember] = React.useState<any>(null);
  const [showInfo, setShowInfo] = React.useState(true);

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [newMemberData, setNewMemberData] = React.useState({
    firstName: "",
    lastName: "",
    workEmail: "",
    personalEmail: "",
    phone: "",
    role: "",
  });

  const validate = (data: any) => {
    const newErrors: Record<string, string> = {};
    if (!data.firstName) newErrors.firstName = "First name is required";
    if (!data.lastName) newErrors.lastName = "Last name is required";
    if (!data.workEmail) newErrors.workEmail = "Work email is required";
    if (!data.role) newErrors.role = "Role is required";
    return newErrors;
  };

  const handleCreate = () => {
    const formErrors = validate(newMemberData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    setMembers([
      { ...newMemberData, id: Date.now(), lastLoggedIn: "Never" } as any,
      ...members,
    ]);
    setIsNewModalOpen(false);
    setErrors({});
  };

  const handleUpdate = () => {
    const formErrors = validate(editMember);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    setMembers(members.map((m) => (m.id === editMember.id ? editMember : m)));
    setEditMember(null);
    setErrors({});
  };

  const filteredMembers = members.filter(
    (m) =>
      `${m.firstName} ${m.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      m.workEmail.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const currentData = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) for (let i = 1; i <= totalPages; i++) pages.push(i);
    else {
      if (currentPage <= 4) pages.push(1, 2, 3, 4, 5, "...", totalPages);
      else if (currentPage >= totalPages - 3)
        pages.push(
          1,
          "...",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      else
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
    return pages;
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-medium">Team Management</CardTitle>
          <CardDescription>
            Add, remove or update team members roles.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-8 bg-white rounded border mt-6 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="relative w-96">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              placeholder="Search"
              className="pl-10 h-12 bg-gray-50 rounded"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <Button
            onClick={() => {
              setErrors({});
              setIsNewModalOpen(true);
            }}
            className="bg-munchprimary hover:bg-munchprimaryDark text-white h-12 px-6 rounded gap-2"
          >
            <Plus size={18} /> New Member
          </Button>
        </div>

        <div className="overflow-hidden rounded border border-gray-100 mb-8">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="text-xs font-bold py-4">
                  Role
                </TableHead>
                <TableHead className="text-xs font-bold py-4">
                  Email Address
                </TableHead>
                <TableHead className="text-xs font-bold py-4">
                  Name
                </TableHead>
                <TableHead className="text-xs font-bold py-4">
                  Last Logged In
                </TableHead>
                <TableHead className="w-16 text-center text-xs font-bold py-4">
                  -
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((m) => (
                <TableRow key={m.id} className="h-16">
                  <TableCell>
                    <span
                      className={cn(
                        "px-3 py-1 rounded text-[10px] font-bold text-white",
                        m.role === "Admin"
                          ? "bg-purple-900"
                          : m.role === "Vendor Manager"
                            ? "bg-blue-900"
                            : "bg-green-700",
                      )}
                    >
                      {m.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {m.workEmail}
                  </TableCell>
                  <TableCell className="text-gray-900 font-medium text-sm">
                    {m.firstName} {m.lastName}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {m.lastLoggedIn}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded text-gray-400"
                        onClick={() => {
                          setErrors({});
                          setEditMember(m);
                        }}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded text-munchred"
                        onClick={() => setDeleteMember(m)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION SECTION */}
        <div className="flex items-center justify-center gap-6 text-sm border-t pt-6">
          <p className="text-gray-500">
            Total{" "}
            <span className="text-gray-900 font-medium">
              {filteredMembers.length} items
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
      </CardContent>

      {/* NEW MEMBER MODAL */}
      <CustomModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="New member"
        footer={
          <>
            <Button
              variant="outline"
              className="px-8 rounded h-11"
              onClick={() => setIsNewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-munchprimary hover:bg-munchprimaryDark text-white px-8 rounded h-11"
              onClick={handleCreate}
            >
              Add new member
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                First name <span className="text-red-500">*</span>
              </Label>
              <Input
                className={cn(
                  "rounded h-12",
                  errors.firstName && "border-red-500",
                )}
                placeholder="Input text"
                value={newMemberData.firstName}
                onChange={(e) =>
                  setNewMemberData({
                    ...newMemberData,
                    firstName: e.target.value,
                  })
                }
              />
              {errors.firstName && (
                <p className="text-[10px] text-red-500 font-bold">
                  {errors.firstName}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Last name <span className="text-red-500">*</span>
              </Label>
              <Input
                className={cn(
                  "rounded h-12",
                  errors.lastName && "border-red-500",
                )}
                placeholder="Input text"
                value={newMemberData.lastName}
                onChange={(e) =>
                  setNewMemberData({
                    ...newMemberData,
                    lastName: e.target.value,
                  })
                }
              />
              {errors.lastName && (
                <p className="text-[10px] text-red-500 font-bold">
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Work email <span className="text-red-500">*</span>
              </Label>
              <Input
                className={cn(
                  "rounded h-12",
                  errors.workEmail && "border-red-500",
                )}
                placeholder="Input text"
                value={newMemberData.workEmail}
                onChange={(e) =>
                  setNewMemberData({
                    ...newMemberData,
                    workEmail: e.target.value,
                  })
                }
              />
              {errors.workEmail && (
                <p className="text-[10px] text-red-500 font-bold">
                  {errors.workEmail}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Personal email</Label>
              <Input
                className="rounded h-12"
                placeholder="Input text"
                value={newMemberData.personalEmail}
                onChange={(e) =>
                  setNewMemberData({
                    ...newMemberData,
                    personalEmail: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Phone number</Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-gray-50 border rounded text-sm text-gray-500 h-12">
                  +234
                </div>
                <Input
                  className="rounded flex-1 h-12"
                  placeholder="080"
                  value={newMemberData.phone}
                  onChange={(e) =>
                    setNewMemberData({
                      ...newMemberData,
                      phone: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(v) =>
                  setNewMemberData({ ...newMemberData, role: v })
                }
              >
                <SelectTrigger
                  className={cn(
                    "rounded h-12! w-full",
                    errors.role && "border-red-500",
                  )}
                >
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Vendor Manager">Vendor Manager</SelectItem>
                  <SelectItem value="Order Manager">Order Manager</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-[10px] text-red-500 font-bold">
                  {errors.role}
                </p>
              )}
            </div>
          </div>
          {showInfo && (
            <div className="bg-blue-50 p-4 rounded flex gap-3 border border-blue-100 relative">
              <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white text-[10px] font-bold">i</span>
              </div>
              <p className="text-[13px] text-blue-800 pr-6 leading-relaxed">
                Once the member is added, they will receive an email invitation
                containing a temporary password. They will be required to change
                this password upon their first login for security purposes.
              </p>
              <X
                className="h-4 w-4 text-blue-400 absolute right-3 top-3 cursor-pointer"
                onClick={() => setShowInfo(false)}
              />
            </div>
          )}
        </div>
      </CustomModal>

      {/* EDIT MEMBER MODAL */}
      <CustomModal
        isOpen={editMember !== null}
        onClose={() => setEditMember(null)}
        title="Edit member"
        footer={
          <>
            <Button
              variant="outline"
              className="px-8 rounded h-11"
              onClick={() => setEditMember(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-munchprimary hover:bg-munchprimaryDark text-white px-8 rounded h-11"
              onClick={handleUpdate}
            >
              Update member
            </Button>
          </>
        }
      >
        {editMember && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  First name <span className="text-red-500">*</span>
                </Label>
                <Input
                  className={cn(
                    "rounded h-12",
                    errors.firstName && "border-red-500",
                  )}
                  value={editMember.firstName}
                  onChange={(e) =>
                    setEditMember({ ...editMember, firstName: e.target.value })
                  }
                />
                {errors.firstName && (
                  <p className="text-[10px] text-red-500 font-bold">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Last name <span className="text-red-500">*</span>
                </Label>
                <Input
                  className={cn(
                    "rounded h-12",
                    errors.lastName && "border-red-500",
                  )}
                  value={editMember.lastName}
                  onChange={(e) =>
                    setEditMember({ ...editMember, lastName: e.target.value })
                  }
                />
                {errors.lastName && (
                  <p className="text-[10px] text-red-500 font-bold">
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Work email <span className="text-red-500">*</span>
                </Label>
                <Input
                  className={cn(
                    "rounded h-12",
                    errors.workEmail && "border-red-500",
                  )}
                  value={editMember.workEmail}
                  onChange={(e) =>
                    setEditMember({ ...editMember, workEmail: e.target.value })
                  }
                />
                {errors.workEmail && (
                  <p className="text-[10px] text-red-500 font-bold">
                    {errors.workEmail}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Personal email</Label>
                <Input
                  className="rounded h-12"
                  value={editMember.personalEmail}
                  onChange={(e) =>
                    setEditMember({
                      ...editMember,
                      personalEmail: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Phone number</Label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-gray-50 border rounded text-sm text-gray-500 h-12">
                    +234
                  </div>
                  <Input
                    className="rounded flex-1 h-12"
                    value={editMember.phone}
                    onChange={(e) =>
                      setEditMember({ ...editMember, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={editMember.role}
                  onValueChange={(v) =>
                    setEditMember({ ...editMember, role: v })
                  }
                >
                  <SelectTrigger
                    className={cn(
                      "rounded h-12",
                      errors.role && "border-red-500",
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Vendor Manager">
                      Vendor Manager
                    </SelectItem>
                    <SelectItem value="Order Manager">Order Manager</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-[10px] text-red-500 font-bold">
                    {errors.role}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Checkbox
                id="notify-edit"
                className="rounded border-munchprimary data-[state=checked]:bg-munchprimary"
                defaultChecked
              />
              <Label
                htmlFor="notify-edit"
                className="text-sm font-medium text-gray-900"
              >
                Notify the member via email about this change.
              </Label>
            </div>
          </div>
        )}
      </CustomModal>

      {/* DELETE CONFIRMATION MODAL */}
      <CustomModal
        isOpen={deleteMember !== null}
        onClose={() => setDeleteMember(null)}
        title="Confirm action"
        maxWidth="sm:max-w-[540px]"
        footer={
          <>
            <Button
              variant="outline"
              className="px-8 rounded h-11"
              onClick={() => setDeleteMember(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-munchred hover:bg-red-700 text-white px-8 rounded h-11"
              onClick={() => {
                setMembers(members.filter((m) => m.id !== deleteMember.id));
                setDeleteMember(null);
              }}
            >
              Remove member
            </Button>
          </>
        }
      >
        {deleteMember && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-gray-700">
                Are you sure you want to remove{" "}
                <span className="font-bold text-gray-900">
                  {deleteMember.firstName} {deleteMember.lastName}?
                </span>
              </p>
              <p className="text-gray-600 text-[14px] leading-relaxed">
                This action will revoke their access to the platform
                immediately. Any ongoing tasks or responsibilities assigned to
                them will need to be reassigned.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="notify-del"
                className="rounded border-munchprimary data-[state=checked]:bg-munchprimary"
                defaultChecked
              />
              <Label
                htmlFor="notify-del"
                className="text-sm font-bold text-gray-900"
              >
                Send an email notifying them that their access has been revoked.
              </Label>
            </div>
          </div>
        )}
      </CustomModal>
    </Card>
  );
}
