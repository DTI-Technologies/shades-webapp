import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWebsite extends Document {
  name: string;
  url: string;
  description: string;
  originalContent: {
    html: string;
    css: string[];
    images: string[];
    title: string;
    description: string;
    structure: {
      header: boolean;
      footer: boolean;
      navigation: boolean;
      sections: number;
    };
  };
  rebrandedContent?: {
    html: string;
    css: string[];
    images: string[];
  };
  brandElements: {
    name: string;
    logo?: string;
    colors: {
      primary: string;
      secondary: string;
      accent?: string;
      background: string;
      text: string;
    };
    typography: {
      primary: string;
      secondary?: string;
    };
    style?: {
      borderRadius?: string;
      spacing?: string;
      buttonStyle?: string;
    };
  };
  creator: mongoose.Types.ObjectId;
  isPublic: boolean;
  collaborators: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const WebsiteSchema = new Schema<IWebsite>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a website name'],
      maxlength: [100, 'Name cannot be more than 100 characters'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'Please provide a website URL'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a website description'],
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    originalContent: {
      html: {
        type: String,
        required: true,
      },
      css: {
        type: [String],
        default: [],
      },
      images: {
        type: [String],
        default: [],
      },
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        default: '',
      },
      structure: {
        header: {
          type: Boolean,
          default: false,
        },
        footer: {
          type: Boolean,
          default: false,
        },
        navigation: {
          type: Boolean,
          default: false,
        },
        sections: {
          type: Number,
          default: 0,
        },
      },
    },
    rebrandedContent: {
      html: {
        type: String,
      },
      css: {
        type: [String],
        default: [],
      },
      images: {
        type: [String],
        default: [],
      },
    },
    brandElements: {
      name: {
        type: String,
        required: true,
      },
      logo: {
        type: String,
      },
      colors: {
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
        primary: {
          type: String,
          required: true,
        },
        secondary: {
          type: String,
        },
      },
      style: {
        borderRadius: {
          type: String,
        },
        spacing: {
          type: String,
        },
        buttonStyle: {
          type: String,
        },
      },
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    collaborators: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
  },
  { timestamps: true }
);

// Create indexes for better search performance
WebsiteSchema.index({ name: 'text', description: 'text', url: 'text' });
WebsiteSchema.index({ creator: 1 });
WebsiteSchema.index({ collaborators: 1 });

// Prevent mongoose from creating the model multiple times during hot reloads
const Website = (mongoose.models.Website as Model<IWebsite>) || mongoose.model<IWebsite>('Website', WebsiteSchema);

export default Website;
