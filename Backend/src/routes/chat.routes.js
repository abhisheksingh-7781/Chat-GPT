const express=require("express")
const router=express.Router()
const chatController=require("../controller/chat.controller")
const middelwares=require("../middlewares/auth.middelwares")


router.post("/",middelwares.authuser,chatController.createChat)

/*  GET / api/chat/ */

router.get("/",middelwares.authuser,chatController.getChats)

/* GET /api/chat/messages/:id */
router.get('/messages/:id', middelwares.authuser, chatController.getMessages)


module.exports=router

