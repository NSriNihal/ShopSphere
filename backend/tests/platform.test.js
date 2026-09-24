import test from "node:test"
import assert from "node:assert/strict"
import Order from "../models/orderModel.js"
import Product from "../models/productModel.js"
import { Category, Coupon, Wishlist, ReturnRequest, SupportTicket, Notification, Settlement } from "../models/platformModels.js"

test("order lifecycle contains the capstone states", () => {
    const states = Order.schema.path("status").enumValues
    assert.deepEqual(states, ["placed", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned", "refunded"])
})

test("product model supports variants and moderation", () => {
    assert.ok(Product.schema.path("variants"))
    assert.deepEqual(Product.schema.path("moderationStatus").enumValues, ["pending", "approved", "rejected"])
})

test("platform models expose required marketplace domains", () => {
    for (const model of [Category, Coupon, Wishlist, ReturnRequest, SupportTicket, Notification, Settlement]) {
        assert.ok(model.modelName)
    }
})
