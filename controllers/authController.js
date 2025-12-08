import Signup from "../models/Signup.model.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";


const createAccessToken= (user)=>{
return  jwt.sign({email:user.email},process.env.JWT_ACCESS_SECRET,{expiresIn:process.env.ACCESS_TOKEN_EXP})
}
const createRefreshToken=(user)=>{
 return jwt.sign({email:user.email},process.env.JWT_REFRESH_SECRET,{expiresIn:process.env.REFRESH_TOKEN_EXP})
}
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

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await Signup.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    // ---- SET REFRESH TOKEN COOKIE ----
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true, // in production
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // ---- SEND ACCESS TOKEN TO FRONTEND ----
    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};


// Refresh Token

export const refresh=(req,res)=>{
  (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token)
    return res.status(401).json({ message: "No refresh token" });

  jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid refresh token" });

    const accessToken = jwt.sign(
      { id: user.id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    return res.json({ accessToken });
  });
}
}