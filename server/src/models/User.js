const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    googleTokens: {
      accessToken: { type: String, default: null },
      refreshToken: { type: String, default: null },
      expiryDate: { type: Number, default: null },
      gmailAddress: { type: String, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
