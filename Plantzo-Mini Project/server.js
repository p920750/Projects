require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const Order = require("./models/Order");
const Product = require("./models/Product"); 
const Partner = require("./models/Partner");

const app = express();
// ✅ Middleware
app.use(cors());
app.use(express.json()); // Replaces bodyParser.json()
app.use(express.static(path.join(__dirname, "public"))); // Serves static frontend files
app.use('/public', express.static(path.join(__dirname, 'public/chatbot/public')));
console.log("Serving static files from:", path.join(__dirname, 'public/chatbot/public'));

const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  next();
};

// ✅ Import Routes
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const partnerRoutes = require('./routes/partnerRoutes');


// ✅ MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ Missing MONGO_URI in environment variables.");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ MongoDB connected");

    // ✅ Use Routes After Connection
    app.use("/api/admin/orders", orderRoutes); // Adjusted route path for orders
        app.use("/api/admin/products", productRoutes); // Adjusted route path for products
        app.use("/api/users", userRoutes); // User-related endpoints
        app.use("/api/products", productRoutes);
        app.use('/api/partners', partnerRoutes);
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });



// ✅ Define Mongoose Schemas
const plantSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image: String, // ✅ Stores only the image URL
  category: String, // indoor, outdoor, flowerseeds, fertilizer
  stock: Number, // ✅ Added stock field
  partnerName: String, // ✅ Added partnerName field
  guidelines: {
    type: mongoose.Schema.Types.Mixed, // Changed from Object to Mixed
    // Guidelines are only allowed for indoor/outdoor products.
    validate: {
      validator: function (value) {
        return !value || ["indoor", "outdoor"].includes(this.category);
      },
      message: "Guidelines are only allowed for Indoor and Outdoor plants."
    }
  },
  howToUse: {
    type: mongoose.Schema.Types.Mixed, // Changed from Object to Mixed
    // howToUse is only allowed for flowerseeds and fertilizer products.
    validate: {
      validator: function (value) {
        return !value || ["flowerseeds", "fertilizer"].includes(this.category);
      },
      message: "HowToUse is only allowed for Fertilizers and Flower Seeds."
    }
  }
});



const partnerSchema = new mongoose.Schema({
  name: String,
  joinedDate: Date,
  products: Number,
  totalSales: Number,
});

const Plant = mongoose.model("Plant", plantSchema);




// ✅ Fetch All Products for Admin Panel
app.get("/api/admin/products", async (req, res) => {
  try {
    const products = await Plant.find().lean();
    console.log(`Found ${products.length} products`);
    res.json({ success: true, data: products });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});




// ✅ Fetch a Single Product by ID (For Editing)
app.get("/api/admin/product/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`Fetching product with ID: ${id}`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error("Invalid product ID format:", id);
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }
    
    const product = await Plant.findById(id);
    
    if (!product) {
      console.error("Product not found for ID:", id);
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    console.log("Product found:", product);
    res.json({ success: true, data: product });
  } catch (error) {
    console.error("❌ Error fetching product:", error);
    res.status(500).json({ success: false, message: "Failed to fetch product: " + error.message });
  }
});
//editing product
app.put("/api/admin/product/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`Updating product with ID: ${id}`);
    console.log("Update data:", req.body);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const { name, description, price, category, image, stock, partnerName, guidelines, howToUse } = req.body;

    // Parse and validate JSON fields
    let parsedGuidelines, parsedHowToUse;
    try {
      parsedGuidelines = guidelines ? JSON.parse(guidelines) : undefined;
    } catch {
      return res.status(400).json({ success: false, message: "Invalid JSON format in guidelines!" });
    }
    try {
      parsedHowToUse = howToUse ? JSON.parse(howToUse) : undefined;
    } catch {
      return res.status(400).json({ success: false, message: "Invalid JSON format in howToUse!" });
    }

    // Validate common fields
    if (!name || !description || !price || !category || !image || stock === undefined || !partnerName) {
      return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    // Category-specific validation
    if (["indoor", "outdoor"].includes(category) && !parsedGuidelines) {
      return res.status(400).json({ success: false, message: "Guidelines are required for indoor/outdoor plants!" });
    }
    if (["flowerseeds", "fertilizer"].includes(category) && !parsedHowToUse) {
      return res.status(400).json({ success: false, message: "HowToUse is required for flowerseeds/fertilizer products!" });
    }

    const updatedProduct = await Plant.findByIdAndUpdate(
      id,
      {
        name,
        description,
        price,
        category,
        image,
        stock,
        partnerName,
        guidelines: parsedGuidelines,
        howToUse: parsedHowToUse,
      },
      { new: true }
    );

    if (!updatedProduct) {
      console.error(`Failed to find or update product with ID: ${id}. Data:`, req.body);
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    console.log("Product updated successfully:", updatedProduct);
    res.json({ success: true, message: "Product updated successfully!", data: updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ success: false, message: "Failed to update product: " + error.message });
  }
});

