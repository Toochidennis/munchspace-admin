"use client";

import React, { useState } from "react";
import {
  ShoppingBag,
  Store,
  ArrowUpRight,
  Bell,
  RefreshCcw,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { OrdersView } from "./_components/OrdersView";
import { VendorsView } from "./_components/VendorsView";
import { SalesView } from "./_components/SalesView";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("orders");

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="h-[72px] bg-white border-b flex items-center justify-between px-8 z-20">
        <h1 className="text-xl font-medium text-[#1A1C1E]">Dashboard</h1>
        <div className="flex items-center gap-5">
          <Button variant="ghost" size="icon" className="relative h-10 w-10">
            <Bell size={22} className="text-slate-600" />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#FF3B30] rounded-full border-2 border-white" />
          </Button>
          <div className="flex items-center gap-3 pl-5 border-l h-10">
            <p className="text-sm font-medium text-[#1A1C1E]">James Author</p>
            <div className="w-10 h-10 rounded-md bg-black text-white flex items-center justify-center text-xs font-bold">
              JA
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-auto"
          >
            <TabsList className="p-1 h-12 border-none bg-">
              <TabsTrigger
                value="orders"
                className="gap-2 px-6 py-4.5 data-[state=active]:bg-gray-100 border border-gray-300 border-r-0 data-[state=active]:border data-[state=active]:border-munchprimary rounded rounded-e-none"
              >
                <ShoppingBag
                  size={18}
                  className={
                    activeTab === "orders"
                      ? "text-orange-500"
                      : "text-slate-400"
                  }
                />{" "}
                <span className="font-medium text-sm">Orders</span>
              </TabsTrigger>
              <TabsTrigger
                value="vendors"
                className="gap-2 px-6 py-4.5 data-[state=active]:bg-white border border-gray-300 border-r-0 data-[state=active]:border data-[state=active]:border-munchprimary rounded-none"
              >
                <Store
                  size={18}
                  className={
                    activeTab === "vendors"
                      ? "text-orange-500"
                      : "text-slate-400"
                  }
                />{" "}
                <span className="font-medium text-sm">Vendors</span>
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="gap-2 px-6 py-4.5 data-[state=active]:bg-gray-100 border border-gray-300 data-[state=active]:border data-[state=active]:border-munchprimary rounded rounded-s-none"
              >
                <ArrowUpRight
                  size={18}
                  className={
                    activeTab === "sales" ? "text-orange-500" : "text-slate-400"
                  }
                />{" "}
                <span className="font-medium text-sm">Sales</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <RefreshCcw size={18} />
            </Button>
            <Select defaultValue="Last 30 days">
              <SelectTrigger className="w-[180px] rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Today">Today</SelectItem>
                <SelectItem value="Last 30 days">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {activeTab === "orders" && <OrdersView />}
        {activeTab === "vendors" && <VendorsView />}
        {activeTab === "sales" && <SalesView />}
      </main>
    </div>
  );
}
