const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    gameAccount: { type: mongoose.Schema.Types.ObjectId, ref: "GameAccount", required: true },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "delivered", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);