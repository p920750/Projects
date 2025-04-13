const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ["indoor", "outdoor", "flowerseeds", "fertilizer"] 
  },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true }, // Image filename or URL
  stock: { type: Number, required: true, default: 0 }, // Added stock field
  partnerName: { type: String, required: true }, // Nursery partner name as string

  guidelines: {
    type: Object,
    // Guidelines is only allowed for indoor and outdoor plants.
    validate: {
      validator: function(value) {
        return !value || ["indoor", "outdoor"].includes(this.category);
      },
      message: "Guidelines are only allowed for Indoor and Outdoor plants."
    }
  },

  howToUse: {
    type: Object,
    // HowToUse is only allowed for flowerseeds and fertilizer.
    validate: {
      validator: function(value) {
        return !value || ["flowerseeds", "fertilizer"].includes(this.category);
      },
      message: "HowToUse is only allowed for Fertilizers and Flower Seeds."
    }
  }
});

const Product = mongoose.model("Product", productSchema ,"plants")
module.exports = Product;
