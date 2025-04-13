const mongoose = require("mongoose");
const Order = require("./models/Order"); // Ensure correct model path

// MongoDB Connection (Replace with your Atlas connection string)
mongoose.connect("mongodb+srv://krishnagowri936:kFu3V7XxSrgSbCbi@cluster0.bg3zw.mongodb.net/Plantzo?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

const orders = [
  {
    orderId: "ORD1001",
    customerName: "John Doe",
    customerEmail: "john.doe@gmail.com",
    customerPhone: "9876543210",
    customerAddress: "123 Green Street, New York",
    paymentMethod: "COD",
    date: new Date("2025-03-28T04:30:00.000Z"),
    totalAmount: 650,
    status: "Pending",
    trackingId: "TRK123456",
    partnerId: "67e7b741f3ce5c9320a0f237", // GreenLeaf Nursery
    items: [
      {
        plantId: "67e4192326313b666475aebd", // Spider Plant
        productName: "Spider Plant", // ✅ Added productName
        category: "Indoor Plants", // ✅ Added category
        quantity: 1,
        price: 300,
      },
      {
        plantId: "67e4526e26313b666475af0c", // Morning Glory Seeds
        productName: "Morning Glory Seeds", // ✅ Added productName
        category: "Seeds", // ✅ Added category
        quantity: 1,
        price: 350,
      },
    ],
  },
  {
    orderId: "ORD1002",
    customerName: "Jane Smith",
    customerEmail: "jane.smith@gmail.com",
    customerPhone: "9876543211",
    customerAddress: "456 Bloom Street, Los Angeles",
    paymentMethod: "Credit Card",
    date: new Date("2025-03-27T10:00:00.000Z"),
    totalAmount: 999,
    status: "Shipped",
    trackingId: "TRK789012",
    partnerId: "67e7b741f3ce5c9320a0f239", // Nature's Touch
    items: [
      {
        plantId: "67e4216826313b666475aec2", // Fiddle Leaf Fig
        productName: "Fiddle Leaf Fig", // ✅ Added productName
        category: "Indoor Plants", // ✅ Added category
        quantity: 1,
        price: 999,
      },
    ],
  },
];

// Function to import orders into MongoDB
async function importOrders() {
  try {
    await Order.insertMany(orders);
    console.log("✅ Orders imported successfully!");
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error importing orders:", error);
    mongoose.connection.close();
  }
}

// Run import function
importOrders();