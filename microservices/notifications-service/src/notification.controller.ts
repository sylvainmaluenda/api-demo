import notificationService from "./notification.service.js";
import AppError from "./errors/AppError.js";
import { Request, Response } from "express";
import { OrderResult, SendEmailBody } from "./types/notifications.types.js";

const notificationController = {
  async fakeSendEmail(req: Request<{}, {}, SendEmailBody>, res: Response) {
    const { order } = req.body;

    //Payload validation
    if (!order) {
      throw new AppError("An order is necessary as top-level property", 400);
    }

    if (typeof order !== "object") {
      throw new AppError("Order must be an object", 400);
    }

    const isUnauthorizedProp = Object.keys(req.body).some(
      (prop) => prop !== "order",
    );

    if (isUnauthorizedProp) {
      throw new AppError("Only order is allowed as top-level property", 400);
    }

    const result: OrderResult = await notificationService.fakeSendEmail(order);
    res.status(200).json(result);
  },
};

export default notificationController;
