import { Router } from "express";
import { signup, signin, refresh, me, logout, updateProfile } from "../controllers/authController.js";
import { creatBlog, fetchBlog } from "../controllers/blog.js";
import {
  createProject,
  fetchProject,
  getProjectById,
  updateProject,
  updateProjectStatus,
  deleteProject,
  generateInviteLink,
  joinViaInvite,
  getInviteInfo,
  getProjectTeam,
  removeTeamMember,
} from "../controllers/project.js";
import {
  createTask,
  getTasksByProject,
  getMyTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
} from "../controllers/tasks.js";

const router = Router();

// Auth Routes
router.post("/signup", signup);
router.post("/login", signin);
router.get("/refresh", refresh);
router.get("/profile", me);
router.post("/profile", updateProfile);
router.get("/me", me);
router.get("/logout", logout);

// Blog Routes
router.post("/create-blog", creatBlog);
router.get("/blog", fetchBlog);

// Project Routes
router.post("/project", createProject);
router.get("/project-data", fetchProject);
router.get("/project/:projectId", getProjectById);
router.put("/project/:projectId", updateProject);
router.patch("/project/:projectId/status", updateProjectStatus);
router.delete("/project/:projectId", deleteProject);

// Project Team Routes
router.get("/project/:projectId/team", getProjectTeam);
router.delete("/project/:projectId/team/:memberId", removeTeamMember);

// Project Invite Routes
router.post("/project/:projectId/invite", generateInviteLink);
router.get("/invite/:inviteCode", getInviteInfo);
router.post("/invite/:inviteCode/join", joinViaInvite);

// Task Routes
router.post("/task", createTask);
router.get("/tasks", getMyTasks);
router.get("/project/:projectId/tasks", getTasksByProject);
router.get("/task/:taskId", getTaskById);
router.put("/task/:taskId", updateTask);
router.patch("/task/:taskId/status", updateTaskStatus);
router.delete("/task/:taskId", deleteTask);

export default router;
