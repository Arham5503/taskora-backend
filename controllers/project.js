import ProjectModel from "../models/Project.model.js";

// Create New Project
export const createProject=async (req,res)=>{
    const { title,priority,durationDays}= req.body
    if (!title || !priority || !durationDays) {
  return res.status(400).json({
    message: "All fields are required",
     title,priority,durationDays
  });
}

    
    try { 
    const record= new ProjectModel({  title,
      priority,
      durationDays,}) 
    await record.save()
    return res.status(200).json({message:"Project Created Successfully"})
} catch (error) {
        return res.status(500).json({message:"Server Error"+ error})   
    }

}

//Fetch All Projects

export const fetchProject= async (req, res) => {
  try {
    const record =await ProjectModel.find()
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