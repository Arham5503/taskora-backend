import jwt from "jsonwebtoken";

export const authMiddle=(req,res,next)=>{
    const authHeader =req.credentials
    if(!authHeader ){
        return res.status(401).json({meassage:"Missing Authantication Id"})
    }
try {
   const decoded=jwt.verify(authHeader, process.env.JWT_ACCESS_SECRET) 
   req.user=decoded
   next()
} catch (error) {
        return res.status(403).json({ message: "Invalid token" });

}

}

