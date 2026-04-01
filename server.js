const express = require("express");
const app = express();

// Simple health check route
app.get("/", (req, res) => {
  res.send("TKO bot is running");
});

// Use Render's PORT if provided, otherwise default to 3000 locally
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Keep-alive server running on port ${port}`);
});
