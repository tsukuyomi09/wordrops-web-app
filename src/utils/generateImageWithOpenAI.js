require("dotenv").config();
const { Storage } = require("@google-cloud/storage");
require("dotenv").config();

const OpenAI = require("openai");
const storage = new Storage({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});
const bucketName = "wordrops-images";

const { writeFile } = require("fs/promises");
const sharp = require("sharp");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // oppure lascia vuoto se usi `.env`
});

async function generateImageWithDalle() {
    try {
        prompt =
            "Two people running frantically across a snowy mountain landscape under bright daylight, chased by a massive, fierce yeti with shaggy white fur and glowing eyes. The scene captures intense motion, snow flying up, vivid blue sky, rugged icy cliffs, and dramatic expressions of fear and determination on the runners’ faces. Highly detailed, realistic style, cinematic lighting, dynamic composition.";
        const response = await openai.images.generate({
            model: "gpt-image-1",
            prompt,
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

        await writeFile(`./test_${Date.now()}.webp`, compressedBuffer);

        const filename = `image_${Date.now()}.webp`;
        const file = bucket.file(filename);

        await file.save(compressedBuffer, {
            metadata: {
                contentType: "image/webp",
            },
            validation: "md5",
        });
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
        console.log("✅ Immagine caricata su GCS:", publicUrl);
    } catch (err) {
        console.error("❌ Errore nella generazione dell'immagine:", err);
    }
}

generateImageWithDalle();

module.exports = { generateImageWithDalle };
