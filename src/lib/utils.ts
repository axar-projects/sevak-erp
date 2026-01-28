
// Helper to transform Cloudinary URL for thumbnails
export function getThumbnailUrl(url: string) {
    if (!url) return "";
    // If it already has sizing, we replace it. If not, we insert it.
    // Cloudinary standard upload URL format: .../upload/v1234...
    // Or our custom one: .../upload/c_crop.../v123...

    // Check if we have our custom w_800
    if (url.includes("w_800,h_800")) {
        return url.replace("w_800,h_800", "w_100,h_100");
    }

    // Generic injection if it's a raw cloudinary url
    const parts = url.split('/upload/');
    if (parts.length === 2 && !url.includes("w_100")) {
        return `${parts[0]}/upload/w_100,h_100,c_fill/${parts[1]}`;
    }

    return url;
}
