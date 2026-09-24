import User from "../models/userModel.js"
import Store from "../models/storeModel.js"
import Product from "../models/productModel.js"
import Order from "../models/orderModel.js"
import { normalizeAssetUrl } from "../utils/publicUrl.js"

// Get seller profile
export const getSellerProfile = async (req, res) => {
    try {
        const seller = await User.findById(req.userId).select("-password")

        if (!seller) {
            return res.status(404).json({ message: "Seller not found" })
        }

        if (seller.role !== "seller" && seller.role !== "owner") {
            return res.status(403).json({ message: "Access denied. Seller only" })
        }

        return res.status(200).json(seller)
    } catch (error) {
        return res.status(500).json({ message: "getSellerProfile error", error })
    }
}

// Create seller store
export const createStore = async (req, res) => {
    try {
        const { name, category, address, location } = req.body

        const seller = await User.findById(req.userId)

        if (!seller || (seller.role !== "seller" && seller.role !== "owner")) {
            return res.status(403).json({ message: "Access denied. Seller only" })
        }

        const existingStore = await Store.findOne({ seller: req.userId })

        if (existingStore) {
            return res.status(400).json({ message: "Seller already has a store" })
        }

        const store = await Store.create({
            seller: req.userId,
            name,
            category,
            address,
            location
        })

        return res.status(201).json({
            message: "Store created successfully",
            store
        })
    } catch (error) {
        return res.status(500).json({ message: "createStore error", error })
    }
}

// Get seller store
export const getMyStore = async (req, res) => {
    try {
        const store = await Store.findOne({ seller: req.userId })

        if (!store) {
            return res.status(404).json({ message: "Store not found" })
        }

        return res.status(200).json(store)
    } catch (error) {
        return res.status(500).json({ message: "getMyStore error", error })
    }
}

// Update seller store
export const updateMyStore = async (req, res) => {
    try {
        const { name, category, address, location, isOpen } = req.body

        const store = await Store.findOne({ seller: req.userId })

        if (!store) {
            return res.status(404).json({ message: "Store not found" })
        }

        store.name = name || store.name
        store.category = category || store.category
        store.address = address || store.address
        store.location = location || store.location

        if (isOpen !== undefined) {
            store.isOpen = isOpen
        }

        await store.save()

        return res.status(200).json({
            message: "Store updated successfully",
            store
        })
    } catch (error) {
        return res.status(500).json({ message: "updateMyStore error", error })
    }
}

// Add product
export const addProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, image } = req.body

        const store = await Store.findOne({ seller: req.userId })

        if (!store) {
            return res.status(404).json({ message: "Create store first" })
        }

        const product = await Product.create({
            seller: req.userId,
            store: store._id,
            name,
            description,
            price,
            stock,
            category,
            image
        })

        return res.status(201).json({
            message: "Product added successfully",
            product
        })
    } catch (error) {
        return res.status(500).json({ message: "addProduct error", error })
    }
}

// Get seller products
export const getMyProducts = async (req, res) => {
    try {
        const products = await Product.find({ seller: req.userId }).sort({ createdAt: -1 })

        const normalizedProducts = products.map((product) => {
            const productData = product.toObject()
            productData.image = normalizeAssetUrl(productData.image, req)
            return productData
        })

        return res.status(200).json({
            count: normalizedProducts.length,
            products: normalizedProducts
        })
    } catch (error) {
        return res.status(500).json({ message: "getMyProducts error", error })
    }
}

// Update product
export const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params
        const { name, description, price, stock, category, image, isAvailable } = req.body

        const product = await Product.findById(productId)

        if (!product) {
            return res.status(404).json({ message: "Product not found" })
        }

        if (product.seller.toString() !== req.userId) {
            return res.status(403).json({ message: "You can update only your own products" })
        }

        product.name = name || product.name
        product.description = description || product.description
        product.price = price || product.price
        product.stock = stock || product.stock
        product.category = category || product.category
        product.image = image || product.image

        if (isAvailable !== undefined) {
            product.isAvailable = isAvailable
        }

        await product.save()

        return res.status(200).json({
            message: "Product updated successfully",
            product
        })
    } catch (error) {
        return res.status(500).json({ message: "updateProduct error", error })
    }
}

// Delete product
export const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params

        const product = await Product.findById(productId)

        if (!product) {
            return res.status(404).json({ message: "Product not found" })
        }

        if (product.seller.toString() !== req.userId) {
            return res.status(403).json({ message: "You can delete only your own products" })
        }

        await product.deleteOne()

        return res.status(200).json({ message: "Product deleted successfully" })
    } catch (error) {
        return res.status(500).json({ message: "deleteProduct error", error })
    }
}

// Get seller orders
export const getSellerOrders = async (req, res) => {
    try {
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

// Seller dashboard
export const getSellerDashboard = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments({ seller: req.userId })
        const totalOrders = await Order.countDocuments({ seller: req.userId })

        const pendingOrders = await Order.countDocuments({
            seller: req.userId,
            status: { $in: ["placed", "confirmed", "packed"] }
        })

        const deliveredOrders = await Order.countDocuments({
            seller: req.userId,
            status: "delivered"
        })

        const orders = await Order.find({ seller: req.userId })

        const totalSales = orders.reduce((total, order) => {
            if (order.status === "delivered") {
                return total + order.totalAmount
            }

            return total
        }, 0)

        return res.status(200).json({
            totalProducts,
            totalOrders,
            pendingOrders,
            deliveredOrders,
            totalSales
        })
    } catch (error) {
        return res.status(500).json({ message: "getSellerDashboard error", error })
    }
}