import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes/authRoutes.js";

const app = express();

const allowPaths = [
  "https://taskora-chi.vercel.app",
  "http://localhost:5173",
];

// MIDDLEWARES
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors({
  origin: allowPaths,
  credentials: true
}));

app.use(cookieParser());

// ROUTES
app.use("/api", router);

export default app;
