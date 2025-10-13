const mongoose=require("mongoose")

const chatSchma=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
    },
    title:{
        type:String,
        required:true,
    },
    lastActivity:{
        type:Date,
        default:Date.now
    }
},{
    timestamps:true
})


const chatModel=mongoose.model("chat",chatSchma)


module.exports=chatModel

