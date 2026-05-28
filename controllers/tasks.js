import jwt from "jsonwebtoken";
import Task from "../models/Task.model.js";
import Project from "../models/Project.model.js";
import Signup from "../models/Signup.model.js";
import { createNotification, createNotifications } from "./notifications.js";

const isProjectTeamMember = (project, userId) =>
  project.team.some((member) => {
    const memberUser = member.user?._id || member.user;
    return memberUser?.toString() === userId.toString();
  });

// Create a new task
export const createTask = async (req, res) => {
  const { title, description, priority, dueDate, project, category } = req.body || {};
  let { assignees } = req.body || {};

  if (!title || !project) {
    return res.status(400).json({ message: "Title and project are required" });
  }

  if (typeof assignees === "string") {
    try {
      assignees = JSON.parse(assignees);
    } catch {
      return res.status(400).json({ message: "Assignees must be a valid JSON array" });
    }
  }

  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await Signup.findOne({ email: decoded.email });
    const userId = user._id;

    // Check if project exists and user has access
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is owner or team member
    const isOwner = projectDoc.owner.toString() === userId.toString();
    const isTeamMember = isProjectTeamMember(projectDoc, userId);

    if (!isOwner && !isTeamMember) {
      return res.status(403).json({ message: "You don't have access to this project" });
    }

    const task = new Task({
      title,
      description: description || "",
      priority: priority || "medium",
      dueDate: dueDate || null,
      project,
      assignees: assignees || [],
      createdBy: userId,
      category: category || "General",
      attachments: req.files?.length || 0,
    });

    await task.save();

    await createNotifications(
      (assignees || []).map((assigneeId) => ({
        recipient: assigneeId,
        actor: userId,
        type: "task",
        title: "Task assigned to you",
        description: `${user.username} assigned you the task '${task.title}'`,
        project,
        task: task._id,
        metadata: { action: "task_assigned" },
      })),
    );

    // Populate assignees for response
    await task.populate("assignees", "username email profile");

    return res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({ message: "Failed to create task", error: error.message });
  }
};

// Get all tasks for a project
export const getTasksByProject = async (req, res) => {
  const { projectId } = req.params;

  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await Signup.findOne({ email: decoded.email });
    const userId = user._id;

    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isOwner = project.owner.toString() === userId.toString();
    const isTeamMember = isProjectTeamMember(project, userId);

    if (!isOwner && !isTeamMember) {
      return res.status(403).json({ message: "You don't have access to this project" });
    }

    const tasks = await Task.find({ project: projectId })
      .populate("assignees", "username email profile")
      .populate("createdBy", "username email profile")
      .sort({ createdAt: -1 });

    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error);
    return res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
  }
};

// Get tasks assigned to the logged-in user
export const getMyTasks = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await Signup.findOne({ email: decoded.email });
    const userId = user._id;

    const tasks = await Task.find({ assignees: userId })
      .populate("assignees", "username email profile")
      .populate("createdBy", "username email profile")
      .populate("project", "title")
      .sort({ createdAt: -1 });

    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Get my tasks error:", error);
    return res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
  }
};

// Get a single task by ID
export const getTaskById = async (req, res) => {
  const { taskId } = req.params;

  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await Signup.findOne({ email: decoded.email });
    const userId = user._id;

    const task = await Task.findById(taskId)
      .populate("assignees", "username email profile")
      .populate("createdBy", "username email profile")
      .populate("project", "title owner team");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check access
    const project = task.project;
    const isOwner = project.owner.toString() === userId.toString();
    const isTeamMember = isProjectTeamMember(project, userId);

    if (!isOwner && !isTeamMember) {
      return res.status(403).json({ message: "You don't have access to this task" });
    }

    return res.status(200).json(task);
  } catch (error) {
    console.error("Get task error:", error);
    return res.status(500).json({ message: "Failed to fetch task", error: error.message });
  }
};

