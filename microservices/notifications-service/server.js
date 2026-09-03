import config from "./config/notificationsService.config.js";
import app from "./src/app.js";

app.listen(config.port, () => {
  console.log(`Service Notifications running on port ${config.port}`);
});
