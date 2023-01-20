const Account = require("../models/Account");

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers.authorization.replace("Bearer ", "");

    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await Account.findOne({ token: token });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;

    next();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
