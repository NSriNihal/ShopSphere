import User from "../models/userModel.js"
import Order from "../models/orderModel.js"
import Earning from "../models/earningModel.js"
import Location from "../models/locationModel.js"

// Get delivery boy profile
export const getDeliveryBoyProfile = async (req, res) => {
    try {
        const deliveryBoy = await User.findById(req.userId).select("-password")

        if (!deliveryBoy) {
            return res.status(404).json({ message: "Delivery boy not found" })
        }

        if (deliveryBoy.role !== "deliveryBoy") {
            return res.status(403).json({ message: "Access denied. Delivery boy only" })
        }

        return res.status(200).json(deliveryBoy)
    } catch (error) {
        return res.status(500).json({ message: "getDeliveryBoyProfile error", error })
    }
}

// Update availability
export const updateAvailability = async (req, res) => {
    try {
        const { isAvailable } = req.body

        const deliveryBoy = await User.findById(req.userId)

        if (!deliveryBoy) {
            return res.status(404).json({ message: "Delivery boy not found" })
        }

        if (deliveryBoy.role !== "deliveryBoy") {
            return res.status(403).json({ message: "Access denied. Delivery boy only" })
        }

        deliveryBoy.isAvailable = isAvailable
        await deliveryBoy.save()

        return res.status(200).json({
            message: "Availability updated successfully",
            isAvailable: deliveryBoy.isAvailable
        })
    } catch (error) {
        return res.status(500).json({ message: "updateAvailability error", error })
    }
}

// Update live location
export const updateLiveLocation = async (req, res) => {
    try {
        const { latitude, longitude, orderId } = req.body

        if (!latitude || !longitude) {
            return res.status(400).json({ message: "Latitude and longitude are required" })
        }

        const deliveryBoy = await User.findById(req.userId)

        if (!deliveryBoy) {
            return res.status(404).json({ message: "Delivery boy not found" })
        }

        if (deliveryBoy.role !== "deliveryBoy") {
            return res.status(403).json({ message: "Access denied. Delivery boy only" })
        }

        deliveryBoy.liveLocation = {
            latitude,
            longitude,
            updatedAt: new Date()
        }

        await deliveryBoy.save()

        await Location.create({
            deliveryBoy: req.userId,
            order: orderId || null,
            latitude,
            longitude
        })

        return res.status(200).json({
            message: "Live location updated successfully",
            liveLocation: deliveryBoy.liveLocation
        })
    } catch (error) {
        return res.status(500).json({ message: "updateLiveLocation error", error })
    }
}

// Get assigned orders
export const getAssignedOrders = async (req, res) => {
    try {
        const deliveryBoy = await User.findById(req.userId)

        if (!deliveryBoy || deliveryBoy.role !== "deliveryBoy") {
            return res.status(403).json({ message: "Access denied. Delivery boy only" })
        }

        const orders = await Order.find({ deliveryBoy: req.userId })
            .populate("user", "fullName mobile email")
            .populate("seller", "fullName mobile email")
            .populate("store", "name address location")
            .sort({ createdAt: -1 })

        return res.status(200).json({
            count: orders.length,
            orders
        })
    } catch (error) {
        return res.status(500).json({ message: "getAssignedOrders error", error })
    }
}

// Update delivery status
export const updateDeliveryStatus = async (req, res) => {
    try {
        const { orderId } = req.params
        const { status } = req.body

        const allowedStatus = ["shipped", "delivered"]

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                message: "Invalid status. Use shipped or delivered"
            })
        }

        const order = await Order.findById(orderId)

        if (!order) {
            return res.status(404).json({ message: "Order not found" })
        }

        if (!order.deliveryBoy) {
            return res.status(400).json({ message: "No delivery boy assigned to this order" })
        }

        if (order.deliveryBoy.toString() !== req.userId) {
            return res.status(403).json({ message: "You are not assigned to this order" })
        }

        order.status = status

        if (status === "shipped") {
            order.dispatchedAt = new Date()
        }

        if (status === "delivered") {
            order.deliveredAt = new Date()

            const existingEarning = await Earning.findOne({
                deliveryBoy: req.userId,
                order: order._id
            })

            if (!existingEarning) {
                await Earning.create({
                    deliveryBoy: req.userId,
                    order: order._id,
                    amount: order.deliveryCharge || 0
                })
            }
        }

        await order.save()

        return res.status(200).json({
            message: "Order status updated successfully",
            order
        })
    } catch (error) {
        return res.status(500).json({ message: "updateDeliveryStatus error", error })
    }
}

// Earnings dashboard
export const getDeliveryBoyEarnings = async (req, res) => {
    try {
        const deliveryBoy = await User.findById(req.userId)

        if (!deliveryBoy || deliveryBoy.role !== "deliveryBoy") {
            return res.status(403).json({ message: "Access denied. Delivery boy only" })
        }

        const earnings = await Earning.find({ deliveryBoy: req.userId })
            .populate("order")
            .sort({ createdAt: -1 })

        const totalEarnings = earnings.reduce((total, item) => {
            return total + item.amount
        }, 0)

        const totalDeliveries = await Order.countDocuments({
            deliveryBoy: req.userId,
            status: "delivered"
        })

        return res.status(200).json({
            totalEarnings,
            totalDeliveries,
            earnings
        })
    } catch (error) {
        return res.status(500).json({ message: "getDeliveryBoyEarnings error", error })
    }
}