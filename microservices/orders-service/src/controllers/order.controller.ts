import orderService from "../services/order.service.js";
import AppError from "../errors/AppError.js";
import type { Request, Response } from "express";
import { OrderStatus, Order, CreateOrderDto } from "../types/order.types.js";
import { Report } from "../types/sendReminders.types.js";

const orderController = {
  async findAll(_req: Request, res: Response) {
    const orders: Order[] = await orderService.findAll();
    res.status(200).json(orders);
  },

  async findUnique(req: Request, res: Response) {
    const id: number = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("Id should be a positive integer", 400);
    }

    const order: Order | undefined = await orderService.findUnique(id);
    res.status(200).json(order);
  },

  async create(req: Request, res: Response) {
    // Business rules :
    // The initial status must be "pending"
    // Product prices must be get from repository
    // Total amount must be calculated from backoffice

    const allowedOrderProps = ["userId", "products"];
    const createOrderDto: CreateOrderDto = req.body;

    const isUnauthorizedProp = Object.keys(createOrderDto).some(
      (prop) => !allowedOrderProps.includes(prop),
    );

    if (isUnauthorizedProp) {
      throw new AppError(
        "Only userId and products are allowed as top-level properties",
        400,
      );
    }

    const order: Order | undefined = await orderService.create(createOrderDto);
    res.status(201).json(order);
  },

  async update(req: Request, res: Response) {
    const id: number = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("Id should be a positive integer", 400);
    }

    const allowedStatus = ["pending", "confirmed", "shipped", "cancelled"];
    const status: OrderStatus = req.body.status;

    if (!status) {
      throw new AppError("Key status is necessary", 400);
    }

    if (!allowedStatus.includes(status)) {
      throw new AppError(
        `Only theses status are possible: ${allowedStatus.join(", ")}`,
        400,
      );
    }

    const order: Order | undefined = await orderService.update(id, status);
    res.status(200).json(order);
  },

  delete(req: Request, res: Response) {
    const id: number = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("Id should be a positive integer", 400);
    }

    orderService.delete(id);
    res.sendStatus(204);
  },

  async sendReminders(_req: Request, res: Response) {
    const datas: Report = await orderService.sendReminders();
    res.status(200).json(datas);
  },
};

export default orderController;
