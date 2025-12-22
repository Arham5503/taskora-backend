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

const isProd = process.env.NODE_ENV === "production";

res.cookie("accessToken", accessToken, {
  httpOnly: true,       // ✅ required for security
  secure: isProd,       // ❌ must be false on localhost (no HTTPS)
  sameSite: isProd ? "None" : "Lax", // ❌ must be "Lax" for localhost
  maxAge: 15 * 60 * 1000,
});

res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "None" : "Lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

    return res.status(200).json({
      message: "Login successful",
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

export const refresh = (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token)
    return res.status(401).json({ message: "No refresh token" });

  jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
    if (err)
      return res.status(403).json({ message: "Invalid refresh token" });

    const accessToken = jwt.sign(
      { email: decoded.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 15 * 60 * 1000,
    });

    return res.json({ message: "Access token refreshed" });
  });
};


//Cookies Verify

export const me=(req,res)=>{
  const token=req.cookies?.accessToken
  if(!token)
  {
    return res.status(401).json({user:null,message:"Session Out"})
  }
  jwt.verify(token,process.env.JWT_ACCESS_SECRET,(err,decoded)=>{
    if(err){

      return res.status(401).json({user:err},{message:"User Session Out!!"})
    }
    return res.json({user:decoded
    },{message:"Verified"})
  })

}

// Logout
export const logout = (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
};
