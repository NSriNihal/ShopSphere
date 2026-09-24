import mongoose from "mongoose"

const productSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    price: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    variants: [{
        name: { type: String, required: true },
        options: [{ type: String }],
        price: { type: Number },
        stock: { type: Number, default: 0 }
    }],
    category: {
        type: String,
        default: "general"
    },
    image: {
        type: String
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    averageRating: {
        type: Number,
        default: 0
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    moderationStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    }
}, { timestamps: true })

const Product = mongoose.model("Product", productSchema)

export default Product