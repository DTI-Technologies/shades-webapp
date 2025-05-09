import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITheme extends Document {
  name: string;
  type: string;
  description: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    codeFont: string;
  };
  components: Record<string, any>;
  styles: Record<string, any>;
  pageLayouts: Record<string, any>;
  creator: mongoose.Types.ObjectId;
  isPublished: boolean;
  isPublic: boolean;
  isFeatured: boolean;
  price: number;
  downloads: number;
  rating: number;
  ratingCount: number;
  tags: string[];
  previewImage: string;
  createdAt: Date;
  updatedAt: Date;
}

const ThemeSchema = new Schema<ITheme>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a theme name'],
      maxlength: [100, 'Name cannot be more than 100 characters'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Please provide a theme type'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a theme description'],
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    colorPalette: {
      primary: {
        type: String,
        required: true,
      },
      secondary: {
        type: String,
        required: true,
      },
      accent: {
        type: String,
        required: true,
      },
      background: {
        type: String,
        required: true,
      },
      text: {
        type: String,
        required: true,
      },
    },
    typography: {
      headingFont: {
        type: String,
        required: true,
      },
      bodyFont: {
        type: String,
        required: true,
      },
      codeFont: {
        type: String,
        required: true,
      },
    },
    components: {
      type: Schema.Types.Mixed,
      required: true,
    },
    styles: {
      type: Schema.Types.Mixed,
      required: true,
    },
    pageLayouts: {
      type: Schema.Types.Mixed,
      required: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    previewImage: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Create indexes for better search performance
ThemeSchema.index({ name: 'text', description: 'text', tags: 'text' });
ThemeSchema.index({ creator: 1 });
ThemeSchema.index({ isPublished: 1, isPublic: 1 });
ThemeSchema.index({ isFeatured: 1 });
ThemeSchema.index({ downloads: -1 });
ThemeSchema.index({ rating: -1 });

// Prevent mongoose from creating the model multiple times during hot reloads
const Theme = (mongoose.models.Theme as Model<ITheme>) || mongoose.model<ITheme>('Theme', ThemeSchema);

export default Theme;
