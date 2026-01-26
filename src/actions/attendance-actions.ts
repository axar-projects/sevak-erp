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

        // 2. Check for duplicate attendance today (IST Timezone)
        // Current time in UTC
        const now = new Date();

        // Convert to IST string to get the correct "Day" components
        const istDateString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        const istDate = new Date(istDateString);

        // Normalize to Start of Day in IST (00:00:00 AM IST)
        const startOfDayIST = new Date(istDate);
        startOfDayIST.setHours(0, 0, 0, 0); // This is 00:00 in "Local System Time" of the container if we parse string? 
        // Wait, toLocaleString gives a string. reading it back into Date() relies on system locale.
        // Better approach: Calculate offset manually or use simple string manipulation.

        // Robust approach for IST Day Boundary:
        const istOffset = 5.5 * 60 * 60 * 1000;
        const nowIST = new Date(now.getTime() + istOffset);
        nowIST.setUTCHours(0, 0, 0, 0); // Normalize to midnight

        // Convert back to UTC for DB query
        const startOfDayUTC = new Date(nowIST.getTime() - istOffset);
        const endOfDayUTC = new Date(startOfDayUTC.getTime() + 24 * 60 * 60 * 1000 - 1);

        const existing = await Attendance.findOne({
            userId: userId,
            date: {
                $gte: startOfDayUTC,
                $lte: endOfDayUTC
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
        // We store the normalized date as the "Attendance Date" (start of that day in UTC representation of IST start)
        await Attendance.create({
            userId: userId,
            date: startOfDayUTC,
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

        // 1. Determine Date Range (IST)
        let targetIST: Date;

        if (dateInput) {
            // Assume input "YYYY-MM-DD" is for India
            targetIST = new Date(dateInput);
        } else {
            // Default to "Now" in IST
            const now = new Date();
            const istOffset = 5.5 * 60 * 60 * 1000;
            targetIST = new Date(now.getTime() + istOffset);
        }

        // Normalize to Midnight IST
        // Logic: Add offset -> floor to day -> subtract offset to get UTC equivalent of IST Midnight
        // But since we constructed targetIST from string, it might be UTC 00:00.
        // Let's rely on string parsing "YYYY-MM-DD" -> UTC 00:00.
        // We want to shift it so it ALIGNS with our storage logic.
        // Storage Logic: "Date" stored is (IST Midnight converted to UTC).
        // Example: Jan 27 IST Midnight -> Jan 26 18:30 UTC.
        // So we want to find records where `date` EQUALS `Jan 26 18:30 UTC`.
        // Wait, duplicated records store timestamps? No, `date` is normalized.

        // Let's stick to the storage convention:
        // markAttendance stores: (NowUTC + 5.5h).setUTCHours(0,0,0,0) - 5.5h

        // So query must replicate this:
        const d = new Date(dateInput || new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const istOffset = 5.5 * 60 * 60 * 1000;

        // Create a UTC date that mimics the IST date components (e.g. 2024-01-27 00:00:00 UTC)
        const year = d.getFullYear();
        const month = d.getMonth();
        const day = d.getDate();

        const istMidnightInUTC = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

        // Now shift it back to actual UTC time
        const startOfDayUTC = new Date(istMidnightInUTC.getTime() - istOffset);
        const endOfDayUTC = new Date(startOfDayUTC.getTime() + 24 * 60 * 60 * 1000 - 1);

        // 2. Fetch Attendance
        // Use .lean() for performance since we don't need mongoose document features
        const attendanceRecords = await Attendance.find({
            date: {
                $gte: startOfDayUTC,
                $lte: endOfDayUTC
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
