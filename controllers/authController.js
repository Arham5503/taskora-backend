import Signup from "../models/Signup.model.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";
import OTP from "../models/Otp.model.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateOTP } from "../utils/otp.js";

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
    await OTP.deleteMany({ email }); 
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    await new OTP({ email, otp: hashedOTP }).save();
    await sendEmail(email, otp);
    return res.status(200).json({
      message: "OTP sent to your email. Please verify to complete signup.",
      email, 
    });
   
   

    } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error",error: error.message });
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
  httpOnly: true,       
  secure: isProd,       
  sameSite: isProd ? "None" : "Lax", 
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
        email: user.email,
        is_verified: user.is_verified 
      },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error",error: err.message });
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

export const me = async (req, res) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ user: null, message: "Session Out" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await Signup.findOne({ email: decoded.email }).select("-password"); 

    if (!user) {
      return res.status(404).json({ user: null, message: "User not found" });
    }

    return res.status(200).json({ user, message: "Verified" });
  } catch (err) {
    return res.status(401).json({ user: null, message: "User Session Out!!",error: err.message });
  }
};

// Logout
export const logout = (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
};


//Profile Get

export const updateProfile =async (req,res)=>{
  const token=req.cookies?.accessToken
  const { username, title, profile }=req.body
  if(!token){
    return res.status(401).json("Session Out")
  }
  try {
    const decoded=jwt.verify(token,process.env.JWT_ACCESS_SECRET)
    const updatedFields = { username, title, profile };
    
    const updatedUser = await Signup.updateOne(
      { email: decoded.email },
      { $set: updatedFields }
    );
    return res.status(201).json({message:"Updated Successfully!!!"})
  } catch (error) {
    
    return res.status(500).json({ message: "Enternal Server Error",error: error.message });
  }
}
// OTP Verification Controller
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find the latest OTP record for this email
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      // This means OTP either never existed or already expired (TTL deleted it)
      return res.status(400).json({ message: "OTP expired or not found. Request a new one." });
    }

    // Compare entered OTP with the hashed one in DB
    const isMatch = await bcrypt.compare(otp, otpRecord.otp);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP is correct! Mark user as verified
    await Signup.updateOne({ email }, { $set: { is_verified: true } });

    // Delete the OTP record — it's been used, no longer needed
    await OTP.deleteMany({ email });

    return res.status(200).json({ message: "Email verified successfully! You can now log in." });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Resend OTP Controller
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await Signup.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    if (user.is_verified) {
      return res.status(400).json({ message: "Account is already verified" });
    }

    // Delete old OTPs and send fresh one
    await OTP.deleteMany({ email });

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    await new OTP({ email, otp: hashedOTP }).save();
    await sendEmail(email, otp);

    return res.status(200).json({ message: "New OTP sent to your email" });

  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};