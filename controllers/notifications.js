import jwt from "jsonwebtoken";
import Notification from "../models/Notification.model.js";
import Signup from "../models/Signup.model.js";

const getCurrentUser = async (req) => {
  const token = req.cookies?.accessToken;
  if (!token) return null;

  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  return Signup.findOne({ email: decoded.email });
};

const toObjectIdString = (value) => value?._id?.toString() || value?.toString();

export const createNotification = async ({
  recipient,
  actor = null,
  type,
  title,
  description,
  project = null,
  task = null,
  metadata = {},
}) => {
  const recipientId = toObjectIdString(recipient);
  const actorId = toObjectIdString(actor);

  if (!recipientId || (actorId && recipientId === actorId)) return null;

  return Notification.create({
    recipient: recipientId,
    actor: actorId || null,
    type,
    title,
    description,
    project,
    task,
    metadata,
  });
};

export const createNotifications = async (notifications) => {
  const created = await Promise.all(
    notifications.filter(Boolean).map((notification) => createNotification(notification)),
  );

  return created.filter(Boolean);
};

export const getNotifications = async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { type, read, page = 1, limit = 30 } = req.query;
    const filter = { recipient: user._id };

    if (type && type !== "all") filter.type = type;
    if (read === "true") filter.read = true;
    if (read === "false") filter.read = false;

    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.min(Math.max(Number(limit), 1), 100);

    const [notifications, unreadCount, total] = await Promise.all([
      Notification.find(filter)
        .populate("actor", "username email profile")
        .populate("project", "title")
        .populate("task", "title status")
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      Notification.countDocuments({ recipient: user._id, read: false }),
      Notification.countDocuments(filter),
    ]);

    return res.status(200).json({
      notifications,
      unreadCount,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
  }
};

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const unreadCount = await Notification.countDocuments({
      recipient: user._id,
      read: false,
    });

    return res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Get unread count error:", error);
    return res.status(500).json({ message: "Failed to fetch unread count", error: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, recipient: user._id },
      { $set: { read: true } },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return res.status(500).json({ message: "Failed to update notification", error: error.message });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const result = await Notification.updateMany(
      { recipient: user._id, read: false },
      { $set: { read: true } },
    );

    return res.status(200).json({
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    return res.status(500).json({ message: "Failed to update notifications", error: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const deleted = await Notification.findOneAndDelete({
      _id: req.params.notificationId,
      recipient: user._id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Delete notification error:", error);
    return res.status(500).json({ message: "Failed to delete notification", error: error.message });
  }
};
