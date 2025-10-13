const {Server}=require("socket.io")
const cookie=require("cookie")
const jwt=require("jsonwebtoken")
const userModel=require("../models/user.model")
const aiService=require("../services/ai.service")
const massageModel=require("../models/massage.model")


function initSocketServer(httpServer){

    const io=new Server(httpServer)

    io.use(async(socket,next)=>{ 
        const cookies=cookie.parse(socket.handshake.headers?.cookie||"")
       

        if(!cookies.token){
            next(new Error("Authentication error: no token provided"))
        }
        try {
            const decoded=jwt.verify(cookies.token,process.env.JWT_SECRET)
            const user=await userModel.findById(decoded.id)
            socket.user=user
            next()   
        } catch (error) {
            next(new Error("Authentication error: invalid token "))
        }
    })


    io.on("connection",(socket)=>{

      socket.on("ai-massage",async(massagePayload)=>{

        await massageModel.create({
            user:socket.user._id,
            chat:massagePayload.chat,
            content:massagePayload.content,
            role:"user"
        })

        const chatHistory=(await massageModel.find({
            chat:massagePayload.chat
        }).sort({createdAt:-1}).limit(4).lean()).reverse()

        console.log("chatHistory:",);
        

        const response=await aiService.generateResponse(chatHistory.map(item => {
            return {
                role: item.role,
                parts: [ { text : item.content } ]
            }
        }))

        await massageModel.create({
            user:socket.user._id,
            chat:massagePayload.chat,
            content:response,
            role:"model"
        })

        socket.emit("ai-massage-response",{
            content:response,
            chat:massagePayload.chat
        })
      })
    })
}


module.exports=initSocketServer

