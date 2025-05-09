import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  theme: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    theme: {
      type: Schema.Types.ObjectId,
      ref: 'Theme',
      required: [true, 'Theme is required'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      maxlength: [500, 'Comment cannot be more than 500 characters'],
    },
  },
  { timestamps: true }
);

// Ensure a user can only review a theme once
ReviewSchema.index({ theme: 1, user: 1 }, { unique: true });

// Prevent mongoose from creating the model multiple times during hot reloads
const Review = (mongoose.models.Review as Model<IReview>) || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
