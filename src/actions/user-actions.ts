"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary (Server-side only)
// Ensure these env vars are set in your .env.local or .env file
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function addUser(prevState: any, formData: FormData) {
    try {
        await connectToDatabase();

        const name = formData.get("name") as string;
        const seva = formData.get("seva") as string;
        const mobileNumber = formData.get("mobileNumber") as string;
        const gaam = formData.get("gaam") as string;
        const startDate = formData.get("startDate") as string;
        const endDate = formData.get("endDate") as string;
        const imageUrl = formData.get("imageUrl") as string;

        await User.create({
            name,
            seva,
            mobileNumber,
            gaam,
            imageUrl,
            sevaDuration: {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
            },
        });

        revalidatePath("/");
        return { success: true, message: "User added successfully!" };

    } catch (error) {
        console.error("Error adding user:", error);
        return { success: false, message: "Failed to add user." };
    }
}

export async function getUsers() {
    try {
        await connectToDatabase();
        const users = await User.find({}).sort({ createdAt: -1 });
        return JSON.parse(JSON.stringify(users));
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

export async function deleteUser(id: string, imageUrl?: string) {
    try {
        await connectToDatabase();

        // 1. Delete image from Cloudinary if it exists
        // 1. Delete image from Cloudinary if it exists
        if (imageUrl) {
            // Robust Public ID Extraction
            // Supports:
            // - Standard: .../upload/v1234/folder/id.jpg
            // - Transformed: .../upload/c_crop,w_100/v1234/folder/id.jpg
            // - No version (less common but possible): .../upload/folder/id.jpg (Hardware implementation dependent)

            try {
                // Regex matches:
                // /upload/ -> literal
                // (?:.*\/)? -> optional transformations (greedy match until version) OR just folder structure if no version?
                // Actually safer to rely on 'v<numbers>/' pattern which is standard for Signed/Widget uploads.

                // Pattern: .../upload/[transformations/]?v[version]/[public_id].[ext]
                const regex = /\/upload\/(?:[^/]+\/)*v\d+\/(.+)$/;
                const match = imageUrl.match(regex);

                if (match && match[1]) {
                    const publicIdWithExt = match[1];
                    // Remove extension
                    const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
                    await cloudinary.uploader.destroy(publicId);
                }
            } catch (e) {
                console.error("Failed to parse/delete Cloudinary image:", e);
            }
        }

        // 2. Delete from DB
        await User.findByIdAndDelete(id);

        revalidatePath("/");
        return { success: true, message: "User deleted successfully" };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { success: false, message: "Failed to delete user" };
    }
}

export async function updateUser(prevState: any, formData: FormData) {
    try {
        await connectToDatabase();

        const id = formData.get("id") as string;
        const name = formData.get("name") as string;
        const seva = formData.get("seva") as string;
        const mobileNumber = formData.get("mobileNumber") as string;
        const gaam = formData.get("gaam") as string;
        const startDate = formData.get("startDate") as string;
        const endDate = formData.get("endDate") as string;
        const imageUrl = formData.get("imageUrl") as string;

        // Check if there was an old image that needs deletion?
        // Ideally we pass 'oldImageUrl' in formData to delete it if 'imageUrl' is different.
        // For now, let's just update the record.

        const updateData: any = {
            name,
            seva,
            mobileNumber,
            gaam,
            imageUrl,
            sevaDuration: {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
            }
        };

        if (!imageUrl) delete updateData.imageUrl; // Don't wipe image if not provided? Or is hidden input handling that?

        await User.findByIdAndUpdate(id, updateData);

        revalidatePath("/");
        return { success: true, message: "User updated successfully!" };

    } catch (error) {
        console.error("Error updating user:", error);
        return { success: false, message: "Failed to update user." };
    }
}