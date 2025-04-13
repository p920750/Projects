const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true }, // Unique Order ID
    customerName: { type: String, required: true }, // Customer's Name
    customerEmail: { type: String, required: true }, // Customer's Email
    customerPhone: { type: String, required: true }, // Customer's Phone Number
    customerAddress: { type: String, required: true }, // Customer's Address
    paymentMethod: {
      type: String,
      enum: ["COD", "Credit Card", "Debit Card", "UPI"],
      required: true,
    }, // Payment Method
    date: { type: Date, default: Date.now }, // Order Date
    totalAmount: { type: Number, required: true }, // Total Amount
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    }, // Order Status
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // Product Reference
        productName: { type: String, required: true }, // Product Name
        category: { type: String, required: true }, // Product Category
        quantity: { type: Number, required: true }, // Quantity Ordered
        price: { type: Number, required: true }, // Price of the Product
        image: { type: String, required: false }, // Product Image URL
        itemType: { type: String, required: false }, // Type of Item (Optional)
      },
    ],
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: false }, // Partner Reference
    trackingId: { type: String, required: false }, // Tracking ID
    isRated: { type: Boolean, default: false }, // Whether the Order is Rated
    rating: { type: Number, default: null }, // Rating Given by the Customer
  },
  { timestamps: true } // Add CreatedAt and UpdatedAt Timestamps
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

module.exports = Order; // Export the Order Model