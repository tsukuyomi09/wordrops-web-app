const OpenAI = require("openai");
const dotenv = require("dotenv");
const { validateChapterRatings } = require("../utils/chapterRatingsValidator");

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function generateFullMetadata(chaptersToElaborate, gameType, gameLang) {
    const languageToUse = getLanguageName(gameLang);
    const titleAndBackCover = await generateTitleAndBlurb(
        chaptersToElaborate,
        languageToUse
    );
    const genres = await generateGenres(chaptersToElaborate);
    const imagePrompt = await generateImagePrompt(chaptersToElaborate);

    let chapterRatings = [];
    if (gameType === "ranked") {
        chapterRatings = await generateChapterRatingsWithRetry(
            chaptersToElaborate,
            languageToUse
        );
    }

    return {
        title: titleAndBackCover.title,
        backCover: titleAndBackCover.backCover,
        genres,
        chapterRatings,
        imagePrompt,
    };
}

async function generateTitleAndBlurb(chaptersToElaborate, languageToUse) {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content:
                    "You are an assistant that generates book titles and back covers. The The title and backCover must be generated using this specific language: '${languageToUse}'. You must generate a **title** and a **description** (maximum 100 words) that summarizes the entire book, based on the following chapters. Return **only one title and blurb** in JSON format, using the following schema:",
            },
            {
                role: "user",
                content: `Generate a valid and precise JSON with the title:title and the back cover:backCover (range of 25–35 words), in this format: 
                {
                    "title": "Book title",
                    "backCover": "Book description"
                }
                Make sure the JSON is correctly formatted and error-free. Do not include any other text.

                Text to use: """${JSON.stringify(
                    chaptersToElaborate,
                    null,
                    2
                )}"""`,
            },
        ],
        temperature: 0.7,
        max_tokens: 500,
    });

    let rawContent = response.choices[0].message.content;
    rawContent = rawContent.replace(/```json|```/g, "").trim();

    return JSON.parse(rawContent);
}

