require("colors");
const axios = require("axios");
const express = require("express");
const app = express();

// setup cors
const cors = require("cors");
app.use(cors());

// setup body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { randomBytes } = require("crypto");
const commentsByPostId = {};

app.post("/posts/:id/comments", (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const commentID = randomBytes(4).toString("hex");

  const comments = commentsByPostId[id] || [];
  comments.push({ id: commentID, content, status: "pending" });
  commentsByPostId[id] = comments;

  // emit event
  const event = {
    type: "CommentCreated",
    data: {
      id: commentID,
      content,
      postId: id,
      status: "pending",
    },
  };

  axios.post("http://event-bus-cluster-ip-service:4005/events", event);

  res.status(201).json({
    success: true,
    message: "comment is created successfully",
    data: comments,
  });
});

app.get("/posts/:id/comments", (req, res) => {
  const { id } = req.params;
  const comments = commentsByPostId[id] || [];

  res.status(200).json({
    success: true,
    message: "comments are fetched successfully",
    data: comments,
  });
});

app.post("/events", (req, res) => {
  const { type, data } = req.body;
  console.log(`event received: ${type}`);

  if (type === "CommentModerated") {
    const { id, postId, status, content } = data;
    const comments = commentsByPostId[postId];
    const comment = comments.find((comment) => comment.id === id);
    comment.status = status;

    // emit event
    const event = {
      type: "CommentUpdated",
      data: {
        id,
        postId,
        status,
        content,
      },
    };

    axios.post("http://event-bus-cluster-ip-service:4005/events", event);
  }

  res.status(200).json({
    success: true,
    message: "event is received successfully",
    data: req.body,
  });
});

const PORT = 4001;
const server = app.listen(PORT, () => {
  console.log(`comment-service is running on port ${PORT}`.green.inverse);
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  server.close(() => process.exit(1));
});
