import orderRepository from "../repositories/order.repository.js";
import orderBatchService from "./orderBatch.service.js";
import AppError from "../errors/AppError.js";

const orderService = {
  async findAll() {
    return await orderRepository.findAll();
  },

  async findUnique(id) {
    const order = await orderRepository.findUnique(id);

    if (!order) {
      throw new AppError(`La commande #${id} n'existe pas`, 404);
    }

    return order;
  },

  async create(order) {
    const id = order.userId;

    const response = await fetch(`http://localhost:3001/users/${id}`);
    const data = await response.json();

    if (data.error) {
      throw new AppError(data.error, 404);
    }

    return await orderRepository.create({ ...order, status: "pending" });
  },

  async update(id, status) {
    return await orderRepository.update(id, status);
  },

  delete(id) {
    const order = orderRepository.findUnique(id);
    if (!order) {
      throw new AppError(`Order #${id} not found`, 404);
    }

    orderRepository.delete(id);
  },

  async sendReminders() {
    const ordersPending = await orderRepository.findPending();

    if (!ordersPending) {
      throw new AppError("No order exists with a pending status", 404);
    }

    const signal = AbortSignal.timeout(10_000);

    const startTime = new Date();

    // orderBatchService : manage error 413 : Payoad Too Large & server timeout
    const rawResults = await orderBatchService.processOrders(
      ordersPending,
      signal,
    );

    return orderBatchService.getReport(
      ordersPending.length,
      rawResults,
      startTime,
      signal,
    );
  },
};

export default orderService;
