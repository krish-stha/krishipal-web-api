import mongoose, { Schema } from "mongoose";

export type AboutSocial = {
  label: string;
  url: string;
};

export interface IAbout {
  heroTitle: string;
  heroDescription: string;

  missionTitle: string;
  missionBody: string;
  missionImage: string; // filename

  visionTitle: string;
  visionBody: string;
  visionImage: string; // filename

  socials: AboutSocial[];
  published: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const AboutSchema = new Schema<IAbout>(
  {
    heroTitle: { type: String },
    heroDescription: {
      type: String,
     
        
    },

    missionTitle: { type: String},
    missionBody: {
      type: String,
      
    },
    missionImage: { type: String, default: "" },

    visionTitle: { type: String },
    visionBody: {
      type: String,
     
    },
    visionImage: { type: String },

    socials: {
      type: [
        {
          label: { type: String,  },
          url: { type: String, },
        },
      ],
      default: [],
    },

    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const AboutModel = mongoose.model<IAbout>("About", AboutSchema);