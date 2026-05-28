import { Router } from "express";
import multer from "multer";
import { signup, signin, refresh, me, logout, updateProfile, resendOTP, verifyOTP } from "../controllers/authController.js";
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
  fetchTeam,
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
import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notifications.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Auth Routes
router.post("/signup", signup);
router.post("/login", signin);
router.get("/refresh", refresh);
router.get("/profile", me);
router.post("/profile", updateProfile);
router.get("/me", me);
router.get("/logout", logout);
router.post("/resend-otp",resendOTP)
router.post("/verify-otp",verifyOTP)

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
router.get("/users", fetchTeam)
// Project Team Routes
router.get("/project/:projectId/team", getProjectTeam);
router.delete("/project/:projectId/team/:memberId", removeTeamMember);

// Project Invite Routes
router.post("/project/:projectId/invite", generateInviteLink);
router.get("/invite/:inviteCode", getInviteInfo);
router.post("/invite/:inviteCode/join", joinViaInvite);

// Task Routes
router.post("/task", upload.array("attachments"), createTask);
router.get("/tasks", getMyTasks);
router.get("/project/:projectId/tasks", getTasksByProject);
router.get("/task/:taskId", getTaskById);
router.put("/task/:taskId", updateTask);
router.patch("/task/:taskId/status", updateTaskStatus);
router.delete("/task/:taskId", deleteTask);

// Notification Routes
router.get("/notifications", getNotifications);
router.get("/notifications/unread-count", getUnreadNotificationCount);
router.patch("/notifications/read-all", markAllNotificationsRead);
router.patch("/notifications/:notificationId/read", markNotificationRead);
router.delete("/notifications/:notificationId", deleteNotification);

export default router;
