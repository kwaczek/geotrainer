import mongoose, { Document, Schema } from 'mongoose';

export interface IQuiz extends Document {
  title: string;
  category: string;
  difficulty: string;
  questions: Array<{
    imageUrl: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;
  requiredLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

const quizSchema = new Schema<IQuiz>(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['flags', 'capitals', 'poles', 'license_plates', 'road_signs', 'general'],
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    },
    questions: [
      {
        imageUrl: {
          type: String,
          required: true,
        },
        question: {
          type: String,
          required: true,
        },
        options: {
          type: [String],
          required: true,
        },
        correctAnswer: {
          type: String,
          required: true,
        },
        explanation: {
          type: String,
          required: true,
        },
      },
    ],
    requiredLevel: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);

export default Quiz;
