const express=require('express')
const router=express.Router()
const authcontroller=require("../controller/auth.controller")

router.post("/register",authcontroller.registerController)
router.post("/login",authcontroller.loginController)


module.exports=router