import { Router } from "express";
import {signup,signin,refresh} from "../controllers/authController.js";

const router=Router()

router.post("/signup",signup)
router.post("/login",signin)
router.get("/refresh", refresh);

export default  router
