require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const leadRoutes = require("./routes/leadroutes");
app.use("/api/leads", leadRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "VyapaarAI backend is running!"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "VyapaarAI API is working"
  });
});

// Lead API
app.use("/api/leads", leadRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});