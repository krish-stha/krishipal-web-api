import mongoose, { Schema, Document } from "mongoose";
import { UserType } from "../types/user.type";

export interface IUser extends UserType, Document {
  reset_password_token?: string | null;
  reset_password_expires_at?: Date | null;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    countryCode: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    profile_picture: {
      type: String,
      default: null,
    },

    // ✅ NEW: reset password fields
    reset_password_token: {
      type: String,
      default: null,
      index: true,
    },
    reset_password_expires_at: {
      type: Date,
      default: null,
      index: true,
    },

    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

export const UserModel = mongoose.model<IUser>("User", UserSchema);
