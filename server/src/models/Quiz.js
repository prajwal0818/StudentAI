const mongoose = require('mongoose');
const { Schema } = mongoose;

const questionSchema = new Schema({
  type: {
    type: String,
    enum: ['mcq', 'short_answer', 'true_false'],
    required: true
  },
  question: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  options: {
    type: [String],
    validate: {
      validator: function(arr) {
        // Options required only for MCQ
        if (this.type === 'mcq') {
          return arr && arr.length === 4;
        }
        return true;
      },
      message: 'MCQ questions must have exactly 4 options'
    }
  },
  correctAnswer: {
    type: String,
    required: true
  },
  acceptableAnswers: {
    type: [String],
    default: []
  },
  explanation: {
    type: String,
    required: true
  },
  contextChunk: {
    type: String,
    required: true
  }
}, { _id: false });

const resultSchema = new Schema({
  questionIndex: {
    type: Number,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  pointsEarned: {
    type: Number,
    required: true,
    default: 0
  },
  feedback: {
    type: String,
    default: ''
  }
}, { _id: false });

const quizSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mixed'],
    required: true
  },
  documentIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Document'
  }],
  questions: {
    type: [questionSchema],
    required: true,
    validate: {
      validator: function(arr) {
        return arr && arr.length > 0;
      },
      message: 'Quiz must have at least one question'
    }
  },
  isSubmitted: {
    type: Boolean,
    default: false
  },
  userAnswers: {
    type: [String],
    default: []
  },
  results: {
    type: [resultSchema],
    default: []
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  totalPoints: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
quizSchema.index({ userId: 1, createdAt: -1 });
quizSchema.index({ userId: 1, isSubmitted: 1 });

// Virtual for pass/fail status
quizSchema.virtual('isPassed').get(function() {
  return this.score >= 60; // 60% passing grade
});

// Method to check if quiz belongs to user
quizSchema.methods.belongsToUser = function(userId) {
  return this.userId.toString() === userId.toString();
};

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
