const express = require("express");
const app = express();
const axios = require("axios");
const colors = require("colors");

// setup body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const events = [];

app.get("/events", (req, res) => {
  res.status(200).json({
    success: true,
    message: "events are fetched successfully",
    data: events,
  });
});

app.post("/events", (req, res) => {
  const { type, data } = req.body;
  console.log(`event received: ${type}`);

  axios.post("http://posts-cluster-ip-service:4000/events", req.body).catch((err) => {
    console.log(err.message);
  });
  axios.post("http://comments-cluster-ip-service:4001/events", req.body).catch((err) => {
    console.log(err.message);
  });
  axios.post("http://query-cluster-ip-service:4002/events", req.body).catch((err) => {
    console.log(err.message);
  });
  axios.post("http://moderation-cluster-ip-service:4003/events", req.body).catch((err) => {
    console.log(err.message);
  });

  events.push(req.body);

  res.status(200).json({
    success: true,
    message: "event is received successfully",
    data: req.body,
  });
});

const PORT = 4005;
const server = app.listen(PORT, () => {
  console.log(`event-bus is running on port ${PORT}`.green.inverse);
});

process.on("uncaughtException", (err) => {
  console.log(err);
  server.close(() => process.exit(1));
});
