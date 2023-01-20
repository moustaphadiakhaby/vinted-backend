const mongoose = require("mongoose");

const Account = mongoose.model("Account", {
  email: String,
  account: {
    username: String,
    avatar: Object,
  },
  newsletter: Boolean,
  token: String,
  hash: String,
  salt: String,
});

module.exports = Account;
