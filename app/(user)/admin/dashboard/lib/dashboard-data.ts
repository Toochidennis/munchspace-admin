// --- 1. COMMON CHART DATA ---

export const dailyData = [
  { day: "Mon", thisMonth: 4200, lastMonth: 3100 },
  { day: "Tue", thisMonth: 3800, lastMonth: 2900 },
  { day: "Wed", thisMonth: 5100, lastMonth: 4800 },
  { day: "Thu", thisMonth: 4000, lastMonth: 3200 },
  { day: "Fri", thisMonth: 5900, lastMonth: 4100 },
  { day: "Sat", thisMonth: 7200, lastMonth: 6100 },
  { day: "Sun", thisMonth: 6800, lastMonth: 5500 },
];

export const completionData = [
  { name: "Completed", value: 70, color: "#00C950" },
  { name: "Pending", value: 20, color: "#FFBB28" },
  { name: "Cancelled", value: 10, color: "#FF4D4F" },
];

// --- 2. ORDERS VIEW DATA ---

export const MOCK_ORDERS = Array.from({ length: 150 }, (_, i) => {
  const statuses = [
    "Awaiting confirmation",
    "Awaiting Pickup",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
  ];

  return {
    id: `#${1000 + i}`,
    date: "Mon Mar 21 2024",
    customer: i % 2 === 0 ? "Idris Bello" : "Sarah James",
    vendor: i % 3 === 0 ? "Amitex" : "Yolande Foods",
    status: statuses[i % statuses.length],
    amount: `₦7,500`,
    // New: Products array to support your specific table row layout
    products: [
      {
        name: "Ofada Rice & Sauce",
        category: "Traditional Dishes",
        price: "₦3,500",
        qty: 2,
        image: "https://via.placeholder.com/150",
      },
      {
        name: "Extra Beef",
        category: "Sides",
        price: "₦500",
        qty: 1,
        image: "https://via.placeholder.com/150",
      },
    ],
  };
});

// --- 3. SALES VIEW DATA ---

// This mimics the Orders but tailored for the Sales Tab
export const MOCK_SALES_ORDERS = Array.from({ length: 120 }, (_, i) => {
  return {
    id: `#SLS-${2000 + i}`,
    date: "Tue Mar 22 2024",
    customer: i % 2 === 0 ? "Chidi Okafor" : "Amina Yusuf",
    vendor: i % 2 === 0 ? "Buka Fast Food" : "Sabr Collection",
    status: "Delivered",
    amount: `₦${(Math.random() * 15000 + 2000).toFixed(0)}`,
  };
});

// --- 4. VENDORS VIEW DATA ---

export const MOCK_VENDORS = Array.from({ length: 100 }, (_, i) => {
  const statuses = ["APPROVED", "PENDING APPROVAL", "REJECTED"];
  const isFlagged = i % 7 === 0;
  return {
    id: `#VEN-${5000 + i}`,
    name: i % 2 === 0 ? "Sabr Collection" : "Buka Fast Food",
    regDate: "Tue Nov 26 2024",
    products: i % 2 === 0 ? 12 : 28,
    status: isFlagged ? "APPROVED" : statuses[i % statuses.length],
    flagged: isFlagged,
  };
});

export const vendorPerformanceData = [
  { name: "Kd", sales: 1500000 },
  { name: "Dennis", sales: 600000 },
  { name: "Sabr", sales: 450000 },
  { name: "Buka", sales: 380000 },
  { name: "Amitex", sales: 320000 },
  { name: "Yolande", sales: 290000 },
  { name: "Mama Put", sales: 250000 },
  { name: "Grills", sales: 210000 },
  { name: "ChopNow", sales: 180000 },
  { name: "Foodie", sales: 150000 },
];

export const topSellingData = [
  {
    vendor: "Buka Restaurant",
    items: [
      // Top 4 (These will be displayed)
      { name: "Ofada Rice & Ayamase", sold: 450, color: "green-500" },
      { name: "Goat Meat Pepper Soup", sold: 320, color: "yellow-500" },
      { name: "Jollof Rice Special", sold: 210, color: "blue-400" },
      { name: "Pounded Yam & Egusi", sold: 180, color: "pink-500" },
      // Others (Used only for total percentage calculation)
      { name: "Plantain Side", sold: 90, color: "orange-500" },
      { name: "Moin Moin", sold: 60, color: "red-400" },
      { name: "Pet Coke", sold: 45, color: "blue-400" },
      { name: "Bottled Water", sold: 30, color: "green-400" },
    ],
  },
  {
    vendor: "Mama Cass",
    items: [
      // Top 4
      { name: "Beef Suya Large", sold: 520, color: "pink-500" },
      { name: "Fried Rice & Chicken", sold: 380, color: "green-500" },
      { name: "White Rice & Stew", sold: 150, color: "yellow-500" },
      { name: "Asun (Spicy Goat)", sold: 120, color: "blue-400" },
      // Others
      { name: "Coleslaw", sold: 40, color: "orange-500" },
      { name: "Extra Chicken", sold: 35, color: "red-400" },
      { name: "Orange Juice", sold: 25, color: "green-400" },
    ],
  },
  {
    vendor: "Sabr Collection",
    items: [
      // Top 4 (Dominant items)
      { name: "Abaya Luxury Gold", sold: 800, color: "yellow-500" },
      { name: "Silk Hijab Set", sold: 650, color: "blue-400" },
      { name: "Chiffon Scarf", sold: 300, color: "pink-500" },
      { name: "Modest Wrap Dress", sold: 250, color: "green-500" },
      // Many small items to lower the Top 4 percentage
      { name: "Inner Cap", sold: 150, color: "orange-500" },
      { name: "Pins Box", sold: 100, color: "red-400" },
      { name: "Prayer Mat", sold: 90, color: "green-400" },
      { name: "Beaded Tasbih", sold: 80, color: "blue-400" },
      { name: "Gift Box", sold: 50, color: "yellow-500" },
    ],
  },
  {
    vendor: "Amitex Electronics",
    items: [
      // Top 4 (Very concentrated sales)
      { name: "iPhone 15 Pro Max", sold: 1200, color: "blue-400" },
      { name: "Samsung S24 Ultra", sold: 950, color: "green-500" },
      { name: "AirPods Pro", sold: 400, color: "pink-500" },
      { name: "Fast Charger 20W", sold: 300, color: "orange-500" },
      // Only one other item
      { name: "Screen Protector", sold: 50, color: "yellow-500" },
    ],
  },
];
