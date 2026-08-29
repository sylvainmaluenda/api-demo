import express from "express";
import orderRouter from "./routes/order.routes.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";

// TODO :
// - add JWT authentification & CORS security
// - add unit & integration tests

const app = express();

app.use(express.json());
app.use("/orders", orderRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
