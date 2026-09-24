
import express from "express"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, ".env") })
import connectDb from "./config/db.js"
import cookieParser from "cookie-parser"
import authRouter from "./routes/authRoute.js"
import cors from "cors"
import userRouter from "./routes/userRoute.js"
import adminRouter from "./routes/adminRoutes.js"
import dispatchRouter from "./routes/dispatchRoutes.js"
import earningRouter from "./routes/earningRoutes.js"
import orderRouter from "./routes/orderRoutes.js"
import sellerRouter from "./routes/sellerRoutes.js"
import storeRouter from "./routes/storeRoutes.js"
import trackingRouter from "./routes/trackingRoutes.js"
import deliveryBoyRouter from "./routes/deliveryBoyRoutes.js"
import uploadRouter from "./routes/uploadRoute.js"
import reviewRouter from "./routes/reviewRoutes.js"
import platformRouter from "./routes/platformRoutes.js"

const app = express()  //now we can access express functionalities through app
app.set("trust proxy", 1)
const port = process.env.PORT || 5000 //accessing from .env file
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:8000",
    "https://shopez.vercel.app",
    "https://shopez-peach.vercel.app",
    "https://shop-sphere-brown-delta.vercel.app"
]

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin like mobile apps or curl
        if (!origin) return callback(null, true)

        // Normalize trailing slash differences between environments.
        const normalizedOrigin = origin.replace(/\/$/, "")
        if (allowedOrigins.includes(normalizedOrigin)) {
            callback(null, true)
        } else {
            callback(new Error('CORS policy: Origin not allowed'))
        }
    },
    credentials: true
}))
app.use(express.json())  //converting data into json
app.use(cookieParser())
app.use("/api/auth",authRouter)
app.use("/api/user",userRouter)
app.use("/api/admin",adminRouter)
app.use("/api/dispatch", dispatchRouter)
app.use("/api/earnings", earningRouter)
app.use("/api/orders", orderRouter)
app.use("/api/seller", sellerRouter)
app.use("/api/stores", storeRouter)
app.use("/api/tracking", trackingRouter)
app.use("/api/delivery-boy", deliveryBoyRouter)
app.use("/api/reviews", reviewRouter)
app.use("/api/platform", platformRouter)

// Backward-compatible mounts for clients still calling non-/api paths.
app.use("/user", userRouter)
app.use("/stores", storeRouter)
// expose uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
// upload endpoint
app.use('/api/uploads', uploadRouter)

const startServer = async () => {
    try {
        await connectDb()
        app.listen(port, () => {
            console.log("server Started at ", port)
        })
    } catch (error) {
        console.error("Server startup error", error)
        process.exit(1)
    }
}

startServer()

