import express from "express"
import {
    createOrder,
    createMultiVendorOrder,
    getMyOrders,
    getSellerOrders,
    getAllOrders,
    getOrderById,
    acceptOrder,
    cancelOrder,
    getOrdersByStatus,
    updateOrderStatus
} from "../controllers/orderController.js"

import isAuth, { isAdmin } from "../middlewares/isAuth.js"

const orderRouter = express.Router()

orderRouter.post("/", isAuth, createOrder)
orderRouter.post("/checkout/multi", isAuth, createMultiVendorOrder)

orderRouter.get("/my", isAuth, getMyOrders)
orderRouter.get("/seller", isAuth, getSellerOrders)
orderRouter.get("/status/:status", isAuth, getOrdersByStatus)
orderRouter.get("/", isAdmin, getAllOrders)
orderRouter.get("/:orderId", isAuth, getOrderById)

orderRouter.put("/:orderId/accept", isAuth, acceptOrder)
orderRouter.put("/:orderId/cancel", isAuth, cancelOrder)
orderRouter.put("/:orderId/status", isAuth, updateOrderStatus)

export default orderRouter