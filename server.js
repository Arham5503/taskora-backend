import app from "./app.js";
import mongoose from "mongoose"
import dotenv from "dotenv";
dotenv.config();

const PORT=process.env.PORT || 3000


// Database Connection
const mongo=mongoose
mongo.connect(process.env.DB)
.then(()=> console.log("Databse Connected"))
.catch(()=> console.log("Failed To connect with Database!!!"))


app.listen(PORT, ()=>{
  console.log("Port 2004 runned")  
})
