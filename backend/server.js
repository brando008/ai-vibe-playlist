// backend/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 8888;

// Middlewear
app.use(cors());
app.use(express.json());

// Route modules
app.use("/auth", require("./routes/auth"));
app.use("/api", require("./routes/parse"));
app.use("/api/spotify", require("./routes/spotify"));

// Basic confirmation
app.get("/", (req, res) => {
  res.json({ message: "Backend is up and running over HTTPS" });
});

// HTTPS server setup
const httpsOptions = {
  key: fs.readFileSync(path.resolve(__dirname, "server.key")),
  cert: fs.readFileSync(path.resolve(__dirname, "server.cert")),
};

https.createServer(httpsOptions, app).listen(port, () => {
  console.log(`HTTPS Server running on https://127.0.0.1:${port}`);
});
