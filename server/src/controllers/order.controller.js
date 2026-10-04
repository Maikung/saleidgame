const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Payment = require("../models/payment.model");
const FreeFireAccount = require("../models/freefireAccount.model");

const simulatePayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({ _id: req.params.orderId, buyer: req.user.id, status: "pending" }).session(session);
      if (!order) {
        const error = new Error("Pending order not found");
        error.status = 404;
        throw error;
      }

      const method = req.body.method;
      if (!["promptpay", "truemoney", "bank_transfer"].includes(method)) {
        const error = new Error("Choose a valid payment method");
        error.status = 400;
        throw error;
      }

      const account = await FreeFireAccount.findOneAndUpdate(
        { _id: order.gameAccount, status: "reserved" },
        { status: "sold" },
        { new: true, session }
      );
      if (!account) {
        const error = new Error("This account is no longer reserved for the order");
        error.status = 409;
        throw error;
      }

      order.status = "paid";
      await order.save({ session });
      const [payment] = await Payment.create([{
        order: order._id,
        amount: order.price,
        method,
        status: "verified",
      }], { session });
      result = { order, payment, account };
    });

    res.json({ message: "Simulated payment completed", ...result });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  } finally {
    await session.endSession();
  }
};

module.exports = { simulatePayment };
