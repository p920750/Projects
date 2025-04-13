const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Product = require("../models/Product");

if (!Product) {
  throw new Error("Product model could not be loaded. Please check the path and ensure the model is defined.");
}



// Fetch products by category
router.get("/", async (req, res) => {
  try {
    const category = req.query.category;
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9 ]/g, ""); // Sanitize input
    if (!category) {
      return res.status(400).json({ success: false, message: "Category is required." });
    }

    const products = await Product.find({ category: new RegExp(`^${sanitizedCategory}$`, 'i') }); // Case-insensitive query
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error("Error fetching products by category:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching products.", error: error.message });
  }
});
// Fetch a single product by ID
router.get("/:id", async (req, res) => {
  try {
    const productId = req.params.id;

    // Validate the product ID format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID." });
    }

    // Query the database for the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("Error fetching product by ID:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching product.", error: error.message });
  }
});

module.exports = router;