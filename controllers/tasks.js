import jwt from "jsonwebtoken";
import Task from "../models/Task.model.js";
import Project from "../models/Project.model.js";

// Create a new task
export const createTask = async (req, res) => {
  const { title, description, priority, dueDate, project, assignees, category } = req.body;

  if (!title || !project) {
    return res.status(400).json({ message: "Title and project are required" });
  }

  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const userId = decoded.id;

    // Check if project exists and user has access
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is owner or team member
    const isOwner = projectDoc.owner.toString() === userId;
    const isTeamMember = projectDoc.team.some(
      (member) => member.toString() === userId
    );

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
    });

    await task.save();

    // Populate assignees for response
    await task.populate("assignees", "username email profile");

    return res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({ message: "Failed to create task" });
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
    const userId = decoded.id;

    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isOwner = project.owner.toString() === userId;
    const isTeamMember = project.team.some(
      (member) => member.toString() === userId
    );

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
    return res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

// Get all tasks for the logged-in user (across all projects)
export const getMyTasks = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const userId = decoded.id;

    // Get all projects where user is owner or team member
    const projects = await Project.find({
      $or: [{ owner: userId }, { team: userId }],
    });

    const projectIds = projects.map((p) => p._id);

    const tasks = await Task.find({ project: { $in: projectIds } })
      .populate("assignees", "username email profile")
      .populate("createdBy", "username email profile")
      .populate("project", "title")
      .sort({ createdAt: -1 });

    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Get my tasks error:", error);
    return res.status(500).json({ message: "Failed to fetch tasks" });
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
    const userId = decoded.id;

    const task = await Task.findById(taskId)
      .populate("assignees", "username email profile")
      .populate("createdBy", "username email profile")
      .populate("project", "title owner team");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check access
    const project = task.project;
    const isOwner = project.owner.toString() === userId;
    const isTeamMember = project.team.some(
      (member) => member.toString() === userId
    );

    if (!isOwner && !isTeamMember) {
      return res.status(403).json({ message: "You don't have access to this task" });
    }

    return res.status(200).json(task);
  } catch (error) {
    console.error("Get task error:", error);
    return res.status(500).json({ message: "Failed to fetch task" });
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
    const userId = decoded.id;

    const task = await Task.findById(taskId).populate("project", "owner team");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check access
    const project = task.project;
    const isOwner = project.owner.toString() === userId;
    const isTeamMember = project.team.some(
      (member) => member.toString() === userId
    );

    if (!isOwner && !isTeamMember) {
      return res.status(403).json({ message: "You don't have access to update this task" });
    }

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

    await task.populate("assignees", "username email profile");
    await task.populate("createdBy", "username email profile");

    return res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Update task error:", error);
    return res.status(500).json({ message: "Failed to update task" });
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
    const userId = decoded.id;

    const task = await Task.findById(taskId).populate("project", "owner team");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check access - only owner or task creator can delete
    const project = task.project;
    const isOwner = project.owner.toString() === userId;
    const isCreator = task.createdBy.toString() === userId;

    if (!isOwner && !isCreator) {
      return res.status(403).json({ message: "You don't have permission to delete this task" });
    }

    await Task.findByIdAndDelete(taskId);

    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    return res.status(500).json({ message: "Failed to delete task" });
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
    const userId = decoded.id;

    const task = await Task.findById(taskId).populate("project", "owner team");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check access
    const project = task.project;
    const isOwner = project.owner.toString() === userId;
    const isTeamMember = project.team.some(
      (member) => member.toString() === userId
    );

    if (!isOwner && !isTeamMember) {
      return res.status(403).json({ message: "You don't have access to update this task" });
    }

    task.status = status;
    await task.save();

    return res.status(200).json({
      message: "Task status updated",
      task,
    });
  } catch (error) {
    console.error("Update task status error:", error);
    return res.status(500).json({ message: "Failed to update task status" });
  }
};
