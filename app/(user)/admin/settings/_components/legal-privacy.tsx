"use client";

import * as React from "react";
import { FileText, ExternalLink, Clock, Save, Edit, X, Bold, Italic, Strikethrough, List, ListOrdered, Quote, Code, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { authenticatedFetch, parseApiResponse } from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

const documents = [
  { id: 'terms_of_service', title: 'Terms of Use', desc: 'Establish the contractual terms that govern platform usage by customers and stakeholders.' },
  { id: 'privacy_policy', title: 'Privacy Policy', desc: 'Establishes data privacy practices, including collection, usage, and protection of user information.' },
  { id: 'cookie_policy', title: 'Cookie Policy', desc: 'Explains how the platform uses cookies and similar tracking technologies.' },
  { id: 'compliance', title: 'Compliance', desc: 'Manage compliance with data privacy regulations governing the collection, use, and protection of user information.' },
  { id: 'refund_policy', title: 'Refund Policy', desc: 'Details the conditions under which customers can request and receive refunds.' },
  { id: 'safety_guidelines', title: 'Rider\'s Safety', desc: 'Safety policies and protections for riders.' }
];

export function LegalPrivacy() {
  const [selectedDoc, setSelectedDoc] = React.useState<any>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [content, setContent] = React.useState("");
  const [notifyVendorAndRider, setNotifyVendorAndRider] = React.useState(true);
  const [notifyCustomers, setNotifyCustomers] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [activeStyles, setActiveStyles] = React.useState<Record<string, boolean>>({});
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [legalDocsData, setLegalDocsData] = React.useState<Record<string, any>>({});
  const [isLoadingDocs, setIsLoadingDocs] = React.useState(true);

  const fetchDocs = React.useCallback(async () => {
    setIsLoadingDocs(true);
    const results: Record<string, any> = {};
    try {
      await Promise.all(
        documents.map(async (doc) => {
          try {
            const res = await authenticatedFetch(`/admin/legal/${doc.id}`);
            const apiRes = await parseApiResponse(res);
            if (apiRes?.success && apiRes.data) {
              results[doc.id] = apiRes.data;
            }
          } catch (e) {
             // Ignore error for missing documents
          }
        })
      );
      setLegalDocsData(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const checkActiveStyles = () => {
    setActiveStyles({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
      blockquote: document.queryCommandValue('formatBlock') === 'blockquote',
      pre: document.queryCommandValue('formatBlock') === 'pre',
    });
  };

  const execCommand = (e: React.MouseEvent, command: string, value: string | undefined = undefined) => {
    e.preventDefault(); // Prevent focus loss
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
    checkActiveStyles();
  };

  const handleSave = async () => {
    if (!selectedDoc) return;
    setIsSaving(true);
    
    try {
      const res = await authenticatedFetch(`/admin/legal/${selectedDoc.id}`, {
        method: "POST",
        body: JSON.stringify({
          content,
          notifyVendorAndRider,
          notifyCustomers
        })
      });
      
      const apiRes = await parseApiResponse(res);
      if (apiRes?.success) {
        toast.success(`${selectedDoc.title} updated successfully`);
        setIsModalOpen(false);
        setContent("");
        fetchDocs();
      } else {
        toast.error(apiRes?.message || `Failed to update ${selectedDoc.title}`);
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-[#1A1C1E]">Legal & Privacy</h2>
        <p className="text-[15px] text-slate-500 mt-1">Manage and update platform legal documents.</p>
      </div>
      
      <div className="space-y-4 border-t border-slate-200 pt-6">
        {documents.map(doc => (
          <Card key={doc.id} className="border border-slate-200 shadow-sm bg-white rounded-xl overflow-hidden">
            <CardContent className="flex flex-col sm:flex-row justify-between sm:items-center p-6 gap-4">
              <div className="space-y-2">
                <CardTitle className="text-[17px] font-normal text-[#1A1C1E]">{doc.title}</CardTitle>
                <CardDescription className="text-[15px] text-slate-500 max-w-2xl leading-relaxed">
                  {doc.desc}
                </CardDescription>
                <div className="text-[14px] text-slate-400 font-normal pt-2 flex items-center gap-1.5">
                  <Clock size={14} />
                  {legalDocsData[doc.id]?.lastUpdatedAt 
                    ? `Last updated: ${format(new Date(legalDocsData[doc.id].lastUpdatedAt), "MMM d, yyyy")}`
                    : "Last updated: N/A"}
                </div>
              </div>
              <Button
                variant="outline"
                className="gap-2 h-10 border-slate-200 text-slate-600 font-medium self-start sm:self-center hover:bg-slate-50"
                onClick={() => {
                  setSelectedDoc(doc);
                  setIsModalOpen(true);
                  const existingContent = legalDocsData[doc.id]?.content || "";
                  setContent(existingContent);
                  setNotifyVendorAndRider(true);
                  setNotifyCustomers(true);
                  setTimeout(() => {
                    if (editorRef.current) {
                      editorRef.current.innerHTML = existingContent;
                    }
                  }, 0);
                }}
              >
                <Edit size={16} /> Update
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <CustomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Update ${selectedDoc?.title}`}
        maxWidth="max-w-3xl"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="h-[42px] px-6 font-normal text-slate-700 border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !content.trim()}
              className="h-[42px] px-6 font-medium bg-[#E86B35] hover:bg-[#d15d2c] text-white rounded-lg shadow-sm"
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save & Publish
            </Button>
          </>
        }
      >
        <div className="flex flex-col h-full bg-[#F8F9FA]">
          <div className="p-6 pb-2">
            <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col bg-white">
              <div className="flex items-center gap-1.5 p-2 border-b border-slate-200 text-slate-500 flex-wrap">
                <button onMouseDown={(e) => execCommand(e, 'bold')} className={`p-1.5 rounded text-slate-600 transition-colors ${activeStyles.bold ? 'bg-slate-200 shadow-inner' : 'hover:bg-slate-100'}`}><Bold size={16} /></button>
                <button onMouseDown={(e) => execCommand(e, 'italic')} className={`p-1.5 rounded text-slate-600 transition-colors ${activeStyles.italic ? 'bg-slate-200 shadow-inner' : 'hover:bg-slate-100'}`}><Italic size={16} /></button>
                <button onMouseDown={(e) => execCommand(e, 'strikeThrough')} className={`p-1.5 rounded text-slate-600 transition-colors ${activeStyles.strikeThrough ? 'bg-slate-200 shadow-inner' : 'hover:bg-slate-100'}`}><Strikethrough size={16} /></button>
                <div className="w-[1px] h-5 bg-slate-200 mx-1" />
                <button onMouseDown={(e) => execCommand(e, 'insertUnorderedList')} className={`p-1.5 rounded text-slate-600 transition-colors ${activeStyles.insertUnorderedList ? 'bg-slate-200 shadow-inner' : 'hover:bg-slate-100'}`}><List size={16} /></button>
                <button onMouseDown={(e) => execCommand(e, 'insertOrderedList')} className={`p-1.5 rounded text-slate-600 transition-colors ${activeStyles.insertOrderedList ? 'bg-slate-200 shadow-inner' : 'hover:bg-slate-100'}`}><ListOrdered size={16} /></button>
                <div className="w-[1px] h-5 bg-slate-200 mx-1" />
                <button onMouseDown={(e) => execCommand(e, 'formatBlock', 'blockquote')} className={`p-1.5 rounded text-slate-600 transition-colors ${activeStyles.blockquote ? 'bg-slate-200 shadow-inner' : 'hover:bg-slate-100'}`}><Quote size={16} /></button>
                <button onMouseDown={(e) => execCommand(e, 'formatBlock', 'pre')} className={`p-1.5 rounded text-slate-600 transition-colors ${activeStyles.pre ? 'bg-slate-200 shadow-inner' : 'hover:bg-slate-100'}`}><Code size={16} /></button>
              </div>
              <div
                ref={editorRef}
                contentEditable
                onInput={(e) => {
                  setContent(e.currentTarget.innerHTML);
                  checkActiveStyles();
                }}
                onKeyUp={checkActiveStyles}
                onMouseUp={checkActiveStyles}
                className="w-full min-h-[400px] p-5 border-none text-[15px] text-slate-700 focus:ring-0 outline-none bg-white max-w-none [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:my-2 [&_li]:pl-1 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:my-4 [&_pre]:bg-slate-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:my-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:overflow-x-auto"
                style={{ outline: "none" }}
              />
            </div>
          </div>
          
          <div className="px-6 py-4 mt-2">
            <p className="text-[15px] text-slate-600 mb-4">Send email notifications about this update to:</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="notify-riders"
                  checked={notifyVendorAndRider}
                  onCheckedChange={(c) => setNotifyVendorAndRider(!!c)}
                  className="data-[state=checked]:bg-[#E86B35] data-[state=checked]:border-[#E86B35] h-5 w-5 rounded-[4px]"
                />
                <Label htmlFor="notify-riders" className="text-[15px] font-normal text-[#1A1C1E] cursor-pointer">
                  Riders & vendors
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="notify-customers"
                  checked={notifyCustomers}
                  onCheckedChange={(c) => setNotifyCustomers(!!c)}
                  className="data-[state=checked]:bg-[#E86B35] data-[state=checked]:border-[#E86B35] h-5 w-5 rounded-[4px]"
                />
                <Label htmlFor="notify-customers" className="text-[15px] font-normal text-[#1A1C1E] cursor-pointer">
                  Customers
                </Label>
              </div>
            </div>
          </div>
          
        </div>
      </CustomModal>
    </div>
  );
}

