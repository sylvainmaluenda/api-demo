import notificationService from "./notification.sevice.js";
import AppError from "./errors/AppError.js";

const notificationController = {
  async fakeSendEmail(req, res) {
    const { order } = req.body;

    //Payload validation
    if (!order) {
      throw new AppError("An order is necessary as top-level property", 400);
    }

    if (typeof order !== "object") {
      throw new AppError("order must be an object", 400);
    }

    const isUnauthorizedProp = Object.keys(req.body).some(
      (prop) => prop !== "order",
    );

    if (isUnauthorizedProp) {
      throw new AppError("Only order is allowed as top-level property", 400);
    }

    const result = await notificationService.fakeSendEmail(order);
    res.status(200).json(result);
  },
};

export default notificationController;
