const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Order = require("../models/Order");

// ✅ GET all orders
router.get("/", async (req, res) => {
    try {
        const orders = await Order.find();
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error("Error fetching orders:", error.message);
        res.status(500).json({ success: false, message: "Error fetching orders", error: error.message });
    }
});

// ✅ GET a single order by ID or orderId
router.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        // Validate MongoDB ObjectId format or check for a valid orderId
        if (!mongoose.Types.ObjectId.isValid(id) && !id.startsWith("ORD")) {
            return res.status(400).json({ success: false, message: "Invalid order ID" });
        }

        const order = await Order.findOne({ $or: [{ _id: id }, { orderId: id }] });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error("Error fetching order:", error.message);
        res.status(500).json({ success: false, message: "Error fetching order", error: error.message });
    }
});

// ✅ CREATE a new order
router.post("/", async (req, res) => {
    const { customerName, customerEmail, customerPhone, customerAddress, paymentMethod, date, totalAmount, status, items, trackingId, orderId } = req.body;

    try {
        // Validate that the items array is not empty
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: "Items array cannot be empty" });
        }

        const newOrder = new Order({
            orderId, // Ensure orderId is included
            customerName,
            customerEmail,
            customerPhone,
            customerAddress,
            paymentMethod,
            date,
            totalAmount,
            status,
            items,
            trackingId
        });

        await newOrder.save();
        res.status(201).json({ success: true, message: "Order created successfully", data: newOrder });
    } catch (error) {
        console.error("Error creating order:", error.message);
        res.status(500).json({ success: false, message: "Error creating order", error: error.message });
    }
});

// ✅ UPDATE an existing order
router.put("/:id", async (req, res) => {
    const id = req.params.id;

    try {
        // Validate MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid order ID" });
        }

        const updatedOrder = await Order.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({ success: true, message: "Order updated successfully", data: updatedOrder });
    } catch (error) {
        console.error("Error updating order:", error.message);
        res.status(500).json({ success: false, message: "Error updating order", error: error.message });
    }
});

// ✅ DELETE an order
router.delete("/:id", async (req, res) => {
    const id = req.params.id;

    try {
        // Validate MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid order ID" });
        }

        const deletedOrder = await Order.findByIdAndDelete(id);

        if (!deletedOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({ success: true, message: "Order deleted successfully" });
    } catch (error) {
        console.error("Error deleting order:", error.message);
        res.status(500).json({ success: false, message: "Error deleting order", error: error.message });
    }
});

// ✅ NEW POST route for submitting ratings
router.post("/:orderId/rating", async (req, res) => {
    try {
        const { orderId } = req.params;
        const { rating } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Invalid rating value" });
        }

        const updatedOrder = await Order.findOneAndUpdate(
            { orderId },
            { isRated: true, rating },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({ success: true, message: "Rating submitted successfully", data: updatedOrder });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error submitting rating", error: error.message });
    }
});

module.exports = router;