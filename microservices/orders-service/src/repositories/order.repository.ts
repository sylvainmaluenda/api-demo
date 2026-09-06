import orders from "./orders.mock.js";
import { OrderStatus, Order } from "../types/order.types.js";

const apiSimulatedDelayMs: number = 1000;

const ordersMap = new Map(orders.map((order) => [order.id, order]));

const orderRepository = {
  async findAll(): Promise<Order[]> {
    await delay(apiSimulatedDelayMs);

    return [...ordersMap.values()];
  },

  async findUnique(id: number): Promise<Order | undefined> {
    await delay(apiSimulatedDelayMs);

    return ordersMap.get(id);
  },

  async findPending(): Promise<Order[]> {
    await delay(apiSimulatedDelayMs);

    return [...ordersMap.values()].filter(
      (order) => order.status === "pending",
    );
  },

  async create(order: Omit<Order, "id">): Promise<Order | undefined> {
    await delay(apiSimulatedDelayMs);

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
    await delay(apiSimulatedDelayMs);

    const order = ordersMap.get(id)!;

    const orderUpdated = { ...order, status };
    ordersMap.set(id, orderUpdated);

    return ordersMap.get(id);
  },

  async delete(id: number): Promise<void> {
    await delay(apiSimulatedDelayMs);

    ordersMap.delete(id);
  },
};

const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export default orderRepository;
