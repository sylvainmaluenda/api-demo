import config from "../config/ordersService.config.js";
import { OrderStatus, Products, Order } from "../types/order.types.js";

const orders: Order[] = [];

const status: OrderStatus[] = ["pending", "confirmed", "shipped", "cancelled"];

const ordersLength: number = config.orderSize;

const randomIntegerBetween = (min: number, max: number): number => {
  const float = Math.random() * (max - min + 1) + min;
  const integer = Math.floor(float);
  return integer;
};

const randomFloatBetween = (
  min: number,
  max: number,
  decimals: number = 2,
): number => {
  const rawFloat = Math.random() * (max - min) + min;

  /*
  const factor = Math.pow(10, decimals); // ou 10 ** decimals
  const roundFloat = Math.round(rawFloat * factor) / factor;
  */

  const roundFloat = Number(rawFloat.toFixed(decimals));
  return roundFloat;
};

const randomValueFromArray = (array: OrderStatus[]): OrderStatus => {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
};

for (let i = 0; i < ordersLength; i++) {
  const products = Array.from({ length: randomIntegerBetween(1, 3) }, () => ({
    productId: randomIntegerBetween(1, 100),
    price: randomFloatBetween(250, 1000),
    quantity: randomIntegerBetween(1, 10),
  }));

  const amount = products.reduce((total, p) => total + p.price * p.quantity, 0);

  orders.push({
    id: i + 1,
    userId: randomIntegerBetween(1, 500),
    products: products,
    amount: Number(amount.toFixed(2)),
    status: randomValueFromArray(status),
  });
}

//console.dir(orders, { depth: null, maxArrayLength: null });

export default orders;
