import { Router } from "express";
import {signup,signin,refresh} from "../controllers/authController.js";
import {creatBlog, fetchBlog} from "../controllers/blog.js";
import { authMiddle } from "../middleware/authantication.js";

const router=Router()

router.post("/signup",signup)
router.post("/login",signin)
router.get("/refresh", refresh);
router.post("/create-blog",creatBlog)
router.get("/blog",fetchBlog)
export default  router
