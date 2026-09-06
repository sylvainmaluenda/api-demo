import config from "../../config/ordersService.config.js";
import orderRepository from "../repositories/order.repository.js";
import orderBatchService from "./orderBatch.service.js";
import AppError from "../errors/AppError.js";
import { CreateOrderDto, Order, OrderStatus } from "../types/order.types.js";
import { Report } from "../types/sendReminders.types.js";

const orderService = {
  async findAll(): Promise<Order[]> {
    const orders: Order[] = await orderRepository.findAll();
    return orders;
  },

  async findUnique(id: number): Promise<Order | undefined> {
    const order: Order | undefined = await orderRepository.findUnique(id);

    if (!order) {
      throw new AppError(`La commande #${id} n'existe pas`, 404);
    }

    return order;
  },

  async create(order: CreateOrderDto): Promise<Order | undefined> {
    const amount: number = order.products.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0,
    );

    return await orderRepository.create({
      userId: order.userId,
      products: order.products,
      amount: amount,
      status: "pending",
    });
  },

  async update(id: number, status: OrderStatus): Promise<Order | undefined> {
    const order: Order | undefined = await orderRepository.findUnique(id);
    if (!order) {
      throw new AppError(`Order #${id} not found`, 404);
    }

    return await orderRepository.update(id, status);
  },

  async delete(id: number): Promise<void> {
    const order: Order | undefined = await orderRepository.findUnique(id);
    if (!order) {
      throw new AppError(`Order #${id} not found`, 404);
    }

    await orderRepository.delete(id);
  },

  async sendReminders(): Promise<Report> {
    const ordersPending: Order[] = await orderRepository.findPending();

    if (!ordersPending) {
      throw new AppError("No order exists with a pending status", 404);
    }

    const signal: AbortSignal = AbortSignal.timeout(config.abortTimeOutMs);

    const timeStamp: number = Date.now();

    // orderBatchService : manage error 413 : Payoad Too Large & server timeout
    const rawResults = await orderBatchService.processOrders(
      ordersPending,
      signal,
    );

    return orderBatchService.getReport(
      ordersPending.length,
      rawResults,
      timeStamp,
      signal,
    );
  },
};

export default orderService;
