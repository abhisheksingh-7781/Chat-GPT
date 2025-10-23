const {Server}=require("socket.io")
const cookie=require("cookie")
const jwt=require("jsonwebtoken")
const userModel=require("../models/user.model")
const aiService=require("../services/ai.service")
const massageModel=require("../models/massage.model")
const {createMemory,queryMemory}=require("../services/vector.service")


function initSocketServer(httpServer){

       const io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:5173",
            allowedHeaders: [ "Content-Type", "Authorization" ],
            credentials: true
        }
    })

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
    }) //end of io.use


    io.on("connection",(socket)=>{

        // console.log("user connected",socket.user.id)

      socket.on("ai-massage",async(massagePayload)=>{

         const [massage,vectors]=await Promise.all([
            massageModel.create({
                user:socket.user._id,
                chat:massagePayload.chat,
                content:massagePayload.content,
                role:"user",
            }),
            aiService.generateVector(massagePayload.content),
         ]) //end of Promise.all


              await createMemory({
                    vectors,
                    massageId:massage._id,
                    metadata:{
                        chat:massagePayload.chat,
                        user:socket.user._id,
                        text:massagePayload.content,
                        role:"user"
                         }
                }) //end of createMemory




        const [memory,chatHistory]=await Promise.all([
            queryMemory({
                queryVector:vectors,
                limit:3,
                metadata:{
                    
                }
            }),
            massageModel.find({
                chat:massagePayload.chat
            }).sort({createdAt:-1}).limit(10).lean().then(res=>res.reverse())
        ]) //end of Promise.all



   
    

        const stm=chatHistory.map(item => {
                  return {
                   role: item.role,
                parts: [ { text : item.content } ]
            }
        }) //end of stm

        const ltm=[
            {
                role:"user",
                parts:[{text:`these are some previous conversations with the user, use them to give better responses
                    ${memory.map(item=>item.metadata.text).join("\n")} 
                    ` }]
            }
        ] //end of ltm


        const response=await aiService.generateResponse([...ltm,...stm])


       socket.emit("ai-massage-response",{
            content:response,
            chat:massagePayload.chat
        })


       const [responseMassage,responseVectors]=await Promise.all([
        massageModel.create({
            user:socket.user._id,
            chat:massagePayload.chat,
            content:response,
            role:"model",
        }),
        aiService.generateVector(response)
       ]) //end of promise.all


       await createMemory({
              vectors:responseVectors,
              massageId:responseMassage._id,
              metadata:{
                   chat:massagePayload.chat,
                   user:socket.user._id,
                   text:response,
                   role:"model"
                }

            }) //end of createMemory

      })//end of socket.on ai-massage

    }) //end of io.on connection


} //end of initSocketServer


module.exports=initSocketServer

