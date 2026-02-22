import mongoose, { Schema, Document } from "mongoose";

export type BlogStatus = "draft" | "published";

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;          // markdown or html/plain
  coverImage?: string | null;

  tags: string[];
  status: BlogStatus;
  publishedAt?: Date | null;

  author?: mongoose.Types.ObjectId | null; // admin user
  deleted_at?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },

    excerpt: { type: String, default: "", trim: true, maxlength: 300 },
    content: { type: String, default: "" },

    coverImage: { type: String, default: null },

    tags: { type: [String], default: [], index: true },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
    publishedAt: { type: Date, default: null },

    author: { type: Schema.Types.ObjectId, ref: "User", default: null },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

BlogSchema.index({ status: 1, publishedAt: -1, createdAt: -1 });

export const BlogModel = mongoose.model<IBlog>("Blog", BlogSchema);