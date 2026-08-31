import orderService from "../services/order.service.js";
import AppError from "../errors/AppError.js";

const orderController = {
  async findAll(_req, res) {
    const orders = await orderService.findAll();
    res.status(200).json(orders);
  },

  async findUnique(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("Id should be a positive integer", 400);
    }

    const order = await orderService.findUnique(id);
    res.status(200).json(order);
  },

  async create(req, res) {
    // Business rules :
    // The initial status must be "pending"
    // Product prices must be get from repository
    // Total amount must be calculated from backoffice

    const allowedOrderProps = ["userId", "products"];

    const isUnauthorizedProp = Object.keys(req.body).some(
      (prop) => !allowedOrderProps.includes(prop),
    );

    if (isUnauthorizedProp) {
      throw new AppError(
        "Only userId and products are allowed as top-level properties",
        400,
      );
    }

    const order = await orderService.create(req.body);
    res.status(201).json(order);
  },

  async update(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("Id should be a positive integer", 400);
    }

    const allowedStatus = ["pending", "confirmed", "shipped", "cancelled"];
    const status = req.body.status;

    if (!status) {
      throw new AppError("Key status is necessary", 400);
    }

    if (!allowedStatus.includes(status)) {
      throw new AppError(
        `Only theses status are possible: ${allowedStatus.join(", ")}`,
        400,
      );
    }

    const order = await orderService.patch(id, status);
    res.status(200).json(order);
  },

  delete(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("Id should be a positive integer", 400);
    }

    orderService.delete(id);
    res.sendStatus(204);
  },

  async sendReminders(_req, res) {
    const datas = await orderService.sendReminders();
    res.status(200).json(datas);
  },
};

export default orderController;
