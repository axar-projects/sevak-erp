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
        if (imageUrl) {
            // Extract public_id from URL
            // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/sevak_preset/my_image.jpg
            const regex = /\/v\d+\/([^/]+)\./;
            const match = imageUrl.match(regex);
            // Or simpler: usually it's just folder/filename without extension if signed, but with unsigned implementation often just filename
            // Actually user-actions usually gets just the URL. 
            // For Cloudinary 'destroy', we need the public_id.
            // A robust way to store public_id is better, but parsing is common for simple apps.
            // Assuming standard URL structure:
            const parts = imageUrl.split('/');
            const filename = parts[parts.length - 1]; // my_image.jpg
            const publicId = filename.split('.')[0]; // my_image

            // If using a preset folder, it might be folder/id.
            // Let's rely on finding standard upload format parts if possible or store public_id in DB next time.
            // For now, let's try to destroy just the ID part.

            // Better approach: User CldUploadWidget returns public_id. We should probably save it.
            // But 'IUser' doesn't have public_id field.
            // As a fallback for this task, we will attempt to extract it or just proceed with DB delete if it fails.

            // Heuristic:
            // https://res.cloudinary.com/cloudname/image/upload/v1731231/sevak_preset/abc.jpg
            // public_id = sevak_preset/abc

            const urlParts = imageUrl.split('/upload/');
            if (urlParts.length === 2) {
                let publicIdWithVer = urlParts[1]; // v1731231/sevak_preset/abc.jpg
                // Remove version if present (starts with v and digits)
                const versionRegex = /^v\d+\//;
                let publicIdPath = publicIdWithVer.replace(versionRegex, ''); // sevak_preset/abc.jpg

                // Remove extension
                const publicId = publicIdPath.substring(0, publicIdPath.lastIndexOf('.'));

                await cloudinary.uploader.destroy(publicId);
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