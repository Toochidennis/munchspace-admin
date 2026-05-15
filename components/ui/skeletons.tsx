import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Skeleton for stat cards (used on the dashboard views)
 */
export function StatCardSkeleton() {
  return (
    <div className="border shadow-none rounded-md py-4 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <div className="flex gap-3 items-center pt-1">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton for a standard table row with N columns
 */
export function TableRowSkeleton({ cols = 6, className }: { cols?: number; className?: string }) {
  return (
    <tr className={cn("border-b border-gray-100", className)}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-4 border-r border-gray-100 last:border-r-0">
          <Skeleton className="h-4 w-full max-w-[160px]" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Skeleton for a CSS-grid-based row (used in Orders, Riders, Payments, Payouts)
 */
export function GridRowSkeleton({
  gridLayout,
  cols = 7,
}: {
  gridLayout: string;
  cols?: number;
}) {
  return (
    <div className={cn(gridLayout, "border-b border-gray-100 bg-white")}>
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center py-4 pl-4",
            i < cols - 1 && "border-r border-gray-100",
          )}
        >
          <Skeleton className="h-4 w-full max-w-[140px]" />
        </div>
      ))}
    </div>
  );
}

/**
 * Multiple table row skeletons
 */
export function TableSkeletonRows({
  rows = 8,
  cols = 6,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} cols={cols} />
      ))}
    </>
  );
}

/**
 * Multiple grid row skeletons
 */
export function GridSkeletonRows({
  rows = 8,
  gridLayout,
  cols = 7,
}: {
  rows?: number;
  gridLayout: string;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <GridRowSkeleton key={i} gridLayout={gridLayout} cols={cols} />
      ))}
    </>
  );
}

/**
 * Skeleton for the page header title area
 */
export function HeaderTitleSkeleton() {
  return <Skeleton className="h-7 w-32" />;
}

/**
 * Skeleton for chart areas
 */
export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="flex items-end justify-around gap-2 w-full px-4" style={{ height }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton
          key={i}
          className="w-full rounded-t-md"
          style={{ height: `${30 + Math.random() * 70}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for a pie / donut chart placeholder
 */
export function PieChartSkeleton({ size = 180 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center w-full" style={{ height: size }}>
      <Skeleton className="rounded-full" style={{ width: size * 0.85, height: size * 0.85 }} />
    </div>
  );
}
