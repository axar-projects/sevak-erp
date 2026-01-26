"use server";

import connectToDatabase from "@/lib/db";
import Attendance from "@/models/Attendance";
import User from "@/models/User";
import { revalidatePath } from "next/cache";

export async function markAttendance(userId: string) {
    try {
        await connectToDatabase();

        // 1. Verify User exists
        const user = await User.findById(userId);
        if (!user) {
            return { success: false, message: "User not found" };
        }

        // 2. Check for duplicate attendance today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const existing = await Attendance.findOne({
            userId: userId,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        if (existing) {
            return {
                success: true,
                message: "Attendance already marked for today",
                user: { name: user.name, seva: user.seva, imageUrl: user.imageUrl },
                status: "duplicate"
            };
        }

        // 3. Create Attendance Record
        await Attendance.create({
            userId: userId,
            date: startOfDay, // Store normalized date for querying
            status: "present",
            scanMethod: "qr"
        });

        revalidatePath("/attendance");

        return {
            success: true,
            message: "Attendance marked successfully!",
            user: { name: user.name, seva: user.seva, imageUrl: user.imageUrl },
            status: "success"
        };

    } catch (error) {
        console.error("Mark Attendance Error:", error);
        return { success: false, message: "Failed to mark attendance" };
    }
}

export async function getAttendanceReport(dateInput?: string | Date) {
    try {
        await connectToDatabase();

        // 1. Determine Date Range
        const targetDate = dateInput ? new Date(dateInput) : new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // 2. Fetch Attendance
        // Use .lean() for performance since we don't need mongoose document features
        const attendanceRecords = await Attendance.find({
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        })
            .populate({
                path: 'userId',
                model: User,
                select: 'name gaam mobileNumber seva imageUrl' // Select specific fields
            })
            .sort({ createdAt: -1 }) // Newest first
            .lean();

        // 3. Serialize Data (convert ObjectIds and Dates to strings for Server Components)
        const serialized = attendanceRecords.map((record: any) => ({
            _id: record._id.toString(),
            userId: record.userId ? {
                _id: record.userId._id.toString(),
                name: record.userId.name,
                gaam: record.userId.gaam,
                mobileNumber: record.userId.mobileNumber,
                seva: record.userId.seva,
            } : null, // Handle case where user might be deleted
            date: record.date.toISOString(),
            status: record.status,
            scanMethod: record.scanMethod,
            createdAt: record.createdAt?.toISOString(),
        }));

        return { success: true, data: serialized };
    } catch (error) {
        console.error("Error fetching attendance report:", error);
        return { success: false, message: "Failed to fetch attendance report", data: [] };
    }
}
