const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const connectDB = require("./config/db");
const PORT = process.env.PORT || 5000;


connectDB();

const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://prepbuddy-pro.vercel.app"  
  ],
  credentials: true
}));
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/interview", require("./routes/interview"));

app.get("/", (req, res) => res.send("PrepBuddy API running"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`) );

