# Vercel deployment

1. Import the repository into Vercel.
2. In **Storage**, create or connect a Vercel Blob store. Vercel supplies `BLOB_READ_WRITE_TOKEN`.
3. Add these server-only environment variables in Vercel for each required environment:
   - `MONGO_URI`: MongoDB Atlas `mongodb+srv://` URI
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `ADMIN_REGISTRATION_CODE`
   - `BLOB_READ_WRITE_TOKEN`
4. In MongoDB Atlas, create a database user and permit Vercel network access.
5. Deploy. The configured build command produces `client/dist`; API traffic is served by `api/[...path].js`.

`POST /api/uploads/client` is the Vercel Blob client-upload handler. It grants only authenticated admins a short-lived token for a JPEG, PNG, or WebP under `account-images/`, with a 4 MB maximum. File bytes travel directly from the browser to Blob. Persist the `url` returned by `upload()` as the account's `imageUrl` in MongoDB Atlas.
