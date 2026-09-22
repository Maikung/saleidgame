const express = require("express");
const { put } = require("@vercel/blob");
const { protect, allowRoles } = require("../middlewares/auth.middleware");

const router = express.Router();
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 4 * 1024 * 1024;

const safeFilename = (filename) => {
  const extension = filename.toLowerCase().match(/\.(jpe?g|png|webp)$/)?.[0] || "";
  return `accounts/${Date.now()}-${crypto.randomUUID()}${extension}`;
};

router.post(
  "/",
  protect,
  allowRoles("admin"),
  express.raw({ type: [...allowedTypes], limit: maxFileSize }),
  async (req, res, next) => {
    try {
      if (!allowedTypes.has(req.get("content-type")) || !req.body?.length) {
        return res.status(400).json({ message: "Upload a JPEG, PNG, or WebP image" });
      }

      const filename = String(req.query.filename || "upload");
      const blob = await put(safeFilename(filename), req.body, {
        access: "public",
        contentType: req.get("content-type"),
        addRandomSuffix: false,
      });

      return res.status(201).json({ url: blob.url, pathname: blob.pathname });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
