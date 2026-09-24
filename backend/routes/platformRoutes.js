import express from "express"
import isAuth, { isAdmin } from "../middlewares/isAuth.js"
import {
    listCategories, createCategory, updateCategory,
    createCoupon, listCoupons, deleteCoupon, validateCoupon,
    getWishlist, updateWishlist, removeFromWishlist,
    createReturn, listReturns, updateReturn,
    createTicket, listTickets, updateTicket,
    listNotifications, markNotificationRead,
    generateProductCopy, semanticProductSearch, moderateProduct,
    getSellerSettlements
} from "../controllers/platformController.js"

const router = express.Router()
const staffOnly = (req, res, next) => {
    if (!["admin", "support"].includes(req.userRole)) return res.status(403).json({ message: "Staff access required" })
    next()
}
const sellerOnly = (req, res, next) => {
    if (!["seller", "owner"].includes(req.userRole)) return res.status(403).json({ message: "Seller access required" })
    next()
}

router.get("/categories", listCategories)
router.post("/categories", isAuth, isAdmin, createCategory)
router.put("/categories/:id", isAuth, isAdmin, updateCategory)

router.post("/coupons/validate", isAuth, validateCoupon)
router.get("/coupons", isAuth, isAdmin, listCoupons)
router.post("/coupons", isAuth, isAdmin, createCoupon)
router.delete("/coupons/:id", isAuth, isAdmin, deleteCoupon)

router.get("/wishlist", isAuth, getWishlist)
router.post("/wishlist", isAuth, updateWishlist)
router.delete("/wishlist/:productId", isAuth, removeFromWishlist)

router.post("/returns", isAuth, createReturn)
router.get("/returns", isAuth, listReturns)
router.put("/returns/:id", isAuth, staffOnly, updateReturn)

router.post("/tickets", isAuth, createTicket)
router.get("/tickets", isAuth, listTickets)
router.put("/tickets/:id", isAuth, staffOnly, updateTicket)

router.get("/notifications", isAuth, listNotifications)
router.put("/notifications/:id/read", isAuth, markNotificationRead)

router.post("/ai/product-copy", isAuth, sellerOnly, generateProductCopy)
router.get("/ai/products/search", semanticProductSearch)
router.put("/moderation/products/:id", isAuth, isAdmin, moderateProduct)
router.get("/settlements", isAuth, sellerOnly, getSellerSettlements)

export default router
