"use client";

import { useState } from "react";
import { IUser } from "@/models/User";
import { getTemplateConfig } from "@/actions/settings-actions";
import { ITemplateConfig } from "@/models/TemplateConfig";

const TEMPLATE_URL = "/id-card-template.png";

export function useIdCardGenerator() {
    const [isGenerating, setIsGenerating] = useState(false);

    const generateIdCard = async (user: IUser) => {
        setIsGenerating(true);
        try {
            // 0. Fetch Config
            const config: ITemplateConfig = await getTemplateConfig();

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas context not supported");

            // 1. Setup Canvas (Fixed 675x425 matching Editor)
            const EDITOR_WIDTH = 675;
            const EDITOR_HEIGHT = 425;
            canvas.width = EDITOR_WIDTH;
            canvas.height = EDITOR_HEIGHT;

            // 2. Load Template and Force Fit
            const template = await loadImage(TEMPLATE_URL);
            // Draw template stretched/contained to fit the fixed canvas exactly
            ctx.drawImage(template, 0, 0, EDITOR_WIDTH, EDITOR_HEIGHT);

            // 3. Scaling Logic: None (1:1)
            const scaleX = 1;
            const scaleY = 1;
            const scaleFont = 1;

            // 4. Load User Image (with fallback logic)
            if (user.imageUrl && config.imageArea.enabled) {
                try {
                    const userImg = await loadImage(user.imageUrl, true);

                    // Apply config values directly
                    const x = config.imageArea.x;
                    const y = config.imageArea.y;
                    const boxWidth = config.imageArea.width || 250;
                    const boxHeight = config.imageArea.height || 300;
                    const radius = 10; // Fixed radius

                    // Aspect Ratio Logic (User Request: Match Height, Center & Crop Width)
                    const imgAspect = userImg.width / userImg.height;
                    const renderHeight = boxHeight;
                    const renderWidth = boxHeight * imgAspect;

                    // Center the image horizontally: (Container Width - Image Width) / 2
                    const offsetX = (boxWidth - renderWidth) / 2;

                    ctx.save();
                    // Clip to the defined box
                    roundedRect(ctx, x, y, boxWidth, boxHeight, radius);
                    ctx.clip();
                    // Draw image centered
                    ctx.drawImage(userImg, x + offsetX, y, renderWidth, renderHeight);
                    ctx.restore();

                    // Draw Black Border (User Request)
                    ctx.save();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "#000000";
                    roundedRect(ctx, x, y, boxWidth, boxHeight, radius);
                    ctx.stroke();
                    ctx.restore();
                } catch (e) {
                    console.error("Failed to load user image", e);
                    // Fallback
                    const x = config.imageArea.x;
                    const y = config.imageArea.y;
                    const width = config.imageArea.width || 250;
                    const height = config.imageArea.height || 300;

                    ctx.fillStyle = "#ccc";
                    roundedRect(ctx, x, y, width, height, 10);
                    ctx.fill();
                }
            }

            // 5. Draw Text Details
            const drawText = (fieldKey: keyof typeof config.fields, text: string) => {
                const field = config.fields[fieldKey];
                if (!field || !field.enabled) return;

                // Editor Padding Offsets (approx 8px X, 4px Y visually)
                // This aligns the text baseline with the visual editor box
                const PADDING_X = 8;
                const PADDING_Y = 4;

                const finalX = field.x + PADDING_X;
                const finalY = field.y + PADDING_Y;

                ctx.fillStyle = field.color;
                ctx.textBaseline = "top";
                ctx.font = `${fieldKey === 'name' ? 'bold' : ''} ${field.fontSize}px Arial`;
                ctx.fillText(text, finalX, finalY);
            };

            drawText('name', user.name);
            drawText('seva', `${user.seva}`);
            drawText('mobile', `${user.mobileNumber}`);
            drawText('gaam', `${user.gaam}`);
            drawText('duration', `${new Date(user.sevaDuration.startDate).toLocaleDateString()} - ${new Date(user.sevaDuration.endDate).toLocaleDateString()}`);

            // 6. Download
            // We want it high quality, but for ID cards PNG is fine at this resolution
            const link = document.createElement("a");
            link.download = `sevak-id-${user.name.replace(/\s+/g, "_")}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();

        } catch (error) {
            console.error("ID Generation failed:", error);
            alert("Failed to generate ID card. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return { generateIdCard, isGenerating };
}

// Helper to load image
function loadImage(src: string, isExternal = false): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        if (isExternal) img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
    });
}

// Helper for rounded rect path
function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}
