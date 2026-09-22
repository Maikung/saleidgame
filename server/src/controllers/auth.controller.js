const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const publicUser = (user) => ({ id: user._id, username: user.username, email: user.email, phone: user.phone, role: user.role, walletBalance: user.walletBalance, createdAt: user.createdAt });
const createToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "development-only-secret", { expiresIn: "7d" });

const register = async (req, res, next) => {
  try {
    const { username, email, password, phone, role = "user", adminCode } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: "username, email and password are required" });
    if (password.length < 8) return res.status(400).json({ message: "Password must contain at least 8 characters" });
    if (!["user", "admin"].includes(role)) return res.status(400).json({ message: "Invalid role" });
    if (role === "admin" && (!process.env.ADMIN_REGISTRATION_CODE || adminCode !== process.env.ADMIN_REGISTRATION_CODE)) {
      return res.status(403).json({ message: "A valid admin registration code is required" });
    }
    const duplicate = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (duplicate) return res.status(409).json({ message: "Email or username is already in use" });
    const user = await User.create({ username, email: email.toLowerCase(), password: await bcrypt.hash(password, 12), phone, role });
    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() }).select("+password");
    if (!user || !(await bcrypt.compare(password || "", user.password))) return res.status(401).json({ message: "Invalid email or password" });
    res.json({ token: createToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
};

const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
};

const listUsers = async (req, res, next) => {
  try { res.json({ users: (await User.find().sort({ createdAt: -1 })).map(publicUser) }); } catch (error) { next(error); }
};

module.exports = { register, login, me, listUsers };
