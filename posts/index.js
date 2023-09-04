const express = require("express");
const app = express();
const { randomBytes } = require("crypto");
const axios = require("axios");
const colors = require("colors");

const posts = {};

// setup cors
const cors = require("cors");
app.use(cors());

// setup body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/posts", async (req, res) => {
  const id = randomBytes(4).toString("hex");
  const { title } = req.body;
  posts[id] = { id, title };

  // emit event to event-bus
  await axios.post("http://event-bus-cluster-ip-service:4005/events", {
    type: "PostCreated",
    data: { id, title },
  });

  res.status(201).json({
    success: true,
    message: "post is created successfully",
    data: posts[id],
  });
});

app.get("/posts", (req, res) => {
  res.status(200).json({
    success: true,
    message: "posts are fetched successfully",
    data: posts,
  });
});

app.post("/events", (req, res) => {
  const { type, data } = req.body;

  console.log(`event received: ${type}`);

  res.status(200).json({
    success: true,
    message: "event is received successfully",
    data: req.body,
  });
});

const PORT = 4000;
const server = app.listen(PORT, () => {
  console.log(`post-service is running on port ${PORT}`.green.inverse);
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  server.close(() => process.exit(1));
});
