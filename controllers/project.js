import ProjectModel from "../models/Project.model.js";
import Signup from "../models/Signup.model.js"
import jwt from "jsonwebtoken";
// Create New Project
export const createProject=async (req,res)=>{
    const token=req.cookies?.accessToken
  if(!token){
    return res.status(401).json("Session Out")
  }
    const { title,priority,durationDays,description}= req.body
    if (!title || !priority || !durationDays ||!description) {
  return res.status(400).json({
    message: "All fields are required",
     title,priority,durationDays
  });
}

  const decoded=jwt.verify(token,process.env.JWT_ACCESS_SECRET)
  const user=await Signup.findOne({email: decoded.email})
    
    try { 

    const record= new ProjectModel({  title,
      description,
      priority,
      durationDays,
      owner:user._id,
      team:user._id
    }) 
    await record.save()
    return res.status(200).json({message:"Project Created Successfully"})
} catch (error) {
        return res.status(500).json({message:"Server Error"+ error})   
    }

}

//Fetch All Projects

export const fetchProject= async (req, res) => {
  const token=req.cookies?.accessToken
  if(!token){
    return res.status(401).json("Session Out")
  }
  const decoded=jwt.verify(token,process.env.JWT_ACCESS_SECRET)
  const user=await Signup.findOne({email: decoded.email})
  try {
    const record =await ProjectModel.find({$or:[{
      owner:user._id,
      team:user._id
    }]})
  if(!record || record.length<1)
  {
    console.log("No Projects Data Found!")
    return res.status(404).json({message:"Recods Not Found"})
  }

  return res.status(200).json(record)
  } catch (error) {
    console.log("Server Error")
    res.status(500).json({message:"Server Error!"})
    return
  }

}