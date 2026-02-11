"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MoreHorizontal,
  ChevronRight,
  MessageSquare,
  Truck,
  CheckCircle2,
  XCircle,
  Plus,
  Info,
} from "lucide-react";
import { toast } from "sonner"; // Using sonner per your preference
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Mock Data
const order = {
  id: "#1002",
  date: "22/09/24 - 9:58 pm",
  status: "Delivered",
  items: [
    {
      id: 1,
      name: "Burger and Smoothie",
      vendor: "Food Court",
      price: 8900,
      qty: 1,
      image: "/burger.png",
    },
    {
      id: 2,
      name: "Refuel Max",
      vendor: "Food Court",
      price: 8900,
      qty: 1,
      image: "/rice.png",
    },
  ],
  payment: {
    subtotal: 44000,
    discount: -500,
    shipping: 3000,
    total: 43500,
  },
  customer: {
    name: "John Mandy",
    email: "johnmandy@gmail.com",
    phone: "080123456789",
    address: "Plot 18, Green man street, opposite NNPC, Ikeja, Lagos",
  },
  delivery: {
    courier: "Kantiok Daniel",
    date: "12/8/2024",
    time: "03:44 PM",
  },
};

export default function OrderDetailsPage() {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const CURRENT_STATUS_INDEX = 4;

  const TIMELINE_STEPS = [
    { title: "Order Placed", date: "18th OCT, 2024. 11:03AM" },
    { title: "Pending Confirmation", date: "18th OCT, 2024. 11:03AM" },
    { title: "Waiting for Pick-up", date: "18th OCT, 2024. 11:03AM" },
    { title: "Out for Delivery", date: "18th OCT, 2024. 11:03AM" },
    { title: "Delivered", date: "18th OCT, 2024. 11:03AM" },
  ];

  return (
    <div className="flex flex-col gap-6 p-8 bg-white min-h-screen overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="rounded-md">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{order.id}</h1>
            <p className="text-sm text-muted-foreground">{order.date}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="bg-[#B64A26] hover:bg-[#963d1f] rounded-md">
            Mark Order as...
          </Button>
          <Button variant="outline" className="rounded-md">
            More actions <MoreHorizontal className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Products & Payment */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-md overflow-hidden p-0 space-y-0 gap-0">
            <div className="p-4 py-3 border-b flex justify-between items-center bg-gray-100">
              <h3 className="font-semibold">Products</h3>
              <div
                className={cn(
                  "bg-yellow-400 px-2 rounded font-semibold text-white",
                  order.status === "Awaiting Pickup" && "bg-[#EB2F96]",
                  order.status === "Out For Delivery" && "bg-blue-500",
                  order.status === "Delivered" && "bg-green-500",
                )}
              >
                {order.status}
              </div>
            </div>
            <CardContent className="p-0">
              {order.status == "Awaiting Pickup" && (
                <div className="flex gap-4 bg-blue-100 m-4 p-3 px-4 rounded-md">
                  <Info size={32} className="text-white" fill="#1677FF" />
                  <div>
                    <h1 className="font-semibold">
                      Assign Couriers for Order Delivery
                    </h1>
                    <p className="text-gray-600">
                      Select couriers to pick up and deliver this order from the
                      vendor’s store/location to the customer’s
                      shipping/delivery address.
                    </p>
                  </div>
                </div>
              )}

              {order.items.map((item) => (
                <>
                  <div
                    className={cn(
                      "p-4 px-0 mx-4 border-b last:border-0",
                      order.status === "Out For Delivery" &&
                        "border last:border my-3 rounded py-0",
                      order.status === "Delivered" &&
                        "border last:border my-3 rounded py-0",
                    )}
                  >
                    <div
                      key={item.id}
                      className={cn(
                        "flex justify-between items-center",
                        order.status === "Out For Delivery" && "p-2",
                        order.status === "Delivered" && "p-2",
                      )}
                    >
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-md" />
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-blue-600 underline cursor-pointer">
                            {item.vendor}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          NGN {item.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          x {item.qty}
                        </p>
                      </div>
                    </div>
                    {order.status == "Awaiting Pickup" && (
                      <div className="flex justify-end mt-2">
                        <Button
                          variant={"outline"}
                          size={"sm"}
                          className="bg-white flex items-center text-blue-500 border-blue-500"
                        >
                          <Plus strokeWidth={3} />
                          <span>Assign Courier</span>
                        </Button>
                      </div>
                    )}
                    {order.status == "Out For Delivery" && (
                      <div className="bg-orange-100 rounded-b p-1 px-2 flex justify-between">
                        <p className="font-light">Delivery by</p>
                        <p className="flex items-center gap-3">
                          <span className="font-semibold">
                            {order.delivery.courier}
                          </span>
                          <Tooltip>
                            <TooltipTrigger>
                              {" "}
                              <Info size={15} />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="py-1.5">
                                {order.delivery.courier} picked-up this <br />{" "}
                                order from {item.vendor} on: <br />{" "}
                                {order.delivery.date} - {order.delivery.time}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </p>
                      </div>
                    )}
                    {order.status == "Delivered" && (
                      <div className="bg-orange-100 rounded-b p-1 px-2 flex justify-between">
                        <p className="font-light">Delivery by</p>
                        <p className="flex items-center gap-3">
                          <span className="font-semibold">
                            {order.delivery.courier}
                          </span>
                          <Tooltip>
                            <TooltipTrigger>
                              {" "}
                              <Info size={15} />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="py-1.5 text-center">
                                {order.delivery.courier} delivered this order
                                <br /> by: {order.delivery.date} -{" "}
                                {order.delivery.time}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ))}
            </CardContent>
          </Card>

          {/* Payment Card */}
          <Card className="rounded-md p-0 gap-0">
            <div className="p-4 font-semibold">Payment</div>
            <CardContent className="p-3 space-y-3 bg-gray-100 m-4 rounded">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">
                  N{order.payment.subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Discount (New customer bonus)
                </span>
                <span className="font-semibold">
                  N{order.payment.discount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Shipping or delivery
                </span>
                <span className="font-semibold">
                  N{order.payment.shipping.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-dashed border-gray-300 pt-3">
                <span>Total</span>
                <span className="font-semibold">
                  N{order.payment.total.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Customer & Timeline */}
        <div className="space-y-6">
          <Card className="rounded-md p-0 gap-0">
            <div className="p-4 py-3 border-b flex justify-between items-center bg-gray-100">
              <h3 className="font-semibold">Customer</h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <p className="font-semibold mb-2">Customer information</p>
                <p className="text-sm">{order.customer.name}</p>
                <p className="text-sm text-blue-600">{order.customer.email}</p>
                <p className="text-sm">{order.customer.phone}</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Shipping address</p>
                <p className="text-sm">{order.customer.address}</p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Placeholder */}
          <div className="bg-white p-6 pt-0 rounded-md w-full max-w-md">
            <div className="relative flex flex-col">
              {TIMELINE_STEPS.map((step, index) => {
                const isCompleted = index <= CURRENT_STATUS_INDEX;
                const isLast = index === TIMELINE_STEPS.length - 1;
                const isFirst = index === 0;

                return (
                  <div
                    key={index}
                    className="relative pl-8 pb-10 last:pb-0 group"
                  >
                    {/* 1. The Top Line (Only for the very first item) */}
                    {isFirst && (
                      <div
                        className={cn(
                          "absolute left-[7px] -top-6 h-12 w-[2px]",
                          isCompleted ? "bg-[#E66B3D]" : "bg-gray-100",
                        )}
                      />
                    )}

                    {/* 2. The Connecting Line (Hidden for the last item) */}
                    {!isLast && (
                      <div
                        className={cn(
                          "absolute left-[7px] top-4 h-full w-[2px]",
                          // Line is orange only if the NEXT item is also completed
                          index < CURRENT_STATUS_INDEX
                            ? "bg-[#E66B3D]"
                            : "bg-gray-100",
                        )}
                      />
                    )}

                    {/* 3. Status Indicator Circle */}
                    <div
                      className={cn(
                        "absolute left-0 top-1.5 w-4 h-4 rounded-full border-[3px] border-white z-10 transition-colors duration-300",
                        isCompleted ? "bg-[#E66B3D]" : "bg-gray-300",
                      )}
                    />

                    {/* 4. Text Content */}
                    <div className="flex flex-col">
                      <span
                        className={cn(
                          "text-sm font-semibold leading-tight transition-colors",
                          isCompleted ? "text-gray-900" : "text-gray-400",
                        )}
                      >
                        {step.title}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] mt-0.5",
                          isCompleted ? "text-gray-500" : "text-gray-300",
                        )}
                      >
                        {step.date}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
