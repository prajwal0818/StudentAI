const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
    extractedText: { type: String, default: '' },
    chunkCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