// Update a task
export const updateTask = async (req, res) => {
  const { taskId } = req.params;
  const updates = req.body;

  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await Signup.findOne({ email: decoded.email });
    const userId = user._id;

    const task = await Task.findById(taskId).populate("project", "owner team");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check access
    const project = task.project;
    const isOwner = project.owner.toString() === userId.toString();
    const isTeamMember = isProjectTeamMember(project, userId);

    if (!isOwner && !isTeamMember) {
      return res.status(403).json({ message: "You don't have access to update this task" });
    }

    const previousStatus = task.status;
    const previousAssigneeIds = task.assignees.map((id) => id.toString());

    // Update allowed fields
    const allowedUpdates = [
      "title",
      "description",
      "priority",
      "status",
      "dueDate",
      "assignees",
      "category",
      "attachments",
      "comments",
      "checklist",
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        task[field] = updates[field];
      }
    });

    await task.save();

    if (Array.isArray(updates.assignees)) {
      const newAssigneeIds = updates.assignees
        .map((id) => id.toString())
        .filter((id) => !previousAssigneeIds.includes(id));

      await createNotifications(
        newAssigneeIds.map((assigneeId) => ({
          recipient: assigneeId,
          actor: userId,
          type: "task",
          title: "Task assigned to you",
          description: `${user.username} assigned you the task '${task.title}'`,
          project: task.project._id,
          task: task._id,
          metadata: { action: "task_assigned" },
        })),
      );
    }

    if (previousStatus !== "done" && task.status === "done") {
      const recipients = [
        task.createdBy,
        ...task.assignees,
        task.project.owner,
      ].map((id) => id.toString());

      await createNotifications(
        [...new Set(recipients)].map((recipientId) => ({
          recipient: recipientId,
          actor: userId,
          type: "task",
          title: "Task completed",
          description: `${user.username} marked '${task.title}' as complete`,
          project: task.project._id,
          task: task._id,
          metadata: { action: "task_completed" },
        })),
      );
    }

    await task.populate("assignees", "username email profile");
    await task.populate("createdBy", "username email profile");

    return res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Update task error:", error);
    return res.status(500).json({ message: "Failed to update task", error: error.message });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  const { taskId } = req.params;

  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await Signup.findOne({ email: decoded.email });
    const userId = user._id;

    const task = await Task.findById(taskId).populate("project", "owner team");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check access - only owner or task creator can delete
    const project = task.project;
    const isOwner = project.owner.toString() === userId.toString();
    const isCreator = task.createdBy.toString() === userId.toString();

    if (!isOwner && !isCreator) {
      return res.status(403).json({ message: "You don't have permission to delete this task" });
    }

    await Task.findByIdAndDelete(taskId);

    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    return res.status(500).json({ message: "Failed to delete task", error: error.message });
  }
};

// Update task status (drag and drop in kanban)
export const updateTaskStatus = async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;

  if (!status || !["todo", "in_progress", "in_review", "done"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await Signup.findOne({ email: decoded.email });
    const userId = user._id;

    const task = await Task.findById(taskId).populate("project", "owner team");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check access
    const project = task.project;
    const isOwner = project.owner.toString() === userId.toString();
    const isTeamMember = isProjectTeamMember(project, userId);

    if (!isOwner && !isTeamMember) {
      return res.status(403).json({ message: "You don't have access to update this task" });
    }

    const previousStatus = task.status;
    task.status = status;
    await task.save();

    if (previousStatus !== "done" && status === "done") {
      const recipients = [
        task.createdBy,
        ...task.assignees,
        project.owner,
      ].map((id) => id.toString());

      await createNotifications(
        [...new Set(recipients)].map((recipientId) => ({
          recipient: recipientId,
          actor: userId,
          type: "task",
          title: "Task completed",
          description: `${user.username} marked '${task.title}' as complete`,
          project: project._id,
          task: task._id,
          metadata: { action: "task_completed" },
        })),
      );
    } else if (previousStatus !== status) {
      await createNotification({
        recipient: task.createdBy,
        actor: userId,
        type: "task",
        title: "Task status updated",
        description: `${user.username} moved '${task.title}' to ${status.replace("_", " ")}`,
        project: project._id,
        task: task._id,
        metadata: { action: "task_status_updated", status },
      });
    }

    return res.status(200).json({
      message: "Task status updated",
      task,
    });
  } catch (error) {
    console.error("Update task status error:", error);
    return res.status(500).json({ message: "Failed to update task status", error: error.message });
  }
};
