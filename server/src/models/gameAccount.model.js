const mongoose = require("mongoose");

const gameAccountSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    level: { type: Number, required: true },
    rank: { type: String, trim: true },
    diamonds: { type: Number, default: 0 },
    skinCount: { type: Number, default: 0 },
    loginMethod: { type: String, enum: ["facebook", "google", "vk", "guest"], required: true },
    images: [{ type: String }],
    status: { type: String, enum: ["available", "reserved", "sold"], default: "available" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GameAccount", gameAccountSchema);