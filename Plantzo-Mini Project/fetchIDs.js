const mongoose = require("mongoose");

// Import the Order and Partner models
const Order = require("./models/Order");
const Partner = require("./models/Partner");

// Define the Plant schema inside this file
const plantSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  stock: Number,
  description: String,
  partnerId: mongoose.Schema.Types.ObjectId, // Reference to Partner
});

// Create the Plant model
const Plant = mongoose.model("Plant", plantSchema);

// Connect to MongoDB Atlas
mongoose.connect("mongodb+srv://krishnagowri936:kFu3V7XxSrgSbCbi@cluster0.bg3zw.mongodb.net/Plantzo?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Fetch orders, plants, and partners
async function fetchIDs() {
  try {
    // ✅ Find orders related to Green Leaf Nursery and Nature's Touch (Partners)
    const partners = await Partner.find({
      name: { $in: ["GreenLeaf Nursery", "Nature's Touch"] },
    });

    // ✅ Find plants (instead of products)
    const plants = await Plant.find({
      name: { $in: ["Spider Plant", "Morning Glory Seeds", "Fiddle Leaf Fig"] },
    });

    console.log("\n✅ Partner IDs:");
    partners.forEach(partner => console.log(partner.name, "=>", partner._id));

    console.log("\n✅ Plant IDs:");
    plants.forEach(plant => console.log(plant.name, "=>", plant._id));

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error fetching IDs:", error);
  }
}

// Run the function
fetchIDs();
