"use client";

import { useState } from "react";
import { IUser } from "@/models/User";
import { getTemplateConfig } from "@/actions/settings-actions";
import { ITemplateConfig } from "@/models/TemplateConfig";

const TEMPLATE_URL = "/id-card-vertical-template.jpg";

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

            // 1. Setup Canvas (Fixed 768x1240 matching Editor)
            const EDITOR_WIDTH = 768;
            const EDITOR_HEIGHT = 1240;
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
                    // We use the smaller dimension for the circle radius
                    const radius = Math.min(boxWidth, boxHeight) / 2;

                    // Calculate center of the box
                    const centerX = x + boxWidth / 2;
                    const centerY = y + boxHeight / 2;

                    ctx.save();
                    // Clip to the circular region
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();

                    // Draw image to cover the circle area
                    // We need to calculate draw dimensions to cover the circle (like object-fit: cover)
                    const imgAspect = userImg.width / userImg.height;
                    const boxAspect = boxWidth / boxHeight; // Or actually 1:1 for circle ideally

                    let drawWidth, drawHeight, offsetX, offsetY;

                    // For a circle, we want to cover a square area of size (radius*2) x (radius*2)
                    // effectively centered at (centerX, centerY)
                    const coverSize = radius * 2;

                    if (imgAspect > 1) {
                        // Image is wider, fit height
                        drawHeight = coverSize;
                        drawWidth = coverSize * imgAspect;
                        offsetX = centerX - drawWidth / 2;
                        offsetY = centerY - drawHeight / 2;
                    } else {
                        // Image is taller or square, fit width
                        drawWidth = coverSize;
                        drawHeight = coverSize / imgAspect;
                        offsetX = centerX - drawWidth / 2;
                        offsetY = centerY - drawHeight / 2;
                    }


                    ctx.drawImage(userImg, offsetX, offsetY, drawWidth, drawHeight);
                    ctx.restore();

                    // Optional: Draw Circular Border if desired (User didn't explicitly ask for border change but good for consistency)
                    // Keeping previous border logic but adapted for circle if needed, or removing if not requested.
                    // The prompt said "image is now should be circular".
                    // Let's add a simple border stroke around the circle for definition if previously it had one.

                    /*
                    ctx.save();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "#000000";
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                    */

                } catch (e) {
                    console.error("Failed to load user image", e);
                    // Fallback
                    const x = config.imageArea.x;
                    const y = config.imageArea.y;
                    const width = config.imageArea.width || 250;
                    const height = config.imageArea.height || 300;
                    const radius = Math.min(width, height) / 2;
                    const centerX = x + width / 2;
                    const centerY = y + height / 2;

                    ctx.fillStyle = "#ccc";
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // 5. Draw Text Details
            const drawText = (fieldKey: keyof typeof config.fields, text: string) => {
                const field = config.fields[fieldKey];
                if (!field || !field.enabled) return;

                const finalX = field.x;
                const finalY = field.y;

                ctx.fillStyle = field.color;
                ctx.textBaseline = "top";
                ctx.font = `${fieldKey === 'name' ? 'bold' : ''} ${field.fontSize}px Arial`;
                ctx.fillText(text, finalX, finalY);
            };

            const formatDate = (date: string | Date) => {
                try {
                    const d = new Date(date);
                    const day = d.getDate().toString().padStart(2, '0');
                    const month = (d.getMonth() + 1).toString().padStart(2, '0');
                    return `${day}/${month}`;
                } catch {
                    return "";
                }
            };

            drawText('name', user.name);
            drawText('seva', `${user.seva}`);
            drawText('mobile', `${user.mobileNumber}`);
            drawText('gaam', `${user.gaam}`);
            drawText('startDate', formatDate(user.sevaDuration.startDate));
            drawText('endDate', formatDate(user.sevaDuration.endDate));

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
