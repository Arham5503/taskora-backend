import express from "express"
import mongoose from "mongoose"
import Signup from "./models/Signup.model.js"
import bcrypt from "bcryptjs"
import cors from "cors";


const app=express()
const port=2004
const mongo=mongoose
const signupdata=Signup
// Database Connection
mongo.connect("mongodb://localhost:27017/Login")
.then(()=> console.log("Databse Connected"))
.catch(()=> console.log("Failed To connect with Database!!!"))

// Middleware
app.use(express.urlencoded({extended:false}))
app.use(cors(
    {  origin: "http://localhost:5173", // allow your frontend
}
))

// Routes

app.post("/api/signup",async(req,res)=>{
    try {
        const {username,email,password}=req.body
        if(!username || !email || !password){
                res.status(400).json({message:"All fields Required"})
        }
        const hashedpswrd= await bcrypt.hash(password,10)
    const newInsert=new  signupdata ({username,email,password: hashedpswrd})
    await newInsert.save()
    res.status(201).json({message:"Signned Up Successfully!!!"})

    } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
})



app.listen(port, ()=>{
  console.log("Port 2004 runned")  
})
