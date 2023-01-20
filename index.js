require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

mongoose.set("strictPopulate", false);
mongoose.set("strictQuery", false);
mongoose.connect("mongodb://localhost:27017/vinted");
const cors = require("cors");

const app = express();
app.use(cors());

app.use(express.json());

const userRoutes = require("./routes/user");
app.use(userRoutes);

const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exist" });
});

app.listen(3000, () => {
  console.log("Server has been started 🚀🥳");
});
