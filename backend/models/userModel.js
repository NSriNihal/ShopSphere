import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String
    },
    mobile:{
        type:String,
        required:true
    },
    role:{
        type:String,
        enum:["user","seller","owner","deliveryBoy","support","admin"],
        default:"user"
    },
    isAvailable:{
        type:Boolean,
        default:false 
    },
    liveLocation:{
        latitude:{
            type:Number
        },
        longitude:{
            type:Number
        },
        updatedAt:{
            type:Date
        }
    },
    addresses: [
    {
        label: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    }
    ]

},
{timestamps:true}
)

const User = mongoose.model("User",userSchema)

export default User