const express = require("express");
const { register, login, me, listUsers } = require("../controllers/auth.controller");
const { protect, allowRoles } = require("../middlewares/auth.middleware");

const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
router.get("/users", protect, allowRoles("admin"), listUsers);

module.exports = router;
