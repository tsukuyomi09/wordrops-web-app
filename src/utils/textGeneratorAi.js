const OpenAI = require("openai");
const dotenv = require("dotenv");
const { validateChapterRatings } = require("../utils/chapterRatingsValidator");

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function generateFullMetadata(chaptersToElaborate, gameType) {
    const titleAndBackCover = await generateTitleAndBlurb(chaptersToElaborate);
    const genres = await generateGenres(chaptersToElaborate);
    const imagePrompt = await generateImagePrompt(chaptersToElaborate);

    let chapterRatings = [];
    if (gameType === "ranked") {
        chapterRatings = await generateChapterRatingsWithRetry(
            chaptersToElaborate
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

async function generateTitleAndBlurb(chaptersToElaborate) {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content:
                    "Sei un assistente che genera titoli e quarte di copertura per libri. Devi generare un **titolo** e una **descrizione** (massimo 100 parole) che riassuma l'intero libro, basandoti sui seguenti capitoli. Restituisci **un solo titolo e blurb** in formato JSON, con il seguente schema:",
            },
            {
                role: "user",
                content: `Genera un JSON valido e preciso con il titolo:title e la quarta di copertina:backCover (range di 25-35 perole), in questo formato: 
                {
                    "title": "Titolo del libro",
                    "backCover": "Descrizione del libro"
                }
                Assicurati che il JSON sia correttamente formattato e senza errori. Non includere altro testo.

                Testo da utilizzare: """${JSON.stringify(
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
    Scegli da 1 a 3 generi letterari pertinenti per questa storia. Scegli solo tra i seguenti ID corrispondenti ai generi indicati:
    1 - Fantasy
    2 - Fantascienza
    3 - Thriller
    4 - Horror
    5 - Romantico
    6 - Commedia
    7 - Drammatico
    8 - Avventura
    9 - Storico
    10 - Slice of life
    
    Rispondi con un array JSON valido con gli ID dei generi scelti (da 1 a 10), senza altre aggiunte. Il formato della risposta deve essere:
    
    [
        1, 3, 5
    ]

    Rispondere con un array contenente solo numeri validi (da 1 a 10). Ogni numero corrisponde a un genere letterario che deve essere scelto per la storia.

Testo: """${JSON.stringify(chaptersToElaborate, null, 2)}"""
`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content:
                    "Sei un assistente che classifica le storie in generi letterari. Rispondi sempre con un array JSON valido di 1-3 generi scelti da una lista predefinita.",
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
                "La risposta contiene ID non validi o formattazione errata."
            );
        }
    } catch (error) {
        console.error(
            "Errore nel parsing del JSON o dati non validi:",
            error.message
        );
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
                You are an assistant creating a detailed, vivid, and creative image prompt for DALL·E 3, suitable for a book cover illustration.  
                Create a visually rich description including scene, environment, colors, mood, style, and symbolism inspired by the story below.  
                Avoid content that could trigger safety filters, such as nudity, violence, children, real people or celebrities.  
                Do not include any text inside the image.  
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
    attempts = 3
) {
    for (let i = 0; i < attempts; i++) {
        try {
            const ratings = await generateChapterRatings(chaptersToElaborate);
            return ratings;
        } catch (error) {
            console.log(`Tentativo ${i + 1} fallito: ${error.message}`);
        }
    }
    console.log(
        "Impossibile generare punteggi validi dopo 3 tentativi. Restituendo fallback."
    );
    return chaptersToElaborate.map((chapter) => ({
        chapter: chapter.title,
        score: 0,
        comment: "Non è stato possibile generare un punteggio",
    }));
}

async function generateChapterRatings(chaptersToElaborate) {
    const chaptersCount = chaptersToElaborate.length;

    const prompt = `
    Sei un critico letterario esperto. 
    Leggi questi capitoli e fai una classifica dal migliore al peggiore. 
    Devi giudicarli e confrontarli fra di loro basandoti su diversi criteri, fra cui: la qualità della trama, lo sviluppo dei personaggi, la profondità emotiva, la coerenza narrativa, l'originalità delle idee, la scrittura e lo stile, l'impatto generale e la capacità di coinvolgere il lettore. Considera anche come ogni capitolo contribuisce al ritmo complessivo della storia.
    Per esempio, se ritieni che il Capitolo 2 sia il migliore, gli assegnerai il numero **1**. 
    Se pensi che il Capitolo 4 sia il peggiore, dovrai assegnargli il numero **5**. 

    Oltre alla classifica, genere una breve appunto di 10-20 parole come recesione per ogni capitolo
    
    Restituisci la risposta **solo** in formato JSON, così strutturato:
[
  { "chapterNumber": x, "number": 1, "comment": "tuo commento"},
  { "chapterNumber": y, "number": 2, "comment": "tuo commento" },
  { "chapterNumber": z, "number": 3, "comment": "tuo commento" },
  { "chapterNumber": a, "number": 4, "comment": "tuo commento" },
  { "chapterNumber": b, "number": 5, "comment": "tuo commento" }
]

Esempio finale potrebbe essere:

[
  { "chapterNumber": 3, "number": 1, "comment": "Un capitolo ricco di dettagli e atmosfera, che cattura l'attenzione del lettore."},
  { "chapterNumber": 2, "number": 2, "comment": "Buona costruzione della tensione, con un'ottima caratterizzazione dei personaggi." },
  { "chapterNumber": 1, "number": 3, "comment": "Un capitolo interessante, ma con meno impatto emotivo rispetto ai precedenti." },
  { "chapterNumber": 5, "number": 4, "comment": "Sviluppo della trama utile, ma manca di profondità e coinvolgimento." },
  { "chapterNumber": 4, "number": 5, "comment": "Capitolo poco avvincente, con dialoghi che non riescono a mantenere l'interesse." }
]

Importante: per ogni oggetto, usa il numero di capitolo (**chapterNumber**) come riferimento, NON il titolo.
    
    Testo dei capitoli: """${JSON.stringify(chaptersToElaborate, null, 2)}"""
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `Agisci come un critico letterario esperto. Ti fornirò dei capitoli della stessa storia. Assegna un punteggio numerico SECCO per ciascun capitolo, seguendo queste regole: Ogni punteggio deve essere un numero intero, diverso dagli altri. Usa una sola volta ciascun range.`,
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
        throw new Error(`Errore nel parsing del JSON: ${error.message}`);
    }

    validateChapterRatings(ratings, chaptersCount);
    return ratings;
}

module.exports = { generateFullMetadata };
