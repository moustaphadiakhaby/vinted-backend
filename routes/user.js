const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

const Account = require("../models/Account");

router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    const { username, email, password, newsletter } = req.body;

    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(32);

    const account = await Account.findOne({ email: email });

    if (!username) {
      return res.json({
        message: "Please make ensure that you have entered an username",
      });
    }

    if (account) {
      return res.json({ message: "This email is already used" });
    }

    const result = await cloudinary.uploader.upload(
      convertToBase64(req.files.avatar),
      {
        folder: "/pfp",
      }
    );

    const newAccount = new Account({
      email: email,
      account: {
        username: username,
        avatar: result,
      },
      newsletter: newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });

    await newAccount.save();

    const response = {
      _id: newAccount._id,
      token: newAccount.token,
      account: newAccount.account,
    };

    res.json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const account = await Account.findOne({ email: req.body.email });

    if (!account) {
      return res.status(400).json({ message: "Unauthorized" });
    }

    const hash = SHA256(req.body.password + account.salt).toString(encBase64);

    if (hash !== account.hash) {
      return res.status(400).json({ message: "Unauthorized" });
    }

    const response = {
      _id: account._id,
      token: account.token,
      account: account.account,
    };

    res.json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
