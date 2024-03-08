const mongoose = require("mongoose"); // Base de donnée

// Initialisation du modèle User
const User = mongoose.model("User", {
  account: {
    userName: {
      type: String,
      required: true,
    },
    avatar: String,
  },
  email: {
    type: String,
    required: true,
  },
  newsletter: Boolean,
  token: String,
  hash: String,
  salt: String,
});

module.exports = User;
