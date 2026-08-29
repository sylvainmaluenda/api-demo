import orders from "./orders.mock.js";

const ordersMap = new Map(orders.map((order) => [order.id, order]));

const orderRepository = {
  findAll() {
    return [...ordersMap.values()];
  },

  findUnique(id) {
    return ordersMap.get(id);
  },

  findPending() {
    return [...ordersMap.values()].filter(
      (order) => order.status === "pending",
    );
  },

  create(order) {
    const maxId = [...ordersMap.values()].reduce(
      (max, order) => Math.max(order.id, max),
      -Infinity,
    );

    const nextId = maxId + 1;

    const newOrder = { id: nextId, ...order };
    ordersMap.set(nextId, newOrder);

    return ordersMap.get(nextId);
  },

  update(id, status) {
    const order = ordersMap.get(id);

    const orderUpdated = { ...order, status };
    ordersMap.set(id, orderUpdated);

    return ordersMap.get(id);
  },

  delete(id) {
    ordersMap.delete(id);
  },
};

const delay = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const addDelayToMethods = (targetObject, delayMs = 1000) => {
  return Object.entries(targetObject).reduce(
    (acc, [propertyName, propertyValue]) => {
      if (typeof propertyValue === "function") {
        acc[propertyName] = async function (...args) {
          await delay(delayMs);
          return propertyValue(...args);
          return propertyValue.apply(this, args);
        };
      } else {
        acc[propertyName] = propertyValue;
      }

      return acc;
    },
    {},
  );
};

const delayedorderRepository = addDelayToMethods(orderRepository, 1000);

export default delayedorderRepository;