async function generateGenres(chaptersToElaborate) {
    const prompt = `
    Choose 1 to 3 relevant literary genres for this story. Select only from the following IDs corresponding to the listed genres:
    1 - Fantasy  
    2 - Science Fiction  
    3 - Thriller  
    4 - Horror  
    5 - Romance  
    6 - Comedy  
    7 - Drama  
    8 - Adventure  
    9 - Historical  
    10 - Slice of Life
    
    Respond with a valid JSON array containing only the selected genre IDs (from 1 to 10), with **no extra content**. The response format must be:
    
    [
        1, 3, 5
    ]

    Respond with an array containing only valid numbers (1 to 10). Each number represents a literary genre that fits the story.

    Text: """${JSON.stringify(chaptersToElaborate, null, 2)}"""
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content:
                    "You are an assistant that classifies stories into literary genres. Always respond with a valid JSON array of 1 to 3 genres selected from a predefined list.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        temperature: 0.5,
        max_tokens: 200,
    });

    let raw = response.choices[0].message.content;
    raw = raw.replace(/```json|```/g, "").trim();

    try {
        const parsedResponse = JSON.parse(raw);

        const genres = parsedResponse.map((id) => parseInt(id, 10));

        if (
            Array.isArray(genres) &&
            genres.every((id) => Number.isInteger(id) && id >= 1 && id <= 10)
        ) {
            return genres;
        } else {
            throw new Error(
                "The response contains invalid IDs or incorrect formatting."
            );
        }
    } catch (error) {
        console.error("Error parsing JSON or invalid data:", error.message);
        return generateGenres(chaptersToElaborate);
    }
}

async function generateImagePrompt(chaptersToElaborate) {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `
                You are an assistant creating a concise and effective image prompt for an AI image generation model (gpt-image-1).
                The prompt should be 1-3 sentences max, focused on clear visual elements: scene, environment, colors, mood, style.
                Avoid narrative, character backstory, emotions, or abstract concepts.
                Do not include names, text, or anything that could trigger safety filters (nudity, violence, children, real people, celebrities).
                The prompt must be in English.
                `,
            },
            {
                role: "user",
                content: `
                Here is the story content to inspire the image prompt:

                """${JSON.stringify(chaptersToElaborate, null, 2)}"""
                `,
            },
        ],
        temperature: 0.8,
        max_tokens: 500,
    });

    // 👇 DEBUG COMPLETO
    console.dir(response, { depth: null });

    return response.choices?.[0]?.message?.content?.trim();
}

async function generateChapterRatingsWithRetry(
    chaptersToElaborate,
    languageToUse,
    attempts = 3
) {
    for (let i = 0; i < attempts; i++) {
        try {
            const ratings = await generateChapterRatings(
                chaptersToElaborate,
                languageToUse
            );
            return ratings;
        } catch (error) {
            console.log(`Attempt ${i + 1} failed: ${error.message}`);
        }
    }
    console.log(
        "Unable to generate valid scores after 3 attempts. Returning fallback."
    );
    return chaptersToElaborate.map((chapter) => ({
        chapter: chapter.title,
        score: 0,
        comment: "Unable to generate a score",
    }));
}

async function generateChapterRatings(chaptersToElaborate, languageToUse) {
    const chaptersCount = chaptersToElaborate.length;

    const prompt = `
    You are an expert literary critic.  
    Read these chapters and rank them from best to worst.  
    You must evaluate and compare them based on several criteria, including: plot quality, character development, emotional depth, narrative coherence, originality of ideas, writing and style, overall impact, and the ability to engage the reader.
    Also consider how each chapter contributes to the overall pacing of the story.  

    SUPER IMPORTANT: Write all review comments strictly in this language: '${languageToUse}'.

    For example, if you think Chapter 2 is the best, assign it the number **1**.  
    If you think Chapter 4 is the worst, assign it the number **5**.

    In addition to the ranking, generate a brief note of 10-20 words as a review for each chapter.
    Return the response **only** in JSON format, structured as follows:
    [
    { "chapterNumber": x, "number": 1, "comment": "your comment"},
    { "chapterNumber": y, "number": 2, "comment": "your comment" },
    { "chapterNumber": z, "number": 3, "comment": "your comment" },
    { "chapterNumber": a, "number": 4, "comment": "your comment" },
    { "chapterNumber": b, "number": 5, "comment": "your comment" }
    ]

    Final example could be:

    [
    { "chapterNumber": 3, "number": 1, "comment": "A chapter rich in detail and atmosphere that captures the reader's attention."},
    { "chapterNumber": 2, "number": 2, "comment": "Good tension building with excellent character development."},
    { "chapterNumber": 1, "number": 3, "comment": "An interesting chapter, but with less emotional impact than the previous ones."},
    { "chapterNumber": 5, "number": 4, "comment": "Useful plot development, but lacks depth and engagement."},
    { "chapterNumber": 4, "number": 5, "comment": "A dull chapter with dialogues that fail to maintain interest."}
    ]

    Important: for each object, use the chapter number (**chapterNumber**) as reference, NOT the title.
    
    Text of the chapters: """${JSON.stringify(chaptersToElaborate, null, 2)}"""
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `Act as an expert literary critic. I will provide you chapters from the same story. Assign a distinct integer score to each chapter, following these rules: Each score must be a unique integer, different from the others. Use each score only once.`,
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        temperature: 0.3,
        max_tokens: 300,
    });

    let raw = response.choices[0].message.content;
    raw = raw.replace(/```json|```/g, "").trim();

    let ratings;
    try {
        ratings = JSON.parse(raw);
    } catch (error) {
        throw new Error(`Error parsing JSON: ${error.message}`);
    }

    validateChapterRatings(ratings, chaptersCount);
    return ratings;
}

function getLanguageName(lang) {
    switch (lang) {
        case "it":
            return "Italian";
        case "es":
            return "Spanish";
        case "en":
        default:
            return "English";
    }
}

module.exports = { generateFullMetadata };
