require("dotenv").config();
const { Storage } = require("@google-cloud/storage");
const OpenAI = require("openai");
const storage = new Storage({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});
const bucketName = "wordrops-images";
const sharp = require("sharp");
const openai = new OpenAI();

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

        const bucket = storage.bucket(bucketName);

        const croppedBuffer = await sharp(imageBuffer)
            .resize(600, 900, { fit: "cover" }) // verticale
            .toBuffer();

        const compressedBuffer = await sharp(croppedBuffer)
            .webp({ quality: 90 })
            .toBuffer();

        const safeTitle = game_title.replace(/[^a-zA-Z0-9-_]/g, "_");
        const filename = `${game_id}-${safeTitle}-${Date.now()}.webp`;
        const file = bucket.file(filename);
        await file.save(compressedBuffer, {
            metadata: {
                contentType: "image/webp",
            },
            validation: "md5",
        });
        return `https://storage.googleapis.com/${bucketName}/${filename}`;
    } catch (err) {
        console.error("❌ Errore nella generazione dell'immagine:", err);
    }
}

module.exports = { generateImageWithOpenAI };
