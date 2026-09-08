import orderService from "../services/order.service.js";
import AppError from "../errors/AppError.js";
import type { Request, Response } from "express";
import {
  OrderStatus,
  Order,
  CreateOrderDto,
  UpdateOrderDto,
} from "../types/order.types.js";

interface PaginationQuery {
  status?: OrderStatus;
  page?: string;
  limit?: string;
}

interface CountQuery {
  status?: OrderStatus;
}

const allowedStatus = ["pending", "confirmed", "shipped", "cancelled"] as const;

const orderController = {
  async findAll(
    req: Request<{}, {}, {}, PaginationQuery>,
    res: Response,
  ): Promise<void> {
    const status = req.query.status ?? undefined;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 1_000);

    if (page < 1 || limit < 1 || limit > 1_000) {
      throw new AppError("Invalid pagination parameters", 400);
    }

    if (status && !allowedStatus.includes(status)) {
      throw new AppError(
        `Only theses status are possible: ${allowedStatus.join(", ")}`,
        400,
      );
    }

    const orders: Order[] = await orderService.findAll(status, page, limit);
    res.status(200).json(orders);
  },

  async findUnique(req: Request, res: Response): Promise<void> {
    const id: number = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("Id should be a positive integer", 400);
    }

    const order: Order | undefined = await orderService.findUnique(id);
    res.status(200).json(order);
  },

  async create(
    req: Request<{}, {}, CreateOrderDto>,
    res: Response,
  ): Promise<void> {
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

    const order: Order | undefined = await orderService.create(req.body);
    res.status(201).json(order);
  },

  async update(
    req: Request<{ id: string }, {}, UpdateOrderDto>,
    res: Response,
  ): Promise<void> {
    const id: number = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("Id should be a positive integer", 400);
    }

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

  async delete(req: Request, res: Response): Promise<void> {
    const id: number = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("Id should be a positive integer", 400);
    }

    if (await orderService.delete(id)) {
      res.sendStatus(204);
    }
  },

  async count(
    req: Request<{}, {}, {}, CountQuery>,
    res: Response,
  ): Promise<void> {
    const status = req.query.status ?? undefined;

    if (status && !allowedStatus.includes(status)) {
      throw new AppError(
        `Only theses status are possible: ${allowedStatus.join(", ")}`,
        400,
      );
    }

    const count: number = await orderService.count(status);
    res.status(200).json({ count: count });
  },
};

export default orderController;
