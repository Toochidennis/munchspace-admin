import React from "react";

export const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const RADIAN = Math.PI / 180;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-[12px] font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const getFilteredData = (data: any[], query: string) =>
  data.filter(
    (item) =>
      (item.customer?.toLowerCase() ?? "").includes(query.toLowerCase()) ||
      (item.vendor?.toLowerCase() ?? "").includes(query.toLowerCase()) ||
      (item.name?.toLowerCase() ?? "").includes(query.toLowerCase()) ||
      item.id.includes(query),
  );

export const getPageNumbers = (currentPage: number, totalPages: number) => {
  const pages: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }
  return pages;
};
