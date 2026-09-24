import User from "../models/userModel.js"
import Order from "../models/orderModel.js"
import Store from "../models/storeModel.js"

// Admin dashboard stats
export const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments()
        const totalStores = await Store.countDocuments()
        const totalOrders = await Order.countDocuments()
        const totalDeliveryPartners = await User.countDocuments({ role: "deliveryBoy" })

        const pendingOrders = await Order.countDocuments({ status: { $in: ["placed", "confirmed", "packed"] } })
        const deliveredOrders = await Order.countDocuments({ status: "delivered" })
        const cancelledOrders = await Order.countDocuments({ status: "cancelled" })

        return res.status(200).json({
            totalUsers,
            totalStores,
            totalOrders,
            totalDeliveryPartners,
            pendingOrders,
            deliveredOrders,
            cancelledOrders
        })
    } catch (error) {
        return res.status(500).json({ message: "getAdminStats error", error })
    }
}

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 })

        return res.status(200).json({
            count: users.length,
            users
        })
    } catch (error) {
        return res.status(500).json({ message: "getAllUsers error", error })
    }
}

// Get all orders
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "fullName email mobile role")
            .populate("store", "name address")
            .populate("deliveryPartner", "fullName mobile")
            .sort({ createdAt: -1 })

        return res.status(200).json({
            count: orders.length,
            orders
        })
    } catch (error) {
        return res.status(500).json({ message: "getAllOrders error", error })
    }
}

// Get all stores
export const getAllStores = async (req, res) => {
    try {
        const stores = await Store.find().sort({ createdAt: -1 })

        return res.status(200).json({
            count: stores.length,
            stores
        })
    } catch (error) {
        return res.status(500).json({ message: "getAllStores error", error })
    }
}

// Get all delivery partners
export const getAllDeliveryPartners = async (req, res) => {
    try {
        const deliveryPartners = await User.find({ role: "deliveryBoy" }).sort({ createdAt: -1 })

        return res.status(200).json({
            count: deliveryPartners.length,
            deliveryPartners
        })
    } catch (error) {
        return res.status(500).json({ message: "getAllDeliveryPartners error", error })
    }
}

// Update user role
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params
        const { role } = req.body

        const allowedRoles = ["user", "admin", "seller", "owner", "deliveryBoy"]

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role" })
        }

        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        ).select("-password")

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        return res.status(200).json({
            message: "User role updated successfully",
            user
        })
    } catch (error) {
        return res.status(500).json({ message: "updateUserRole error", error })
    }
}

// Delete user
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params

        const user = await User.findByIdAndDelete(id)

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        return res.status(200).json({ message: "User deleted successfully" })
    } catch (error) {
        return res.status(500).json({ message: "deleteUser error", error })
    }
}