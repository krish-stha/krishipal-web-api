import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * AddressBatch document interface
 */
export interface IAddressBatch extends Document {
  batchName: string;
  status: "active" | "Inactive";
  createdAt: Date;
}

const AddressBatchSchema: Schema<IAddressBatch> = new Schema(
  {
    batchName: {
      type: String,
      required: [true, "Address nis required"],
      trim: true,
      unique: true,
      minlength: [2, " Address must be at least 2 characters"],
      maxlength: [50, "Address cannot exceed 50 characters"],
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "Inactive"],
      default: "active",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // you already have createdAt
    versionKey: false,
  }
);

const AddressBatch: Model<IAddressBatch> =
  mongoose.models.AddressBatch ||
  mongoose.model<IAddressBatch>("AddressBatch", AddressBatchSchema);

export default AddressBatch;
