import orderRepository from "../repositories/order.repository.js";
import AppError from "../errors/AppError.js";
import { CreateOrderDto, Order, OrderStatus } from "../types/order.types.js";

const orderService = {
  async findAll(
    status: string | undefined,
    page: number,
    limit: number,
  ): Promise<Order[]> {
    const orders: Order[] = await orderRepository.findAll(status, page, limit);
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

  async delete(id: number): Promise<boolean> {
    const order: Order | undefined = await orderRepository.findUnique(id);
    if (!order) {
      throw new AppError(`Order #${id} not found`, 404);
    }

    return await orderRepository.delete(id);
  },

  async count(status: string | undefined): Promise<number> {
    return await orderRepository.count(status);
  },
};

export default orderService;
