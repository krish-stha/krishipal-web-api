import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  parent?: mongoose.Types.ObjectId | null;
  isActive: boolean;
  deleted_at?: Date | null;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    isActive: { type: Boolean, default: true },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

export const CategoryModel = mongoose.model<ICategory>("Category", CategorySchema);
