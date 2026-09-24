import User from "../models/userModel.js"
import Order from "../models/orderModel.js"
import Dispatch from "../models/dispatchModel.js"
import Store from "../models/storeModel.js"

const calculateDistanceInKm = (start, end) => {
    const toRadians = (value) => (value * Math.PI) / 180

    const startLat = Number(start?.latitude)
    const startLon = Number(start?.longitude)
    const endLat = Number(end?.latitude)
    const endLon = Number(end?.longitude)

    if (
        Number.isNaN(startLat) ||
        Number.isNaN(startLon) ||
        Number.isNaN(endLat) ||
        Number.isNaN(endLon)
    ) {
        return 0
    }

    const earthRadiusKm = 6371
    const deltaLat = toRadians(endLat - startLat)
    const deltaLon = toRadians(endLon - startLon)
    const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(toRadians(startLat)) *
            Math.cos(toRadians(endLat)) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)

    return Number((2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2))
}

const normalizeLocation = (location) => ({
    latitude: Number(location?.latitude) || 0,
    longitude: Number(location?.longitude) || 0
})

// Assign delivery boy to an order
export const assignDeliveryBoy = async (req, res) => {
    try {
        const { orderId } = req.params
        const { deliveryBoyId } = req.body

        const order = await Order.findById(orderId)

        if (!order) {
            return res.status(404).json({ message: "Order not found" })
        }

        const deliveryBoy = await User.findById(deliveryBoyId).select("-password")

        if (!deliveryBoy) {
            return res.status(404).json({ message: "Delivery boy not found" })
        }

        if (deliveryBoy.role !== "deliveryBoy") {
            return res.status(400).json({ message: "Selected user is not a delivery boy" })
        }

        if (!deliveryBoy.isAvailable) {
            return res.status(400).json({ message: "Delivery boy is not available" })
        }

        const store = await Store.findById(order.store)

        if (!order?.deliveryLocation) {
            return res.status(400).json({ message: "Store or delivery location not available" })
        }

        const pickupLocation = normalizeLocation(store?.location)
        const dropLocation = normalizeLocation(order.deliveryLocation)

        const distanceInKm = calculateDistanceInKm(pickupLocation, dropLocation)

        order.deliveryBoy = deliveryBoyId
        order.status = "shipped"
        await order.save()

        const dispatch = await Dispatch.create({
            order: order._id,
            seller: order.seller,
            deliveryBoy: deliveryBoyId,
            pickupLocation,
            dropLocation,
            distanceInKm,
            status: "assigned"
        })

        deliveryBoy.isAvailable = false
        await deliveryBoy.save()

        return res.status(200).json({
            message: "Delivery boy assigned successfully",
            order,
            dispatch
        })
    } catch (error) {
        return res.status(500).json({ message: "assignDeliveryBoy error", error })
    }
}

// Get all dispatches
export const getAllDispatches = async (req, res) => {
    try {
        const dispatches = await Dispatch.find()
            .populate("order")
            .populate("seller", "fullName email mobile")
            .populate("deliveryBoy", "fullName email mobile liveLocation")
            .sort({ createdAt: -1 })

        return res.status(200).json({
            count: dispatches.length,
            dispatches
        })
    } catch (error) {
        return res.status(500).json({ message: "getAllDispatches error", error })
    }
}

// Get single dispatch by id
export const getDispatchById = async (req, res) => {
    try {
        const { id } = req.params

        const dispatch = await Dispatch.findById(id)
            .populate("order")
            .populate("seller", "fullName email mobile")
            .populate("deliveryBoy", "fullName email mobile liveLocation")

        if (!dispatch) {
            return res.status(404).json({ message: "Dispatch not found" })
        }

        return res.status(200).json(dispatch)
    } catch (error) {
        return res.status(500).json({ message: "getDispatchById error", error })
    }
}

// Get dispatch by order id
export const getDispatchByOrder = async (req, res) => {
    try {
        const { orderId } = req.params

        const dispatch = await Dispatch.findOne({ order: orderId })
            .populate("order")
            .populate("seller", "fullName email mobile")
            .populate("deliveryBoy", "fullName email mobile liveLocation")

        if (!dispatch) {
            return res.status(404).json({ message: "Dispatch not found for this order" })
        }

        return res.status(200).json(dispatch)
    } catch (error) {
        return res.status(500).json({ message: "getDispatchByOrder error", error })
    }
}

// Update dispatch status
export const updateDispatchStatus = async (req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body

        const allowedStatus = ["assigned", "picked", "dispatched", "delivered", "cancelled"]

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ message: "Invalid dispatch status" })
        }

        const dispatch = await Dispatch.findById(id)

        if (!dispatch) {
            return res.status(404).json({ message: "Dispatch not found" })
        }

        dispatch.status = status
        await dispatch.save()

        const order = await Order.findById(dispatch.order)

        if (order) {
            order.status = status === "dispatched" ? "shipped" : status
            await order.save()
        }

        if (status === "delivered" || status === "cancelled") {
            await User.findByIdAndUpdate(dispatch.deliveryBoy, {
                isAvailable: true
            })
        }

        return res.status(200).json({
            message: "Dispatch status updated successfully",
            dispatch
        })
    } catch (error) {
        return res.status(500).json({ message: "updateDispatchStatus error", error })
    }
}

// Get available delivery boys
export const getAvailableDeliveryBoys = async (req, res) => {
    try {
        const deliveryBoys = await User.find({
            role: "deliveryBoy",
            isAvailable: true
        }).select("-password")

        return res.status(200).json({
            count: deliveryBoys.length,
            deliveryBoys
        })
    } catch (error) {
        return res.status(500).json({ message: "getAvailableDeliveryBoys error", error })
    }
}