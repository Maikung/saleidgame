const FreeFireAccount = require("../models/freefireAccount.model");
const Order = require("../models/order.model");

const getAccounts = async (req, res, next) => { try { res.json({ accounts: await FreeFireAccount.find().sort({ createdAt: -1 }) }); } catch (error) { next(error); } };
const getAccount = async (req, res, next) => { try { const account = await FreeFireAccount.findById(req.params.id); if (!account) return res.status(404).json({ message: "Free Fire account not found" }); res.json({ account }); } catch (error) { next(error); } };
const createAccount = async (req, res, next) => { try { res.status(201).json({ account: await FreeFireAccount.create(req.body) }); } catch (error) { next(error); } };
const updateAccount = async (req, res, next) => { try { const account = await FreeFireAccount.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!account) return res.status(404).json({ message: "Free Fire account not found" }); res.json({ account }); } catch (error) { next(error); } };
const deleteAccount = async (req, res, next) => { try { const account = await FreeFireAccount.findByIdAndDelete(req.params.id); if (!account) return res.status(404).json({ message: "Free Fire account not found" }); res.json({ message: "Free Fire account deleted" }); } catch (error) { next(error); } };
const buyAccount = async (req, res, next) => { try { const account = await FreeFireAccount.findOneAndUpdate({ _id: req.params.id, status: "available" }, { status: "reserved" }, { new: true }); if (!account) return res.status(409).json({ message: "This account is no longer available" }); const order = await Order.create({ buyer: req.user.id, gameAccount: account._id, price: account.price, status: "pending" }); res.status(201).json({ message: "Purchase request created", order, account }); } catch (error) { next(error); } };

module.exports = { getAccounts, getAccount, createAccount, updateAccount, deleteAccount, buyAccount };
