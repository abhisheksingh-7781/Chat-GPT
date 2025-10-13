const express=require("express")
const authRoutes=require("../src/routes/user.routes")
const chatRouter=require('../src/routes/chat.routes')
const cookieParser=require("cookie-parser")
const app=express()


app.use(express.json())
app.use(cookieParser())

app.use("/api/auth",authRoutes)
app.use("/api/chat",chatRouter)




module.exports=app