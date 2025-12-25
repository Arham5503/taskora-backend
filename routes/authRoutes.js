import { Router } from "express";
import {signup,signin,refresh, me, logout} from "../controllers/authController.js";
import {creatBlog, fetchBlog} from "../controllers/blog.js";
import { authMiddle } from "../middleware/authantication.js";
import { createProject,fetchProject } from "../controllers/project.js";

const router=Router()

router.post("/signup",signup)
router.post("/login",signin)
router.get("/refresh", refresh);
router.post("/create-blog",creatBlog)
router.get("/blog",fetchBlog)
router.get("/me",me)
router.get("/logout",logout)
router.post("/project",createProject)
router.get("/project-data",fetchProject)

export default  router
