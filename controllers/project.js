import ProjectModel from "../models/Project.model.js";
import ProjectInvite from "../models/ProjectInvite.model.js";
import Signup from "../models/Signup.model.js";
import jwt from "jsonwebtoken";

// Create New Project
export const createProject = async (req, res) => {
  const token = req.cookies?.accessToken;
  if (!token) {
    return res.status(401).json("Session Out");
  }
  const { title, priority, durationDays, description, client } = req.body;
  if (!title || !priority || !durationDays || !description) {
    return res.status(400).json({
      message: "All fields are required",
      title,
      priority,
      durationDays,
    });
  }

  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  const user = await Signup.findOne({ email: decoded.email });

  try {
    const record = new ProjectModel({
      title,
      description,
      priority,
      durationDays,
      client,
      owner: user._id,
      team: [user._id],
    });
    await record.save();
    return res.status(200).json({ message: "Project Created Successfully", project: record });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" ,error: error.message });
  }
};

export const fetchTeam =async (req, res) => {
  try {
    const users = await Signup.find({}, "-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// Fetch All Projects
export const fetchProject = async (req, res) => {
  const token = req.cookies?.accessToken;
  if (!token) {
    return res.status(401).json("Session Out");
  }
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  const user = await Signup.findOne({ email: decoded.email });
  try {
    const record = await ProjectModel.find({
      $or: [{ owner: user._id }, { team: user._id }],
    }).populate("team", "username email profile");

    if (!record || record.length < 1) {
      console.log("No Projects Data Found!");
      return res.status(404).json({ message: "Records Not Found" });
    }

    return res.status(200).json(record);
  } catch (error) {
    console.log("Server Error",error);
    res.status(500).json({ message: "Server Error!",error: error.message });
    return;
  }
};

// Get Single Project by ID
export const getProjectById = async (req, res) => {
  const { projectId } = req.params;
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await Signup.findOne({ email: decoded.email });

    const project = await ProjectModel.findById(projectId)
      .populate("owner", "username email profile")
      .populate("team", "username email profile");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user has access
    const isOwner = project.owner._id.toString() === user._id.toString();
    const isTeamMember = project.team.some(
      (member) => member._id.toString() === user._id.toString()
    );

    if (!isOwner && !isTeamMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json(project);
  } catch (error) {
    console.error("Get project error:");
    return res.status(500).json({ message: "Server Error",error: error.message });
  }
};

// Update Project
export const updateProject = async (req, res) => {
  const { projectId } = req.params;
  const updates = req.body;
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await Signup.findOne({ email: decoded.email });

    const project = await ProjectModel.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only owner can update project
    if (project.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Only project owner can update" });
    }

    // Allowed fields to update
    const allowedUpdates = [
      "title",
      "description",
      "client",
      "priority",
      "status",
      "durationDays",
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        project[field] = updates[field];
      }
    });

    await project.save();

    return res.status(200).json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update project error:", error);
    return res.status(500).json({ message: "Server Error",error: error.message });
  }
};

// Update Project Status
export const updateProjectStatus = async (req, res) => {
  const { projectId } = req.params;
  const { status } = req.body;
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!status || !["planning", "in_progress", "completed", "on_hold", "archived"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await Signup.findOne({ email: decoded.email });

    const project = await ProjectModel.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only owner can update status
    if (project.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Only project owner can update status" });
    }

    project.status = status;
    await project.save();

    return res.status(200).json({
      message: "Project status updated",
      project,
    });
  } catch (error) {
    console.error("Update status error:", error);
    return res.status(500).json({ message: "Server Error" ,error: error.message});
  }
};

// Delete Project
export const deleteProject = async (req, res) => {
  const { projectId } = req.params;
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await Signup.findOne({ email: decoded.email });

    const project = await ProjectModel.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only owner can delete
    if (project.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Only project owner can delete" });
    }

    await ProjectModel.findByIdAndDelete(projectId);

    // Also delete all associated invites
    await ProjectInvite.deleteMany({ project: projectId });

    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete project error:", error);
    return res.status(500).json({ message: "Server Error" ,error: error.message});
  }
};

