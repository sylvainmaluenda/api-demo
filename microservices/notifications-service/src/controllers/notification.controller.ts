import notificationService from "../services/notification.service.js";
import { Request, Response } from "express";
import { Report } from "../types/notifications.types.js";

const notificationController = {
  async sendReminders(_req: Request, res: Response) {
    const result: Report = await notificationService.sendReminders();
    res.status(200).json(result);
  },
};

export default notificationController;
