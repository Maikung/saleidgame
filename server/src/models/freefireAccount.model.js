const mongoose = require("mongoose");

const freeFireAccountSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true }, description: { type: String, trim: true, default: "" }, price: { type: Number, required: true, min: 0 }, level: { type: Number, required: true, min: 1 }, rank: { type: String, required: true, trim: true }, diamonds: { type: Number, default: 0, min: 0 }, skinCount: { type: Number, default: 0, min: 0 }, loginMethod: { type: String, enum: ["facebook", "google", "vk"], required: true }, imageUrl: { type: String, trim: true, default: "" }, status: { type: String, enum: ["available", "reserved", "sold"], default: "available" },
}, { timestamps: true });

module.exports = mongoose.model("FreeFireAccount", freeFireAccountSchema);
