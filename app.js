import express from "express"
import cors from "cors";
import router from "./routes/authRoutes.js";


const app=express()


// Middleware
app.use(express.urlencoded({extended:false}))
app.use(cors(
    {  origin: "http://localhost:5173",}
))

// Routes
app.use("/api/",router)
export default app