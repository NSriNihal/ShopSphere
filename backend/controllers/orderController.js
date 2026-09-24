import User from "../models/userModel.js"
import Store from "../models/storeModel.js"
import Order from "../models/orderModel.js"
import Product from "../models/productModel.js"

const allowedTransitions = {
    placed: ["confirmed", "cancelled"],
    confirmed: ["packed", "cancelled"],
    packed: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: ["returned"],
    returned: ["refunded"]
}

// Create new order by user
export const createOrder = async (req, res) => {
    const reserved = []
    try {
        const {
            storeId,
            items,
            deliveryAddress,
            deliveryLocation,
            deliveryCharge = 0,
            couponCode
        } = req.body

        const user = await User.findById(req.userId)

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        if (user.role !== "user") {
            return res.status(403).json({ message: "Only users can create orders" })
        }

        if (!storeId || !deliveryAddress || !deliveryLocation ||
            deliveryLocation.latitude === undefined || deliveryLocation.longitude === undefined) {
            return res.status(400).json({ message: "Store, delivery address, and delivery location are required" })
        }

        const store = await Store.findById(storeId)

        if (!store) {
            return res.status(404).json({ message: "Store not found" })
        }

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Order items are required" })
        }

        const productIds = items.map((item) => item.product)
        const products = await Product.find({ _id: { $in: productIds }, store: store._id })
        const productMap = new Map(products.map((product) => [product._id.toString(), product]))
        let subtotal = 0
        const normalizedItems = []

        for (const item of items) {
            const product = productMap.get(item.product?.toString())
            const quantity = Number(item.quantity)
            if (!product || !Number.isInteger(quantity) || quantity < 1) {
                return res.status(400).json({ message: "Invalid product or quantity" })
            }
            if (!product.isAvailable || product.stock < quantity) {
                return res.status(409).json({ message: `${product.name} is out of stock` })
            }
            product.stock -= quantity
            await product.save()
            reserved.push({ product, quantity })
            subtotal += product.price * quantity
            normalizedItems.push({ product: product._id, name: product.name, quantity, price: product.price })
        }

        const total = subtotal + Number(deliveryCharge || 0)
        const order = await Order.create({
            user: req.userId,
            seller: store.seller,
            store: store._id,
            items: normalizedItems,
            deliveryAddress,
            deliveryLocation,
            subtotal,
            totalAmount: total,
            deliveryCharge: deliveryCharge || 0,
            couponCode,
            status: "placed"
        })

        return res.status(201).json({
            message: "Order created successfully",
            order
        })
    } catch (error) {
        await Promise.all(reserved.map(({ product, quantity }) => Product.findByIdAndUpdate(product._id, { $inc: { stock: quantity } })))
        return res.status(500).json({ message: "createOrder error", error })
    }
}

// Get logged-in user's orders
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.userId })
            .populate("store", "name address location")
            .populate("seller", "fullName mobile")
            .populate("deliveryBoy", "fullName mobile liveLocation")
            .sort({ createdAt: -1 })

        return res.status(200).json({
            count: orders.length,
            orders
        })
    } catch (error) {
        return res.status(500).json({ message: "getMyOrders error", error })
    }
}

// Get seller's store orders
export const getSellerOrders = async (req, res) => {
    try {
        const seller = await User.findById(req.userId)

        if (!seller || (seller.role !== "seller" && seller.role !== "owner")) {
            return res.status(403).json({ message: "Access denied. Seller only" })
        }

        const orders = await Order.find({ seller: req.userId })
            .populate("user", "fullName mobile email")
            .populate("store", "name address location")
            .populate("deliveryBoy", "fullName mobile liveLocation")
            .sort({ createdAt: -1 })

        return res.status(200).json({
            count: orders.length,
            orders
        })
    } catch (error) {
        return res.status(500).json({ message: "getSellerOrders error", error })
    }
}

// Get all orders for admin
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "fullName mobile email")
            .populate("seller", "fullName mobile email")
            .populate("store", "name address location")
            .populate("deliveryBoy", "fullName mobile liveLocation")
            .sort({ createdAt: -1 })

        return res.status(200).json({
            count: orders.length,
            orders
        })
    } catch (error) {
        return res.status(500).json({ message: "getAllOrders error", error })
    }
}

// Get single order by id
export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params

        const order = await Order.findById(orderId)
            .populate("user", "fullName mobile email")
            .populate("seller", "fullName mobile email")
            .populate("store", "name address location")
            .populate("deliveryBoy", "fullName mobile liveLocation")

        if (!order) {
            return res.status(404).json({ message: "Order not found" })
        }

        return res.status(200).json(order)
    } catch (error) {
        return res.status(500).json({ message: "getOrderById error", error })
    }
}

