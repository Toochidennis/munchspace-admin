import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function MarkKYCModal({ isOpen, onClose }: any) {
  const [selected, setSelected] = React.useState("Verified");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Mark document as...</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600">
            Mark{" "}
            <span className="font-bold text-gray-900">
              Sushi Place CAC document
            </span>{" "}
            as..
          </p>

          <div className="space-y-3">
            {[
              "Verified",
              "Rejected",
              "Required",
              "In Review",
              "Incomplete",
            ].map((status) => (
              <div
                key={status}
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setSelected(status)}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    selected === status
                      ? "border-[#E86B35]"
                      : "border-gray-300 group-hover:border-gray-400",
                  )}
                >
                  {selected === status && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#E86B35]" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold transition-colors",
                    selected === status ? "text-gray-900" : "text-gray-500",
                  )}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">
              Internal Note <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Briefly explain why you're updating Sushi Place's CAC documents"
              className="min-h-[120px] border-gray-200 focus:border-[#E86B35] rounded-lg resize-none text-sm p-4"
            />
            <p className="text-[11px] text-gray-400 font-medium">
              For internal records. Not visible to the vendor.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-8 h-11 text-gray-500 border-gray-200 font-semibold"
            >
              Cancel
            </Button>
            <Button
              className="px-8 h-11 bg-[#E86B35] text-white hover:bg-[#d15d2c] font-semibold"
              onClick={() => {
                toast.success("Document status updated");
                onClose();
              }}
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
