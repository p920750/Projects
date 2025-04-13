const { MongoClient } = require("mongodb");
require("dotenv").config(); // Load environment variables

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function fixPlantData() {
  try {
    await client.connect();
    const db = client.db("Plantzo"); // Replace with your database name
    const plantsCollection = db.collection("plants");

    // ✅ Correct Partner Assignments
    const partnerAssignments = {
      "indoor": { name: "GreenLeaf Nursery", stock: 50 },
      "outdoor": { name: "FloraWorld", stock: 70 },
      "flowerseeds": { name: "Nature's Touch", stock: 60 },
      "fertilizer": { name: "FloraWorld", stock: 80 }
    };

    // ✅ Fetch all plants
    const plants = await plantsCollection.find({}).toArray();

    // ✅ Update each plant with correct stock & partner
    for (let plant of plants) {
      let category = plant.category?.toLowerCase();
      let partnerData = partnerAssignments[category] || { name: "Unknown", stock: 0 };

      await plantsCollection.updateOne(
        { _id: plant._id },
        { $set: { stock: partnerData.stock, partnerName: partnerData.name } }
      );
    }

    console.log(`✅ ${plants.length} plants updated with correct stock & partner names.`);
  } catch (err) {
    console.error("❌ Error updating plants:", err);
  } finally {
    await client.close();
  }
}

fixPlantData();