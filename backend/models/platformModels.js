import mongoose from "mongoose"

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    description: String,
    isActive: { type: Boolean, default: true }
}, { timestamps: true })

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    minimumOrder: { type: Number, default: 0 },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true })

const wishlistSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }]
}, { timestamps: true })

const returnSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["requested", "approved", "rejected", "refunded"], default: "requested" },
    resolutionNote: String
}, { timestamps: true })

const supportTicketSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
    messages: [{ author: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, body: String, createdAt: { type: Date, default: Date.now } }]
}, { timestamps: true })

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    readAt: Date
}, { timestamps: true })

const settlementSchema = new mongoose.Schema({
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    grossAmount: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "paid"], default: "pending" }
}, { timestamps: true })

export const Category = mongoose.model("Category", categorySchema)
export const Coupon = mongoose.model("Coupon", couponSchema)
export const Wishlist = mongoose.model("Wishlist", wishlistSchema)
export const ReturnRequest = mongoose.model("ReturnRequest", returnSchema)
export const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema)
export const Notification = mongoose.model("Notification", notificationSchema)
export const Settlement = mongoose.model("Settlement", settlementSchema)
