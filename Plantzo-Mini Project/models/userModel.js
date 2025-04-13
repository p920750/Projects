const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "nurserypartner", "user"], default: "user" } // Added "nurserypartner"
});

// ✅ Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    return next(error);
  }
});

// ✅ Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

// ✅ Function to limit admin accounts to 2
async function ensureAdminLimit() {
  const adminCount = await User.countDocuments({ role: "admin" });
  if (adminCount >= 2) {
    console.log("⚠️ Admin limit reached (2 admins max).");
  }
}

ensureAdminLimit();

module.exports = User;
