"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronDown,
  MoreHorizontal,
  Eye,
  MessageSquare,
  UserPlus,
  Ban,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Truck,
  CreditCard,
  Package,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Product {
  name: string;
  category: string;
  price: string;
  qty: number;
  image: string;
}

interface Order {
  id: string;
  date: string;
  status: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  vendor: string;
  products: Product[];
  subtotal: string;
  discount: string;
  shipping: string;
  total: string;
  shippingAddress: string;
  expectedDelivery: string;
  courier?: {
    name: string;
    pickupTime?: string;
  };
  paymentStatus: "paid" | "pending";
  orderPlaced: string;
  paymentConfirmed?: string;
  // ... add more timeline events as needed
}

interface OrderDetailPageProps {
  order: Order; // In real app, fetch by ID
}

export default function OrderDetailPage({ order }: OrderDetailPageProps) {
  const [expandedTimeline, setExpandedTimeline] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "awaiting confirmation":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "awaiting pickup":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "out for delivery":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      case "returned & refunded":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const handleCancelOrder = () => {
    // In real app → open confirmation modal with reason + password
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1400)), {
      loading: "Cancelling order...",
      success: "Order cancelled successfully",
      error: "Failed to cancel order",
    });
  };

  const handleNotify = (type: "vendor" | "customer") => {
    toast.success(`Notification sent to ${type}`);
  };

  const handleMarkAs = (newStatus: string) => {
    toast.success(`Order marked as ${newStatus}`);
    // In real app → update order status
  };

  return (
    <div className="min-h-screen bg-gray-50/40 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/orders">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Order {order.id}
              </h1>
              <p className="text-sm text-gray-500">
                Placed on {order.date} • {order.status}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Mark Order as...</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => handleMarkAs("Out for Delivery")}
                >
                  Out for Delivery
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleMarkAs("Delivered")}>
                  Delivered
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleMarkAs("Awaiting Confirmation")}
                >
                  Awaiting Confirmation
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleMarkAs("Awaiting Pickup")}
                >
                  Awaiting Pickup
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleMarkAs("Returned & Refunded")}
                >
                  Returned & Refunded
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">More actions</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleNotify("vendor")}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Notify Vendor...
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNotify("customer")}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Notify Customer...
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign Courier
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={handleCancelOrder}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Cancel Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left / Center */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products */}
            <div className="rounded-lg border bg-white shadow-sm">
              <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Products</h2>
                  <Badge
                    variant="outline"
                    className={cn("px-3 py-1", getStatusColor(order.status))}
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>

              <div className="divide-y">
                {order.products.map((product, idx) => (
                  <div key={idx} className="flex gap-4 px-6 py-4">
                    <div className="h-20 w-20 rounded-md border overflow-hidden flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-gray-500">
                        {product.category}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-sm">
                        <span>{product.price}</span>
                        <span>×</span>
                        <span>{product.qty}</span>
                      </div>
                    </div>
                    <div className="text-right font-medium">
                      {product.price}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t bg-gray-50 px-6 py-4">
                <div className="ml-auto w-72 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{order.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Discount (New customer bonus)</span>
                    <span>{order.discount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping or delivery (Free delivery)</span>
                    <span>{order.shipping}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium text-base">
                    <span>Total</span>
                    <span>{order.total}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline / Activity */}
            <div className="rounded-lg border bg-white shadow-sm">
              <div className="border-b px-6 py-4">
                <button
                  className="flex w-full items-center justify-between"
                  onClick={() => setExpandedTimeline(!expandedTimeline)}
                >
                  <h2 className="text-lg font-semibold">Activity Logs</h2>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 transition-transform",
                      expandedTimeline && "rotate-180",
                    )}
                  />
                </button>
              </div>

              {expandedTimeline && (
                <div className="px-6 py-5">
                  <div className="space-y-6 border-l border-gray-200 pl-6 relative">
                    {/* Example timeline items – in real app map from order events */}
                    <div className="relative">
                      <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full bg-blue-500 border-2 border-white" />
                      <p className="text-sm font-medium">Order Placed</p>
                      <p className="text-xs text-gray-500">
                        {order.orderPlaced}
                      </p>
                    </div>

                    {order.paymentConfirmed && (
                      <div className="relative">
                        <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                        <p className="text-sm font-medium">Payment Confirmed</p>
                        <p className="text-xs text-gray-500">
                          {order.paymentConfirmed}
                        </p>
                      </div>
                    )}

                    {order.courier?.pickupTime && (
                      <div className="relative">
                        <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full bg-orange-500 border-2 border-white" />
                        <p className="text-sm font-medium">
                          Picked up by {order.courier.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.courier.pickupTime}
                        </p>
                      </div>
                    )}

                    {/* Add more timeline events */}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Customer */}
            <div className="rounded-lg border bg-white shadow-sm">
              <div className="border-b px-6 py-4">
                <h2 className="text-lg font-semibold">Customer</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src="/placeholder-user.jpg"
                      alt={order.customer.name}
                    />
                    <AvatarFallback>{order.customer.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{order.customer.name}</p>
                    <p className="text-sm text-gray-500">
                      {order.customer.email}
                    </p>
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    {order.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="rounded-lg border bg-white shadow-sm">
              <div className="border-b px-6 py-4">
                <h2 className="text-lg font-semibold">Shipping Address</h2>
              </div>
              <div className="p-6 space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium">{order.customer.name}</p>
                    <p className="text-gray-600">{order.shippingAddress}</p>
                    <p className="text-gray-500 mt-1">{order.customer.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Expected: {order.expectedDelivery}
                </div>
                {order.courier && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Truck className="h-4 w-4" />
                    Delivery by:{" "}
                    <span className="font-medium">{order.courier.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-lg border bg-white shadow-sm">
              <div className="border-b px-6 py-4">
                <h2 className="text-lg font-semibold">Payment</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <CreditCard className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <p className="font-medium">Paid via Card</p>
                    <p className="text-sm text-gray-500">Payment confirmed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
