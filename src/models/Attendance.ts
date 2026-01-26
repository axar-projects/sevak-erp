import mongoose, { Schema, model, models } from "mongoose";

export interface IAttendance {
    _id?: string;
    userId: mongoose.Types.ObjectId | string;
    date: Date; // Normalized to midnight or specific date
    status: string; // e.g., 'present', 'late', etc.
    scanMethod?: string; // 'qr', 'manual', etc.
    createdAt?: Date;
    updatedAt?: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
        },
        date: {
            type: Date,
            required: true,
            index: true, // For faster querying by date
        },
        status: {
            type: String,
            default: "present",
        },
        scanMethod: {
            type: String,
            default: "qr",
        },
    },
    {
        timestamps: true,
    }
);

// Prevent multi-compile errors in Next.js
if (mongoose.models.Attendance) {
    delete mongoose.models.Attendance;
}

const Attendance = models.Attendance || model<IAttendance>("Attendance", AttendanceSchema);

export default Attendance;
