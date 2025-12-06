import Signup from "../models/Signup.model.js"
import bcrypt from "bcryptjs"

// Signup Controller
export const signup=async(req,res)=>{
    try {
        const {username,email,password}=req.body
        // Check missing fields
        if(!username || !email || !password){
                res.status(400).json({message:"All fields Required"})
                return
        }

        const existingUser=await Signup.findOne({email})
        if(existingUser){
            return res.status(409).json({message:"Already existing Email Address"})
        }
    // Password Hashing
    const hashedpswrd= await bcrypt.hash(password,10)
    // Record Insertion
    const newInsert=new  Signup ({username,email,password: hashedpswrd})
    await newInsert.save()
   return res.status(201).json({message:"Signned Up Successfully!!!"})

    } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}


// Signin Controller

export const signin=async (req,res) => {
    try {
        const {email,password}=req.body
        if(!email || !password){
            return res.status(400).json({message:"Email and password are required"})
        }
        const user=await Signup.findOne({email})
        if(!user){
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const isMatch= bcrypt.compare(password,user.password)
     if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Successful login
    return res.status(200).json({ message: "Login successful", user: { id: user._id, username: user.username, email: user.email } });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};