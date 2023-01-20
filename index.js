const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

mongoose.set("strictPopulate", false);
mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGODB_URI);
const cors = require("cors");

const app = express();
app.use(cors());

app.use(express.json());

const userRoutes = require("./routes/user");
app.use(userRoutes);

const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

app.get("/", (req, res) => {
  res.json("Bienvenue sur mon serveur 👨🏾‍💻🥷🏾");
});

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exist" });
});

app.listen(process.env.PORT, () => {
  console.log("Server has been started 🚀🥳");
});