// ✅ Fetch Plants by Category (For User Dashboard)
app.get("/api/plants", async (req, res) => {
  try {
    let category = req.query.category;
    if (!category) {
      return res.status(400).json({ success: false, message: "Category is required" });
    }
    category = category.toLowerCase();
    const plants = await Plant.find({ category }).lean();
    res.json({ success: true, data: plants });
  } catch (error) {
    console.error("❌ Error fetching plants:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/search", async (req, res) => {
  try {
    const query = req.query.q;
    console.log("Search Query:", query); // Log the query to check if it's being passed correctly
    
    if (!query) {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    const searchResults = await Plant.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ],
    }).lean();

    console.log("Search Results:", searchResults); // Log the search results

    res.json({ success: true, data: searchResults });
  } catch (error) {
    console.error("❌ Error searching plants:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ✅ Admin: Add Product
app.post("/api/admin/products", async (req, res) => {
try {
  const { name, description, price, category, image, stock, partnerName, guidelines, howToUse } = req.body;

  // Parse and validate guidelines
  let parsedGuidelines;
  try {
    parsedGuidelines = guidelines ? JSON.parse(guidelines) : undefined;
    if (guidelines && typeof parsedGuidelines !== "object") {
      return res.status(400).json({ success: false, message: "Guidelines must be a valid JSON object!" });
    }
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid JSON format in guidelines!" });
  }

  // Log input for debugging
  console.log("Adding new product:", req.body);

  // Validate required fields
  if (!name || !description || !price || !category || !image || stock === undefined || !partnerName) {
    return res.status(400).json({ success: false, message: "All fields are required!" });
  }

  // Validate category-specific fields
  if (["indoor", "outdoor"].includes(category) && !parsedGuidelines) {
    return res.status(400).json({ success: false, message: "Guidelines are required for indoor/outdoor plants!" });
  }
  if (["flowerseeds", "fertilizer"].includes(category) && !howToUse) {
    return res.status(400).json({ success: false, message: "HowToUse is required for flowerseeds/fertilizer products!" });
  }

  // Create and save the new product
  const newPlant = new Plant({
    name,
    description,
    price,
    image,
    category,
    stock,
    partnerName,
    guidelines: parsedGuidelines,
    howToUse,
  });
  const savedPlant = await newPlant.save();

  console.log("Product added successfully:", savedPlant);
  res.json({ success: true, message: "✅ Product added successfully!", data: savedPlant });
} catch (error) {
  console.error("❌ Error adding product:", error);
  res.status(500).json({ success: false, message: "Server error: " + error.message });
}
});
// ✅ Admin: Delete Product
app.delete("/api/admin/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`Deleting product with ID: ${id}`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error("Invalid product ID format on delete:", id);
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }
    const deletedProduct = await Plant.findByIdAndDelete(id);
    if (!deletedProduct) {
      console.error("Product not found on delete for ID:", id);
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    console.log("Product deleted successfully:", deletedProduct);
    res.json({ success: true, message: "✅ Product deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
});

// ✅ Admin: Fetch All Orders
app.get("/api/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 }).lean();
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Admin: Fetch Single Order by ID
app.get("/api/admin/orders/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    // Find the order by ID
    const order = await Order.findById(id).lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Respond with the order data
    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Admin: Fetch All Nursery Partners
app.get("/api/admin/partners", async (req, res) => {
    try {
      const partners = await Partner.find().lean();
      res.json({ success: true, data: partners });
    } catch (error) {
      console.error("❌ Error fetching partners:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });
  
  // ✅ Admin: Fetch a Single Partner by ID
app.get("/api/admin/partners/:id", async (req, res) => {
try {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid partner ID" });
  }

  const partner = await Partner.findById(id).lean();
  if (!partner) {
    return res.status(404).json({ success: false, message: "Partner not found" });
  }

  res.json({ success: true, data: partner });
} catch (error) {
  console.error("❌ Error fetching partner:", error);
  res.status(500).json({ success: false, message: "Server error" });
}
});

// ✅ Admin: Fetch a Single Product by ID
app.get("/api/admin/product/:id", async (req, res) => {
try {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  const product = await Plant.findById(id); // Ensured this is inside an async function
  if (!product) {
    console.error("Product not found for ID:", id);
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  console.log("Product found:", product);
  res.json({ success: true, data: product });
} catch (error) {
  console.error("❌ Error fetching product:", error);
  res.status(500).json({ success: false, message: "Failed to fetch product: " + error.message });
}
});

// ✅ Update Product by ID
app.put("/api/admin/product/:id", async (req, res) => {
try {
  const id = req.params.id;
  console.log(`Updating product with ID: ${id}`);
  console.log("Update data:", req.body);
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.error("Invalid product ID format on update:", id);
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  const { name, description, price, category, image, stock, partnerName, guidelines, howToUse } = req.body;

  // Validate common fields
  if (!name || !description || !price || !category || !image || stock === undefined || !partnerName) {
    return res.status(400).json({ success: false, message: "All fields are required!" });
  }
  // Conditional validation: For indoor/outdoor, guidelines required; for flowerseeds/fertilizer, howToUse required.
  if ((category === "indoor" || category === "outdoor") && !guidelines) {
    return res.status(400).json({ success: false, message: "Guidelines are required for indoor/outdoor plants!" });
  }
  if ((category === "flowerseeds" || category === "fertilizer") && !howToUse) {
    return res.status(400).json({ success: false, message: "HowToUse is required for flowerseeds/fertilizer products!" });
  }

  const updatedProduct = await Plant.findByIdAndUpdate(
    id,
    { name, description, price, category, image, stock, partnerName, guidelines, howToUse },
    { new: true }
  );

  if (!updatedProduct) {
    console.error("Product not found on update for ID:", id);
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  console.log("Product updated successfully:", updatedProduct);
  res.json({ success: true, message: "✅ Product updated successfully", data: updatedProduct });
} catch (error) {
  console.error("❌ Error updating product:", error);
  res.status(500).json({ success: false, message: "Failed to update product: " + error.message });
}
});

// ✅ Fetch Plants by Category (For User Dashboard)
app.get("/api/plants", async (req, res) => {
try {
  let category = req.query.category;
  if (!category) {
    return res.status(400).json({ success: false, message: "Category is required" });
  }
  category = category.toLowerCase();
  const plants = await Plant.find({ category }).lean();
  res.json({ success: true, data: plants });
} catch (error) {
  console.error("❌ Error fetching plants:", error);
  res.status(500).json({ success: false, message: "Server error" });
}
});

app.get("/api/search", async (req, res) => {
try {
  const query = req.query.q;
  console.log("Search Query:", query); // Log the query to check if it's being passed correctly
  
  if (!query) {
    return res.status(400).json({ success: false, message: "Search query is required" });
  }

  const searchResults = await Plant.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { category: { $regex: query, $options: "i" } },
    ],
  }).lean();

  console.log("Search Results:", searchResults); // Log the search results

  res.json({ success: true, data: searchResults });
} catch (error) {
  console.error("❌ Error searching plants:", error);
  res.status(500).json({ success: false, message: "Server error" });
}
});
// ✅ Serve Landing Page & Dashboards
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public/homepage.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "public/landing.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public/admin-dashboard.html")));

// ✅ Dynamic Route for Nursery Partner Dashboard
app.get("/nursery-dashboard", (req, res) => {
    const partnerEmail = req.query.partner;
    if (!partnerEmail) {
        return res.status(400).send("Partner email required.");
    }
    res.sendFile(path.join(__dirname, "public/nursery_dashboard.html"));
});



// ✅ Error handling middleware
app.use((err, req, res, next) => {
console.error("Unhandled error:", err);
res.status(500).json({ success: false, message: "Internal server error" });
});