"use server";

import connectToDatabase from "@/lib/db";
import TemplateConfig, { ITemplateConfig } from "@/models/TemplateConfig";
import { revalidatePath } from "next/cache";

const DEFAULT_CONFIG: Partial<ITemplateConfig> = {
    imageArea: { x: 50, y: 150, width: 250, height: 300, fontSize: 0, color: "", label: "Photo", enabled: true },
    fields: {
        name: { x: 350, y: 180, fontSize: 40, color: "#3E2723", label: "Name", enabled: true },
        seva: { x: 350, y: 240, fontSize: 24, color: "#5D4037", label: "Seva", enabled: true },
        mobile: { x: 350, y: 290, fontSize: 24, color: "#5D4037", label: "Mobile", enabled: true },
        gaam: { x: 350, y: 340, fontSize: 24, color: "#5D4037", label: "Gaam", enabled: true },
        startDate: { x: 350, y: 390, fontSize: 24, color: "#5D4037", label: "Start Date", enabled: true },
        endDate: { x: 500, y: 390, fontSize: 24, color: "#5D4037", label: "End Date", enabled: true },
        qrCode: { x: 50, y: 900, fontSize: 0, color: "#FFFFFF", label: "QR Code", enabled: true, width: 200, height: 200 },
        uniqueId: { x: 50, y: 850, fontSize: 32, color: "#FFFFFF", label: "Unique ID", enabled: true, fontWeight: "900", rotation: -90 },
    },
};

export async function getTemplateConfig() {
    try {
        await connectToDatabase();
        let config = await TemplateConfig.findOne({}).lean();

        if (!config) {
            // If no config exists, return default
            return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        }

        // Migration on Read: Ensure new fields exist if they are missing in DB
        const configObj = JSON.parse(JSON.stringify(config));

        if (!configObj.fields.startDate) {
            configObj.fields.startDate = DEFAULT_CONFIG.fields?.startDate;
        }
        if (!configObj.fields.endDate) {
            configObj.fields.endDate = DEFAULT_CONFIG.fields?.endDate;
        }
        if (!configObj.fields.qrCode) {
            configObj.fields.qrCode = DEFAULT_CONFIG.fields?.qrCode;
        } else if (configObj.fields.qrCode.color === "#000000") {
            // Migration: Force white if it relies on schema default black, as we want white for this template
            configObj.fields.qrCode.color = DEFAULT_CONFIG.fields?.qrCode?.color || "#FFFFFF";
        }
        if (!configObj.fields.uniqueId) {
            configObj.fields.uniqueId = DEFAULT_CONFIG.fields?.uniqueId;
        } else {
            // Enforce specific styling requested by user if not already set or even if set? 
            // Ideally we just ensure properties exist.
            if (configObj.fields.uniqueId.rotation === undefined) configObj.fields.uniqueId.rotation = -90;
            if (configObj.fields.uniqueId.fontWeight === undefined) configObj.fields.uniqueId.fontWeight = "900";
            // Force update for user satisfaction
            configObj.fields.uniqueId.fontWeight = "900";
            configObj.fields.uniqueId.rotation = -90;
        }
        // Remove legacy duration field from the UI object so it doesn't show up
        if (configObj.fields.duration) {
            delete configObj.fields.duration;
        }

        return configObj;
    } catch (error) {
        console.error("Error fetching template config:", error);
        return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
}

export async function saveTemplateConfig(data: ITemplateConfig) {
    try {
        await connectToDatabase();

        // Upsert: update the first found document, or create if new
        await TemplateConfig.findOneAndUpdate(
            {},
            {
                $set: {
                    imageArea: data.imageArea,
                    fields: data.fields
                }
            },
            { upsert: true, new: true }
        );

        revalidatePath("/settings/id-card");
        return { success: true, message: "Template saved successfully" };
    } catch (error) {
        console.error("Error saving template config:", error);
        return { success: false, message: "Failed to save template" };
    }
}
