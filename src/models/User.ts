import mongoose, { Schema, model, models } from "mongoose";

// 1. TypeScript Interface (defines the shape of your data)
export interface IUser {
  _id?: string;
  name: string;
  seva: string;               // The type of service/duty
  mobileNumber: string;       // String is better than Number to keep leading zeros
  gaam: string;               // Village or City
  uniqueId: string;           // 4-digit unique ID
  imageUrl?: string;          // We store the LINK to the image, not the file itself
  sevaDuration: {
    startDate: Date;
    endDate: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Mongoose Schema (defines database rules)
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    seva: {
      type: String,
      required: false,
      default: "",
    },
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
    },
    gaam: {
      type: String,
      required: [true, "Gaam/City is required"],
    },
    uniqueId: {
      type: String,
      unique: true,
      index: true,
    },
    imageUrl: {
      type: String,
      required: false, // Optional, in case they don't have a photo yet
    },
    sevaDuration: {
      startDate: {
        type: Date,
        required: [true, "Start date is required"],
      },
      endDate: {
        type: Date,
        required: [true, "End date is required"],
      },
    },
  },
  {
    timestamps: true, // Automatically adds 'createdAt' and 'updatedAt'
  }
);

// 3. Model Creation (With Hot-Reload fix)
// Next.js tries to rebuild models every time you save a file.
// We delete the model if it exists to ensure new schema changes are picked up in dev
if (process.env.NODE_ENV === "development" && models.User) {
  delete models.User;
}

const User = models.User || model<IUser>("User", UserSchema);

export default User;