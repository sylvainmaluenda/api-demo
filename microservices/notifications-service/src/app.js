import express from "express";
import notificationController from "./notification.controller.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

app.use(express.json());

app.post("/notifications/send-email", notificationController.fakeSendEmail);

app.use(notFound);
app.use(errorHandler);

export default app;
