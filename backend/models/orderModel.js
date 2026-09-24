import mongoose from "mongoose"

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },
    name:{
        type:String,
        required:true
    },
    quantity:{
        type:Number,
        required:true,
        default:1
    },
    price:{
        type:Number,
        required:true
    }
},{_id:false})

const orderSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    seller:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    store:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Store",
        required:true
    },
    deliveryBoy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    items:[orderItemSchema],
    deliveryAddress:{
        type:String,
        required:true
    },
    deliveryLocation:{
        latitude:{
            type:Number,
            required:true
        },
        longitude:{
            type:Number,
            required:true
        }
    },
    totalAmount:{
        type:Number,
        required:true
    },
    subtotal:{
        type:Number,
        required:true
    },
    deliveryCharge:{
        type:Number,
        default:0
    },
    status:{
        type:String,
        enum:["placed", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned", "refunded"],
        default:"placed"
    },
    paymentStatus:{
        type:String,
        enum:["pending", "paid", "refunded"],
        default:"pending"
    },
    couponCode:{
        type:String,
        trim:true
    },
    dispatchedAt:{
        type:Date
    },
    deliveredAt:{
        type:Date
    }
},{timestamps:true})
const Order = mongoose.model("Order", orderSchema)

export default Order