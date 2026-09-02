import { connect } from "mongoose"

const localDbUrl = "mongodb://127.0.0.1:27017/shopsphere"

const normalizeDbUrl = (dbUrl) => {
    if (!dbUrl) return localDbUrl

    try {
        const parsed = new URL(dbUrl)
        if (parsed.pathname && parsed.pathname !== "/") {
            parsed.pathname = parsed.pathname.toLowerCase()
        }
        return parsed.toString()
    } catch (error) {
        return dbUrl.replace(/\/[^/?#]+(?=[?#]|$)/, "/shopsphere")
    }
}

const connectDb = async () => {
    const dbUrl = normalizeDbUrl(process.env.DB_URL)

    try {
        if (!process.env.DB_URL) {
            console.warn("DB_URL is missing; falling back to local MongoDB")
        }

        await connect(dbUrl)
        console.log("MongoDB connected")
    } catch (error) {
        console.warn("Primary MongoDB connection failed. Retrying with local MongoDB...")
        console.warn(error.message)

        try {
            await connect(localDbUrl)
            console.log("Local MongoDB connected after fallback")
        } catch (fallbackError) {
            console.error("MongoDB fallback failed:", fallbackError.message)
            throw fallbackError
        }
    }
}

export default connectDb