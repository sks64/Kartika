const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config();
require("./configs/databaseConnection");

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://car.vkrepo.in",
      "https://web-py1p.onrender.com",
      "https://starfish-app-hom4h.ondigitalocean.app"
    ],
  })
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/api', express.static(path.join(__dirname, "/public")))

app.use(`/api/v1/auth`, require("./src/v1/routes/auth.routes"));
app.use(`/api/v1/user`, require("./src/v1/routes/user.routes"));
app.use(`/api/v1/head-office`, require("./src/v1/routes/head.office.routes"));
app.use(`/api/v1/branch`, require("./src/v1/routes/branch.routes"));
app.use(`/api/v1/vehicle`, require("./src/v1/routes/vehicle.routes"));
app.use(`/api/v1/header`, require("./src/v1/routes/file.header.routes"));
app.use(`/api/v1/file/info`, require("./src/v1/routes/fileInfo.routes"));
app.use(`/api/v1/details`, require("./src/v1/routes/details.routes"));
app.use(`/api/v1/plan`, require("./src/v1/routes/user.plan.routes"));
app.use(`/api/v1/otp`, require("./src/v1/routes/otp.routes"));

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Something went wrong!";
  return res.status(status).json({
    success: false,
    status: status,
    message: message,
  });
});

const port = process.env.PORT || 5002;
const server = app.listen(port, () => {
  console.log(`Hello world app listening on port ${port}!`);
});

// Handle port already in use gracefully
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${port} is already in use!`);
    console.error(`   Run this command to free it: npx kill-port ${port}`);
    process.exit(1);
  } else {
    throw err;
  }
});

// Clean shutdown so nodemon restarts release the port immediately
process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT',  () => server.close(() => process.exit(0)));
