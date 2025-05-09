import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivity extends Document {
  user: mongoose.Types.ObjectId;
  action: string;
  resourceType: 'theme' | 'website' | 'user' | 'system';
  resource?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: [
        'create',
        'update',
        'delete',
        'view',
        'download',
        'rate',
        'comment',
        'share',
        'login',
        'logout',
        'signup',
        'generate',
        'analyze',
        'rebrand',
        'deploy',
      ],
    },
    resourceType: {
      type: String,
      required: [true, 'Resource type is required'],
      enum: ['theme', 'website', 'user', 'system'],
    },
    resource: {
      type: Schema.Types.ObjectId,
      refPath: 'resourceType',
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Create indexes for better query performance
ActivitySchema.index({ user: 1 });
ActivitySchema.index({ action: 1 });
ActivitySchema.index({ resourceType: 1, resource: 1 });
ActivitySchema.index({ createdAt: -1 });

// Prevent mongoose from creating the model multiple times during hot reloads
const Activity = (mongoose.models.Activity as Model<IActivity>) || mongoose.model<IActivity>('Activity', ActivitySchema);

export default Activity;
