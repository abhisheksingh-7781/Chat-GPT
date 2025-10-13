const express=require("express")
const router=express.Router()
const chatController=require("../controller/chat.controller")
const middelwares=require("../middlewares/auth.middelwares")


router.post("/",middelwares.authuser,chatController.createChat)


module.exports=router

