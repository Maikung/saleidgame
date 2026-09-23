const express = require("express");
const { handleUpload } = require("@vercel/blob/client");
const { protect, allowRoles } = require("../middlewares/auth.middleware");

const router = express.Router();
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 4 * 1024 * 1024;
const uploadPrefix = "account-images/";

const authorizeTokenRequest = (req, res, next) => {
  if (req.body?.type !== "blob.generate-client-token") return next();
  return protect(req, res, () => allowRoles("admin")(req, res, next));
};

router.post(
  "/client",
  authorizeTokenRequest,
  async (req, res, next) => {
    try {
      const response = await handleUpload({
        body: req.body,
        request: req,
        onBeforeGenerateToken: async (pathname) => {
          if (!pathname.startsWith(uploadPrefix)) throw new Error("Invalid upload destination");
          return { allowedContentTypes: [...allowedTypes], maximumSizeInBytes: maxFileSize, addRandomSuffix: true };
        },
        onUploadCompleted: async () => {},
      });

      return res.status(200).json(response);
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
