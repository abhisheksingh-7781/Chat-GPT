const mongoose=require("mongoose")


async function connectDB() {
    try {
      await mongoose.connect(process.env.MONGODB_URL)
      console.log("connected to db successfully")
    } catch (error) {
        console.log("error",error)
    }
    
}

module.exports=connectDB