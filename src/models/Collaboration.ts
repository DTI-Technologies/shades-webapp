import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICollaboration extends Document {
  resourceType: 'theme' | 'website';
  resource: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  role: 'owner' | 'editor' | 'viewer';
  invitedBy: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const CollaborationSchema = new Schema<ICollaboration>(
  {
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
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      required: [true, 'Role is required'],
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Inviter is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Ensure a user can only have one collaboration role per resource
CollaborationSchema.index({ resource: 1, user: 1 }, { unique: true });

// Create indexes for better query performance
CollaborationSchema.index({ user: 1 });
CollaborationSchema.index({ resource: 1, resourceType: 1 });
CollaborationSchema.index({ status: 1 });

// Prevent mongoose from creating the model multiple times during hot reloads
const Collaboration = (mongoose.models.Collaboration as Model<ICollaboration>) || mongoose.model<ICollaboration>('Collaboration', CollaborationSchema);

export default Collaboration;