// Seller accepts order
export const acceptOrder = async (req, res) => {
    try {
        const { orderId } = req.params

        const seller = await User.findById(req.userId)

        if (!seller || (seller.role !== "seller" && seller.role !== "owner")) {
            return res.status(403).json({ message: "Access denied. Seller only" })
        }

        const order = await Order.findById(orderId)

        if (!order) {
            return res.status(404).json({ message: "Order not found" })
        }

        if (order.seller.toString() !== req.userId) {
            return res.status(403).json({ message: "You can only accept your own store orders" })
        }

        if (order.status !== "placed") {
            return res.status(400).json({ message: "Only placed orders can be confirmed" })
        }

        order.status = "confirmed"
        await order.save()

        return res.status(200).json({
            message: "Order accepted successfully",
            order
        })
    } catch (error) {
        return res.status(500).json({ message: "acceptOrder error", error })
    }
}

export const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
        const user = await User.findById(req.userId)
        if (!order || !user) return res.status(404).json({ message: "Order or user not found" })
        const ownsOrder = [order.user, order.seller, order.deliveryBoy].some((id) => id?.toString() === req.userId)
        if (!ownsOrder && user.role !== "admin") return res.status(403).json({ message: "Access denied" })
        const { status } = req.body
        if (!allowedTransitions[order.status]?.includes(status)) {
            return res.status(400).json({ message: `Cannot move order from ${order.status} to ${status}` })
        }
        order.status = status
        if (status === "delivered") order.deliveredAt = new Date()
        await order.save()
        return res.status(200).json({ message: "Order status updated", order })
    } catch (error) {
        return res.status(500).json({ message: "updateOrderStatus error", error })
    }
}

// Seller cancels order
export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params

        const user = await User.findById(req.userId)

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const order = await Order.findById(orderId)

        if (!order) {
            return res.status(404).json({ message: "Order not found" })
        }

        const isOwnerUser = order.user.toString() === req.userId
        const isSeller = order.seller.toString() === req.userId
        const isAdmin = user.role === "admin"

        if (!isOwnerUser && !isSeller && !isAdmin) {
            return res.status(403).json({ message: "You cannot cancel this order" })
        }

        if (!["placed", "confirmed", "packed"].includes(order.status)) {
            return res.status(400).json({ message: "This order can no longer be cancelled" })
        }

        order.status = "cancelled"
        await order.save()

        return res.status(200).json({
            message: "Order cancelled successfully",
            order
        })
    } catch (error) {
        return res.status(500).json({ message: "cancelOrder error", error })
    }
}

// Get orders by status
export const getOrdersByStatus = async (req, res) => {
    try {
        const { status } = req.params

        const allowedStatus = ["placed", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned", "refunded"]

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ message: "Invalid order status" })
        }

        const orders = await Order.find({ status })
            .populate("user", "fullName mobile email")
            .populate("seller", "fullName mobile email")
            .populate("store", "name address location")
            .populate("deliveryBoy", "fullName mobile liveLocation")
            .sort({ createdAt: -1 })

        return res.status(200).json({
            count: orders.length,
            orders
        })
    } catch (error) {
        return res.status(500).json({ message: "getOrdersByStatus error", error })
    }
}

export const createMultiVendorOrder = async (req, res) => {
    const { orders, deliveryAddress, deliveryLocation, deliveryCharge = 0 } = req.body
    if (!Array.isArray(orders) || orders.length === 0) {
        return res.status(400).json({ message: "At least one vendor order is required" })
    }
    const reserved = []
    try {
        const createdOrders = []
        for (const vendorOrder of orders) {
            const store = await Store.findById(vendorOrder.storeId)
            if (!store || !Array.isArray(vendorOrder.items) || vendorOrder.items.length === 0) {
                throw new Error("Invalid vendor order")
            }
            const products = await Product.find({
                _id: { $in: vendorOrder.items.map((item) => item.product) },
                store: store._id
            })
            const productMap = new Map(products.map((product) => [product._id.toString(), product]))
            let subtotal = 0
            const items = []
            for (const item of vendorOrder.items) {
                const product = productMap.get(item.product?.toString())
                const quantity = Number(item.quantity)
                if (!product || !Number.isInteger(quantity) || quantity < 1 || product.stock < quantity) {
                    throw new Error("A product is unavailable or out of stock")
                }
                product.stock -= quantity
                await product.save()
                reserved.push({ product, quantity })
                subtotal += product.price * quantity
                items.push({ product: product._id, name: product.name, quantity, price: product.price })
            }
            createdOrders.push(await Order.create({
                user: req.userId,
                seller: store.seller,
                store: store._id,
                items,
                deliveryAddress,
                deliveryLocation,
                subtotal,
                totalAmount: subtotal + Number(deliveryCharge) / orders.length,
                deliveryCharge: Number(deliveryCharge) / orders.length,
                status: "placed"
            }))
        }
        return res.status(201).json({ message: "Multi-vendor checkout created", orders: createdOrders })
    } catch (error) {
        await Promise.all(reserved.map(({ product, quantity }) => Product.findByIdAndUpdate(product._id, { $inc: { stock: quantity } })))
        return res.status(400).json({ message: error.message })
    }
}