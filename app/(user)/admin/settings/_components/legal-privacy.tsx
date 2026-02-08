"use client";

import * as React from "react";
import { FileText, ExternalLink, Clock, Save } from "lucide-react";
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

export function LegalPrivacy() {
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = (policy: string) => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast.success(`${policy} updated successfully`);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Privacy Policy Card */}
      <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <FileText size={24} />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-[#1A1C1E]">
                Privacy Policy
              </CardTitle>
              <CardDescription className="text-sm">
                Manage the data protection rules for your users.
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            className="gap-2 h-10 border-slate-200 text-slate-600"
          >
            <ExternalLink size={16} /> View Live
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              Last updated: Dec 12, 2024
            </div>
            <span>Version 2.4.0</span>
          </div>
          <textarea
            className="w-full h-48 p-4 bg-[#F8F9FA] border-none rounded-xl text-sm text-slate-600 focus:ring-1 focus:ring-orange-500 outline-none resize-none leading-relaxed"
            defaultValue="MunchSpace is committed to protecting your privacy. This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from the platform..."
          />
          <div className="flex justify-end">
            <Button
              className="bg-[#F97316] hover:bg-[#EA580C] text-white px-8 h-11 font-bold rounded-lg gap-2"
              onClick={() => handleSave("Privacy Policy")}
            >
              <Save size={18} /> Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Terms of Service Card */}
      <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <FileText size={24} />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-[#1A1C1E]">
                Terms of Service
              </CardTitle>
              <CardDescription className="text-sm">
                Establish the legal agreement between MunchSpace and its users.
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            className="gap-2 h-10 border-slate-200 text-slate-600"
          >
            <ExternalLink size={16} /> View Live
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              Last updated: Nov 20, 2024
            </div>
            <span>Version 1.8.2</span>
          </div>
          <textarea
            className="w-full h-48 p-4 bg-[#F8F9FA] border-none rounded-xl text-sm text-slate-600 focus:ring-1 focus:ring-orange-500 outline-none resize-none leading-relaxed"
            defaultValue="By accessing or using MunchSpace, you agree to be bound by these terms. All vendors must comply with local food safety regulations and platform-specific delivery standards..."
          />
          <div className="flex justify-end">
            <Button
              className="bg-[#F97316] hover:bg-[#EA580C] text-white px-8 h-11 font-bold rounded-lg gap-2"
              onClick={() => handleSave("Terms of Service")}
            >
              <Save size={18} /> Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
