import orders from "./orders.mock.js";
import { OrderStatus, Order } from "../types/order.types.js";
import config from "../config/ordersService.config.js";

const { apiSimulatedLatencyMs } = config;

const ordersMap = new Map(orders.map((order) => [order.id, order]));

const orderRepository = {
  async findAll(
    status: string | undefined,
    page: number,
    limit: number,
  ): Promise<Order[]> {
    await delay(apiSimulatedLatencyMs);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    if (!status) {
      return [...ordersMap.values()].slice(startIndex, endIndex);
    }

    return [...ordersMap.values()]
      .filter((order) => order.status === status)
      .slice(startIndex, endIndex);
  },

  async findUnique(id: number): Promise<Order | undefined> {
    await delay(apiSimulatedLatencyMs);

    return ordersMap.get(id);
  },

  async create(order: Omit<Order, "id">): Promise<Order | undefined> {
    await delay(apiSimulatedLatencyMs);

    const maxId: number = [...ordersMap.values()].reduce(
      (max, order) => Math.max(order.id, max),
      -Infinity,
    );

    const nextId: number = maxId + 1;

    const newOrder: Order = { id: nextId, ...order };
    ordersMap.set(nextId, newOrder);

    return ordersMap.get(nextId);
  },

  async update(id: number, status: OrderStatus): Promise<Order | undefined> {
    await delay(apiSimulatedLatencyMs);

    const order = ordersMap.get(id)!;

    const orderUpdated = { ...order, status };
    ordersMap.set(id, orderUpdated);

    return ordersMap.get(id);
  },

  async delete(id: number): Promise<boolean> {
    await delay(apiSimulatedLatencyMs);

    ordersMap.delete(id);
    return ordersMap.has(id);
  },

  async count(status: string | undefined): Promise<number> {
    await delay(apiSimulatedLatencyMs);

    if (!status) {
      return ordersMap.size;
    }

    return [...ordersMap.values()].filter((order) => order.status === status)
      .length;
  },
};

const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export default orderRepository;
