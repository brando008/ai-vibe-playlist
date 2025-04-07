// backend/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

// Middleware setup
app.use(cors());
app.use(express.json());

// test
app.get("/", (req, res) => {
  res.json({ message: "Backend is up and running!" });
});

// Import routes from the routes folder here
// Example: const authRoutes = require('./router/auth');
// app.use('/auth', authRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