// Generate Invite Link
export const generateInviteLink = async (req, res) => {
  const { projectId } = req.params;
  const { role, expiresInDays, maxUses } = req.body;
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await Signup.findOne({ email: decoded.email });

    const project = await ProjectModel.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only owner can generate invite
    if (project.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Only project owner can invite members" });
    }

    // Create invite
    const invite = new ProjectInvite({
      project: projectId,
      createdBy: user._id,
      role: role || "editor",
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxUses: maxUses || 0,
    });

    await invite.save();

    // Generate full invite URL
    const inviteUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/join/${invite.inviteCode}`;

    return res.status(201).json({
      message: "Invite link generated",
      inviteCode: invite.inviteCode,
      inviteUrl,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error("Generate invite error:", error);
  return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Join Project via Invite
export const joinViaInvite = async (req, res) => {
  const { inviteCode } = req.params;
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Please login to join the project" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await Signup.findOne({ email: decoded.email });

    // Find invite
    const invite = await ProjectInvite.findOne({ inviteCode }).populate("project");

    if (!invite) {
      return res.status(404).json({ message: "Invalid invite link" });
    }

    // Check if invite is valid
    if (!invite.isValid()) {
      return res.status(400).json({ message: "This invite link has expired or reached its limit" });
    }

    const project = await ProjectModel.findById(invite.project._id);

    // Check if user is already a member
    const isAlreadyMember = project.team.some(
      (member) => member.toString() === user._id.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({ message: "You are already a member of this project" });
    }

    // Add user to team
    project.team.push(user._id);
    await project.save();

    // Increment invite usage
    invite.usedCount += 1;
    await invite.save();

    return res.status(200).json({
      message: "Successfully joined the project",
      project: {
        _id: project._id,
        title: project.title,
        description: project.description,
      },
    });
  } catch (error) {
    console.error("Join via invite error:", error);
    return res.status(500).json({ message: "Server Error",error: error.message });
  }
};

// Get Invite Info (for preview before joining)
export const getInviteInfo = async (req, res) => {
  const { inviteCode } = req.params;

  try {
    const invite = await ProjectInvite.findOne({ inviteCode })
      .populate("project", "title description")
      .populate("createdBy", "username");

    if (!invite) {
      return res.status(404).json({ message: "Invalid invite link" });
    }

    if (!invite.isValid()) {
      return res.status(400).json({ message: "This invite link has expired or reached its limit" });
    }

    return res.status(200).json({
      projectTitle: invite.project.title,
      projectDescription: invite.project.description,
      invitedBy: invite.createdBy.username,
      role: invite.role,
    });
  } catch (error) {
    console.error("Get invite info error:", error);
    return res.status(500).json({ message: "Server Error",error: error.message });
  }
};

// Get Project Team Members
export const getProjectTeam = async (req, res) => {
  const { projectId } = req.params;
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await Signup.findOne({ email: decoded.email });

    const project = await ProjectModel.findById(projectId)
      .populate("owner", "username email profile")
      .populate("team", "username email profile");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user has access
    const isOwner = project.owner._id.toString() === user._id.toString();
    const isTeamMember = project.team.some(
      (member) => member._id.toString() === user._id.toString()
    );

    if (!isOwner && !isTeamMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({
      owner: project.owner,
      team: project.team,
      isOwner,
    });
  } catch (error) {
    console.error("Get team error:", error);
    return res.status(500).json({ message: "Server Error" ,error: error.message});
  }
};

// Remove Team Member
export const removeTeamMember = async (req, res) => {
  const { projectId, memberId } = req.params;
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await Signup.findOne({ email: decoded.email });

    const project = await ProjectModel.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only owner can remove members
    if (project.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Only project owner can remove members" });
    }

    // Can't remove owner
    if (memberId === project.owner.toString()) {
      return res.status(400).json({ message: "Cannot remove project owner" });
    }

    // Remove member from team
    project.team = project.team.filter(
      (member) => member.toString() !== memberId
    );
    await project.save();

    return res.status(200).json({ message: "Team member removed" });
  } catch (error) {
    console.error("Remove member error:", error);
    return res.status(500).json({ message: "Server Error",error: error.message });
  }
};
