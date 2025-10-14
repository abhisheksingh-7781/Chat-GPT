const {Server}=require("socket.io")
const cookie=require("cookie")
const jwt=require("jsonwebtoken")
const userModel=require("../models/user.model")
const aiService=require("../services/ai.service")
const massageModel=require("../models/massage.model")
const {createMemory,queryMemory}=require("../services/vector.service")


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

        // massagePayload={chat:chatId,content:massage text}

       const massage= await massageModel.create({
            user:socket.user._id,
            chat:massagePayload.chat,
            content:massagePayload.content,
            role:"user",
        })

        const vectors=await aiService.generateVector(massagePayload.content)

          const relevantMemories=await queryMemory({
            queryVector:vectors,
            limit:3,
            metadata:{
               
             } 
        })
        
        await createMemory({
            vectors,
            massageId:massage._id,
            metadata:{
                chat:massagePayload.chat,
                user:socket.user._id,
                text:massagePayload.content,
                role:"user"
            }
        })

      
        const chatHistory=(await massageModel.find({
            chat:massagePayload.chat
        }).sort({createdAt:-1}).limit(10).lean()).reverse()

        const stm=chatHistory.map(item => {
                  return {
                   role: item.role,
                parts: [ { text : item.content } ]
            }
        })

        const ltm=[
            {
                role:"user",
                parts:[{text:`these are some previous conversations with the user, use them to give better responses
                    ${relevantMemories.map(memory=>memory.metadata.text).join("\n")} 
                    ` }]
            }
        ]


       console.log("LTM:",ltm[0])
         console.log("STM:",stm)
         

        const response=await aiService.generateResponse([...ltm,...stm])

    

      const responseMassage = await massageModel.create({
            user:socket.user._id,
            chat:massagePayload.chat,
            content:response,
            role:"model"
        })


        const responseVectors=await aiService.generateVector(response)

        await createMemory({
            vectors:responseVectors,
            massageId:responseMassage._id,
            metadata:{
                chat:massagePayload.chat,
                user:socket.user._id,
                text:response,
                role:"model"
            }

        })


        socket.emit("ai-massage-response",{
            content:response,
            chat:massagePayload.chat
        })
      })
    })
}


module.exports=initSocketServer

