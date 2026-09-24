import Product from "../models/productModel.js"
import Order from "../models/orderModel.js"
import {
    Category, Coupon, Wishlist, ReturnRequest, SupportTicket,
    Notification, Settlement
} from "../models/platformModels.js"

const isStaff = (role) => ["admin", "support"].includes(role)

export const listCategories = async (req, res) => {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 })
    return res.json({ categories })
}

export const createCategory = async (req, res) => {
    const category = await Category.create(req.body)
    return res.status(201).json({ category })
}

export const updateCategory = async (req, res) => {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!category) return res.status(404).json({ message: "Category not found" })
    return res.json({ category })
}

export const createCoupon = async (req, res) => {
    const coupon = await Coupon.create(req.body)
    return res.status(201).json({ coupon })
}

export const listCoupons = async (req, res) => res.json({ coupons: await Coupon.find().sort({ createdAt: -1 }) })

export const deleteCoupon = async (req, res) => {
    const coupon = await Coupon.findByIdAndDelete(req.params.id)
    if (!coupon) return res.status(404).json({ message: "Coupon not found" })
    return res.json({ message: "Coupon deleted" })
}

export const validateCoupon = async (req, res) => {
    const { code, subtotal = 0 } = req.body
    const coupon = await Coupon.findOne({ code: code?.toUpperCase(), isActive: true })
    if (!coupon || coupon.expiresAt <= new Date() || subtotal < coupon.minimumOrder ||
        (coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit)) {
        return res.status(400).json({ message: "Coupon is invalid or expired" })
    }
    const discount = coupon.discountType === "percentage"
        ? Math.min(subtotal, subtotal * coupon.value / 100)
        : Math.min(subtotal, coupon.value)
    return res.json({ code: coupon.code, discount, total: subtotal - discount })
}

export const getWishlist = async (req, res) => {
    const wishlist = await Wishlist.findOne({ user: req.userId }).populate("products")
    return res.json({ products: wishlist?.products || [] })
}

export const updateWishlist = async (req, res) => {
    const { productId } = req.body
    const wishlist = await Wishlist.findOneAndUpdate(
        { user: req.userId },
        { $addToSet: { products: productId } },
        { new: true, upsert: true }
    ).populate("products")
    return res.json({ products: wishlist.products })
}

export const removeFromWishlist = async (req, res) => {
    const wishlist = await Wishlist.findOneAndUpdate(
        { user: req.userId },
        { $pull: { products: req.params.productId } },
        { new: true }
    ).populate("products")
    return res.json({ products: wishlist?.products || [] })
}

export const createReturn = async (req, res) => {
    const order = await Order.findOne({ _id: req.body.orderId, user: req.userId })
    if (!order || order.status !== "delivered") return res.status(400).json({ message: "Only delivered orders can be returned" })
    const request = await ReturnRequest.create({ order: order._id, user: req.userId, reason: req.body.reason })
    order.status = "returned"
    await order.save()
    return res.status(201).json({ request })
}

export const listReturns = async (req, res) => {
    const filter = isStaff(req.userRole) ? {} : { user: req.userId }
    return res.json({ returns: await ReturnRequest.find(filter).populate("order user").sort({ createdAt: -1 }) })
}

export const updateReturn = async (req, res) => {
    const request = await ReturnRequest.findByIdAndUpdate(req.params.id, {
        status: req.body.status,
        resolutionNote: req.body.resolutionNote
    }, { new: true, runValidators: true })
    if (!request) return res.status(404).json({ message: "Return request not found" })
    if (request.status === "refunded") await Order.findByIdAndUpdate(request.order, { status: "refunded", paymentStatus: "refunded" })
    return res.json({ request })
}

export const createTicket = async (req, res) => {
    const ticket = await SupportTicket.create({ ...req.body, user: req.userId })
    return res.status(201).json({ ticket })
}

export const listTickets = async (req, res) => {
    const filter = isStaff(req.userRole) ? {} : { user: req.userId }
    return res.json({ tickets: await SupportTicket.find(filter).populate("user order").sort({ createdAt: -1 }) })
}

export const updateTicket = async (req, res) => {
    const updates = { status: req.body.status }
    if (req.body.message) updates.$push = { messages: { author: req.userId, body: req.body.message } }
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    if (!ticket) return res.status(404).json({ message: "Support ticket not found" })
    return res.json({ ticket })
}

export const listNotifications = async (req, res) => res.json({ notifications: await Notification.find({ user: req.userId }).sort({ createdAt: -1 }) })

export const markNotificationRead = async (req, res) => {
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.userId }, { readAt: new Date() }, { new: true })
    if (!notification) return res.status(404).json({ message: "Notification not found" })
    return res.json({ notification })
}

export const generateProductCopy = async (req, res) => {
    const { name, category, attributes = [], audience = "online shoppers" } = req.body
    if (!name || !category) return res.status(400).json({ message: "Name and category are required" })
    const sellingPoints = attributes.slice(0, 5).map((attribute) => `Designed for ${attribute}`)
    return res.json({
        description: `${name} is a dependable ${category} product for ${audience}. It combines practical design with everyday usability.`,
        sellingPoints
    })
}

export const semanticProductSearch = async (req, res) => {
    const query = String(req.query.q || "").trim()
    if (!query) return res.json({ products: [] })
    const terms = query.split(/\s+/).filter(Boolean).slice(0, 8)
    const pattern = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")
    const products = await Product.find({
        moderationStatus: { $ne: "rejected" },
        $or: [{ name: { $regex: pattern, $options: "i" } }, { description: { $regex: pattern, $options: "i" } }, { category: { $regex: pattern, $options: "i" } }]
    }).limit(40).sort({ averageRating: -1, reviewCount: -1 })
    return res.json({ query, products })
}

export const moderateProduct = async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, { moderationStatus: req.body.status }, { new: true, runValidators: true })
    if (!product) return res.status(404).json({ message: "Product not found" })
    return res.json({ product })
}

export const getSellerSettlements = async (req, res) => {
    const settlements = await Settlement.find({ seller: req.userId }).populate("order").sort({ createdAt: -1 })
    return res.json({ settlements })
}
