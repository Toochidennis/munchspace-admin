import { cn } from "@/lib/utils";

interface SubTabTriggerProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function SubTabTrigger({ label, active, onClick }: SubTabTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "pb-4 text-sm transition-all relative",
        active ? "text-munchprimary" : "text-gray-500 hover:text-gray-600",
      )}
    >
      {label}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-munchprimary rounded-full" />
      )}
    </button>
  );
}
