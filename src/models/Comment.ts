import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IComment extends Document {
  content: string;
  user: mongoose.Types.ObjectId;
  resourceType: 'theme' | 'website';
  resource: mongoose.Types.ObjectId;
  position?: {
    x: number;
    y: number;
    element?: string;
  };
  parentComment?: mongoose.Types.ObjectId;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      maxlength: [1000, 'Comment cannot be more than 1000 characters'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    resourceType: {
      type: String,
      enum: ['theme', 'website'],
      required: [true, 'Resource type is required'],
    },
    resource: {
      type: Schema.Types.ObjectId,
      refPath: 'resourceType',
      required: [true, 'Resource is required'],
    },
    position: {
      x: {
        type: Number,
      },
      y: {
        type: Number,
      },
      element: {
        type: String,
      },
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Create indexes for better query performance
CommentSchema.index({ resource: 1, resourceType: 1 });
CommentSchema.index({ parentComment: 1 });
CommentSchema.index({ user: 1 });

// Prevent mongoose from creating the model multiple times during hot reloads
const Comment = (mongoose.models.Comment as Model<IComment>) || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
