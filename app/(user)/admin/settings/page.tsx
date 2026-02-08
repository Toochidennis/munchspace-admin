"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Internal Components
import { SubTabTrigger } from "./_components/sub-tab-trigger";
import { TeamManagement } from "./_components/team-management";
import { NotificationSettings } from "./_components/notification-settings";
import { ServiceChargePayment } from "./_components/service-charge";
import { DeliveryShipping } from "./_components/delivery-shipping";
import { LegalPrivacy } from "./_components/legal-privacy";
import { ProductCategories } from "./_components/product-categories";
import KYCDocumentsPage from "./_components/kyc-documents";
import Header from "@/components/layout/Header";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState("platform");
  const [activeSubTab, setActiveSubTab] = React.useState("team");

  return (
    <div className="flex flex-col h-full bg-background">
      <Header title="Settings" />
      {/* SCROLLABLE CONTENT */}
      <main className="flex-1 overflow-y-auto space-y-8 scroll-smooth">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            setActiveSubTab(v === "platform" ? "team" : "service");
          }}
          className="w-full"
        >
          <TabsList className="border-none w-fit my-5 ms-5">
            <TabsTrigger
              value="platform"
              className="px-6 py-5 ms-3 border text-[16px] border-gray-200 data-[state=active]:border-0 data-[state=active]:bg-munchprimary text-black data-[state=active]:text-white rounded-sm font-semibold"
            >
              Platform Management
            </TabsTrigger>
            <TabsTrigger
              value="vendor"
              className="px-6 py-5 ms-3 border text-[16px] border-gray-200 data-[state=active]:border-0 data-[state=active]:bg-munchprimary text-black data-[state=active]:text-white rounded-sm font-semibold"
            >
              Vendor & Services
            </TabsTrigger>
          </TabsList>

          <div className="bg-white p-8">
            {activeTab === "platform" ? (
              <div>
                <div className="flex gap-8 border-b border-slate-200">
                  <SubTabTrigger
                    label="Team Management"
                    active={activeSubTab === "team"}
                    onClick={() => setActiveSubTab("team")}
                  />
                  <SubTabTrigger
                    label="Notification Settings"
                    active={activeSubTab === "notification"}
                    onClick={() => setActiveSubTab("notification")}
                  />
                  <SubTabTrigger
                    label="Legal & Privacy"
                    active={activeSubTab === "legal"}
                    onClick={() => setActiveSubTab("legal")}
                  />
                </div>
                <div>
                  {activeSubTab === "team" && <TeamManagement />}
                  {activeSubTab === "notification" && <NotificationSettings />}
                  {activeSubTab === "legal" && <LegalPrivacy />}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-8 border-b border-slate-200">
                  <SubTabTrigger
                    label="Service Charge & Payment"
                    active={activeSubTab === "service"}
                    onClick={() => setActiveSubTab("service")}
                  />
                  <SubTabTrigger
                    label="Delivery & Shipping"
                    active={activeSubTab === "delivery"}
                    onClick={() => setActiveSubTab("delivery")}
                  />
                  <SubTabTrigger
                    label="KYC Documents"
                    active={activeSubTab === "kycDocuments"}
                    onClick={() => setActiveSubTab("kycDocuments")}
                  />
                  <SubTabTrigger
                    label="Product Categories"
                    active={activeSubTab === "productCategories"}
                    onClick={() => setActiveSubTab("productCategories")}
                  />
                </div>
                <div>
                  {activeSubTab === "service" && <ServiceChargePayment />}
                  {activeSubTab === "delivery" && <DeliveryShipping />}
                  {activeSubTab === "kycDocuments" && <KYCDocumentsPage />}
                  {activeSubTab === "productCategories" && (
                    <ProductCategories />
                  )}
                </div>
              </div>
            )}
          </div>
        </Tabs>
      </main>
    </div>
  );
}
