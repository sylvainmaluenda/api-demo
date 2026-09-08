import express from "express";
const router = express.Router();

import notificationController from "../controllers/notification.controller.js";

router.get("/send-reminders", notificationController.sendReminders);

export default router;
