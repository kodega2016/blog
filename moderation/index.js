const express = require("express");
const app = express();
const colors = require("colors");
const axios = require("axios");

// setup body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/events", (req, res) => {
  const { type, data } = req.body;
  console.log(`event received: ${type}`);

  if (type === "CommentCreated") {
    const { id, content, postId } = data;
    const status = content.includes("orange") ? "rejected" : "approved";
    const event = {
      type: "CommentModerated",
      data: {
        id,
        content,
        postId,
        status,
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

const PORT = 4003;
const server = app.listen(PORT, () => {
  console.log(`moderation-service is running on port ${PORT}`.green.inverse);
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  server.close(() => process.exit(1));
});
