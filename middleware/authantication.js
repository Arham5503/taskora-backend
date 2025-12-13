import jwt from "jsonwebtoken";

export const authMiddle=(req,res,next)=>{
    const authHeader =req.headers.authorization
    if(!authHeader  || !authHeader.startsWith("Bearer: ")){
        return res.status(401).json({meassage:"Missing Authantication Id"})
    }
const token=authHeader.split(" ")[1]
try {
   const decoded=jwt.verify(token, process.env.JWT_ACCESS_SECRET) 
   req.user=decoded
   next()
} catch (error) {
        return res.status(403).json({ message: "Invalid token" });

}

}

