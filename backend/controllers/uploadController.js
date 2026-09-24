import multer from "multer"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import { getRequestBaseUrl } from "../utils/publicUrl.js"
import { v2 as cloudinary } from "cloudinary"
import streamifier from "streamifier"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load backend/.env before deciding which storage adapter to initialize.
dotenv.config({ path: path.join(__dirname, "..", ".env") })

// Detect Cloudinary configuration via environment variables
const useCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
)

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  })
}

// If Cloudinary is configured, use memory storage so we can stream the file buffer.
// Otherwise fall back to disk storage (existing behavior).
const storage = useCloudinary
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "..", "uploads"))
      },
      filename: function (req, file, cb) {
        const ext = path.extname(file.originalname)
        const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext
        cb(null, name)
      }
    })

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(new Error("Only image files are allowed"), false)
  }
}

export const uploadSingle = multer({ storage, fileFilter }).single("image")

export const uploadHandler = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" })
  }

  // If Cloudinary is enabled, upload the buffer and return the secure_url
  if (useCloudinary) {
    try {
      const result = await new Promise((resolve, reject) => {
        const upload_stream = cloudinary.uploader.upload_stream(
          { folder: process.env.CLOUDINARY_FOLDER || "shopez" },
          (error, result) => {
            if (error) return reject(error)
            resolve(result)
          }
        )

        streamifier.createReadStream(req.file.buffer).pipe(upload_stream)
      })

      return res.status(200).json({ url: result.secure_url })
    } catch (error) {
      console.error("Cloudinary upload error:", error)
      return res.status(500).json({ message: "Failed to upload to Cloudinary" })
    }
  }

  // Fallback: return local uploads URL
  const baseUrl = getRequestBaseUrl(req)
  const url = `${baseUrl}/uploads/${req.file.filename}`

  return res.status(200).json({ url })
}

export default {
  uploadSingle,
  uploadHandler
}
