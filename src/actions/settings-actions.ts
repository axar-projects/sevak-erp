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
        duration: { x: 350, y: 390, fontSize: 24, color: "#5D4037", label: "Duration", enabled: true },
    },
};

export async function getTemplateConfig() {
    try {
        await connectToDatabase();
        let config = await TemplateConfig.findOne({});

        if (!config) {
            // If no config exists, return default (but don't save it yet to avoid clutter unless they save)
            // Or we can just return plain object
            return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        }

        return JSON.parse(JSON.stringify(config));
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
