require("dotenv").config();
const OpenAI = require("openai");
const cloudinary = require("cloudinary").v2;
const sharp = require("sharp");
const openai = new OpenAI();

cloudinary.config({
    cloud_name: "dtiofnrfn",
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function generateImageWithOpenAI(game_id, game_title, imagePrompt) {
    try {
        const response = await openai.images.generate({
            model: "gpt-image-1",
            prompt: imagePrompt,
            n: 1,
            size: "1024x1024",
            quality: "low",
        });

        const base64 = response.data[0].b64_json;
        const imageBuffer = Buffer.from(base64, "base64");

        const croppedBuffer = await sharp(imageBuffer)
            .resize(600, 900, { fit: "cover" }) // verticale
            .toBuffer();

        const compressedBuffer = await sharp(croppedBuffer)
            .webp({ quality: 90 })
            .toBuffer();

        const base64Optimized = compressedBuffer.toString("base64");
        const dataUriOptimized = `data:image/webp;base64,${base64Optimized}`;

        const safeTitle = game_title.replace(/[^a-zA-Z0-9-_]/g, "_");
        const filename = `${game_id}-${safeTitle}-${Date.now()}`;
        const results = await cloudinary.uploader.upload(dataUriOptimized, {
            public_id: filename,
            folder: "wordrops_cover_story",
            resource_type: "image",
            format: "webp",
        });

        return results.secure_url;
    } catch (err) {
        console.error("❌ Error generating book cover:", err);
    }
}

module.exports = { generateImageWithOpenAI };
