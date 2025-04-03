import mongoose, { Document, Schema } from 'mongoose';

// Quiz type enum
export enum QuizType {
  FLAGS = 'flags',
  CAPITALS = 'capitals',
  BOLLARDS = 'bollards',
  LICENSEPLATES = 'licenseplates',
  ROADSIGNS = 'roadsigns',
  LANGUAGES = 'languages'
}

// Quiz filters interface
export interface QuizFilters {
  continent?: string;
  inGeoguessr?: boolean;
}

// Question attempt interface
export interface QuestionAttempt {
  questionId: string;
  questionText: string;
  correctCountryId: mongoose.Types.ObjectId;
  selectedCountryId: mongoose.Types.ObjectId | null;
  isCorrect: boolean;
  timeSpentMs: number;
  imageUrl?: string;
  userCustomInput?: string;
}

// Main quiz result interface
export interface IQuizResult extends Document {
  quizId: string;
  userId: mongoose.Types.ObjectId | null;
  userName: string;
  type: QuizType;
  filters: QuizFilters;
  startedAt: Date;
  completedAt: Date | null;
  isCompleted: boolean;
  totalScore: number;
  totalQuestions: number;
  totalTimeSpentMs: number;
  questionAttempts: QuestionAttempt[];
  createdAt: Date;
  updatedAt: Date;
}

// Question attempt schema - simplified
const QuestionAttemptSchema = new Schema({
  questionId: { type: String, required: true },
  questionText: { type: String, required: true },
  correctCountryId: { type: Schema.Types.ObjectId, ref: 'Country', required: true },
  selectedCountryId: { type: Schema.Types.ObjectId, ref: 'Country', default: null },
  isCorrect: { type: Boolean, required: true },
  timeSpentMs: { type: Number, required: true },
  imageUrl: { type: String, required: false },
  userCustomInput: { type: String, required: false }
});

// Quiz filters schema
const QuizFiltersSchema = new Schema({
  continent: { type: String, required: false },
  inGeoguessr: { type: Boolean, required: false }
}, { _id: false });

// Main quiz result schema
const QuizResultSchema = new Schema({
  quizId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  userName: { type: String, required: true },
  type: { type: String, enum: Object.values(QuizType), required: true },
  filters: { type: QuizFiltersSchema, default: {} },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  isCompleted: { type: Boolean, default: false },
  totalScore: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  totalTimeSpentMs: { type: Number, default: 0 },
  questionAttempts: [QuestionAttemptSchema]
}, { timestamps: true });

const QuizResult = mongoose.model<IQuizResult>('QuizResult', QuizResultSchema);

export default QuizResult;
