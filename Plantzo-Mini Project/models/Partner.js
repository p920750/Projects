const mongoose = require("mongoose");
//console.log("Partner model is being required at:", new Error().stack);

// Define the schema (combine fields from both schemas)
const partnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  location: { type: String },
  joinedDate: { type: Date, default: Date.now },
  products: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  averageRating: { type: Number, min: 0, max: 5, default: 0 },
});

// Prevent OverwriteModelError by reusing the existing model if it already exists
const Partner = mongoose.models.Partner || mongoose.model("Partner", partnerSchema);

module.exports = Partner;