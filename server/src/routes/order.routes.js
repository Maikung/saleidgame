const express = require("express");
const controller = require("../controllers/order.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();
router.post("/:orderId/pay", protect, controller.simulatePayment);

module.exports = router;
