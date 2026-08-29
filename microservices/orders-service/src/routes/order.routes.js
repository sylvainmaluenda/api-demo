import express from "express";
const router = express.Router();

import orderController from "../controllers/order.controller.js";

router.get("/", orderController.findAll);

router.get("/pending/send-reminders", orderController.sendReminders);

router.get("/:id", orderController.findUnique);

router.post("/", orderController.create);

router.patch("/:id", orderController.update);

router.delete("/:id", orderController.delete);

export default router;
