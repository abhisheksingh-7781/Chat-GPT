const {GoogleGenAI}=require("@google/genai")

const ai=new GoogleGenAI({})

async function generateResponse(content){
    const response=await ai.models.generateContent({
        model:"gemini-2.5-flash",
        contents:content,
        config:{
            systemInstruction:` you are a helpful assistant. respond in a friendly manner. keep the responses concise and to the point. avoid unnecessary details. okay`,
        }
    })

   return response.text
    
}

module.exports={
    generateResponse
}

