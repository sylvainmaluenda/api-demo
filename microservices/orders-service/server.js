import config from "./src/config/ordersService.config.js";
import app from "./src/app.js";

app.listen(config.port, () => {
  console.log(`Service Orders running on port ${config.port}`);
});
