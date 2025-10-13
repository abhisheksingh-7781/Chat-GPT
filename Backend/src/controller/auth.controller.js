
const userModel=require("../models/user.model")
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")

async function registerController(req,res) {

    const {fullName:{firstName,lastName},email,password}=req.body

    const userAlredyExits=await userModel.findOne({
        email
    })

    if(userAlredyExits){
        return res.status(401).json({
            massage:"user Already exits"
        })
    }
    const haspassword=await bcrypt.hash(password,10)
    const user=await userModel.create({
        fullName:{
            firstName,lastName
        },
        email,
        password:haspassword
    })

    const token=jwt.sign({id:user._id},process.env.JWT_SECRET)

    res.cookie("token",token)

    res.status(201).json({
        massage:"user register successfully",
        user:{
            fullName:user.fullName,
            email:user.email,
            _id:user._id
        }
    })

  
}

async function loginController(req,res) {
    const {email,password}=req.body
    const user=await userModel.findOne({
        email
    })

    if(!user){
        return res.status(401).json({
            massage:"invalid email password"
        })
    }

    const isPasswordValid=await bcrypt.compare(password,user.password)
    if(!isPasswordValid){
        return res.status(201).json({
            massage:"Invalid email password"
        })
    }

    const token=jwt.sign({id:user.id},process.env.JWT_SECRET)

    res.cookie("token",token)

    res.status(200).json({
        massage:"logged successfully",
        user:{
            _id:user.id,
            email:user.email,
            fullName:user.fullName
        }
    })

}


module.exports={
    registerController,
    loginController
}