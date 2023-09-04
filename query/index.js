const express = require("express");
const app = express();
const colors = require("colors");
const axios = require("axios");

// setup body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// setup cors
const cors = require("cors");
app.use(cors());

const posts = {};

app.get("/posts", (req, res) => {
  res.status(200).json({
    success: true,
    message: "posts are fetched successfully",
    data: posts,
  });
});

const handleEvent = (type, data) => {
  if (type === "PostCreated") {
    const { id, title } = data;
    posts[id] = { id, title };
  } else if (type === "CommentCreated") {
    const { id, content, postId, status } = data;
    const comments = posts[postId].comments || [];
    comments.push({ id, content, status });
    posts[postId].comments = comments;
  } else if (type === "CommentUpdated") {
    const { id, content, postId, status } = data;
    const comments = posts[postId].comments;
    const comment = comments.find((comment) => comment.id === id);
    comment.status = status;
    comment.content = content;
  }
};

app.post("/events", (req, res) => {
  const { type, data } = req.body;
  console.log(`event received: ${type}`);
  handleEvent(type, data);
  res.status(200).json({
    success: true,
    message: "event is received successfully",
    data: req.body,
  });
});

const PORT = 4002;
const server = app.listen(PORT, async () => {
  const events = await axios.get("http://event-bus-cluster-ip-service:4005/events");

  for (let event of events.data.data) {
    handleEvent(event.type, event.data);
  }

  console.log(`query-service is running on port ${PORT}`.green.inverse);
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  server.close(() => process.exit(1));
});
