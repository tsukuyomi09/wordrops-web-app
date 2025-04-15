const OpenAI = require("openai");
const dotenv = require("dotenv");

// Carica le variabili d'ambiente dal file .env
dotenv.config();

// Inizializza OpenAI con la tua chiave API
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function generateFullMetadata(chaptersToElaborate) {
    const titleAndBlurb = await generateTitleAndBlurb(chaptersToElaborate);
    console.log("Title and Blurb:", titleAndBlurb);

    const genres = await generateGenres(chaptersToElaborate);
    console.log("Genres:", genres);

    const chapterRatings = await generateChapterRatings(chaptersToElaborate);
    console.log("Chapter Ratings:", chapterRatings);
    return {
        title: titleAndBlurb.title,
        blurb: titleAndBlurb.blurb,
        genres,
        chapterRatings,
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
                content: `Genera un JSON valido e preciso con il titolo, la descrizione (massimo 100 parole), in questo formato: 
                {
                    "title": "Titolo del libro",
                    "blurb": "Descrizione del libro"
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
    const genresList = [
        "Fantasy",
        "Fantascienza",
        "Thriller",
        "Horror",
        "Romantico",
        "Commedia",
        "Drammatico",
        "Avventura",
        "Storico",
        "Distopico",
    ];

    const prompt = `
Scegli da 1 a 3 generi letterari pertinenti per questa storia. Scegli solo tra: ${genresList.join(
        ", "
    )}.
Rispondi con un array JSON valido con i generi scelti, senza altre aggiunte. Il formato della risposta deve essere:

[
    "Genere1",
    "Genere2",
    "Genere3"
]

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
        return JSON.parse(raw);
    } catch (error) {
        throw new Error(`Errore nel parsing del JSON: ${error.message}`);
    }
}

async function generateChapterRatings(chaptersToElaborate) {
    const prompt = `
    Sei un critico letterario, leggi questi 5 capitoli e fai una classifica dal migliore al peggiore. Al primo in classifica dai un punteggio tra 11 e 15, al secondo tra 6 e 10, al terzo tra 0 a 5, al quarto tra -5 e -1 e all'ultimo in classifica un punteggio tra -10 e -6
    
    Restituisci la risposta **solo** in formato JSON, così strutturato:
    [
      { "chapter": "nomeCapitolo", "score": numero, "comment": "breve descrizione (10-20 parole)" }
    ]
    
    Testo dei capitoli: """${JSON.stringify(chaptersToElaborate, null, 2)}"""
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `Agisci come un critico letterario esperto. Ti fornirò 5 capitoli della stessa storia. Assegna un punteggio numerico SECCO per ciascun capitolo, seguendo queste regole: Ogni punteggio deve essere un numero intero, diverso dagli altri. Usa una sola volta ciascun range.`,
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

    try {
        return JSON.parse(raw);
    } catch (error) {
        throw new Error(`Errore nel parsing del JSON: ${error.message}`);
    }
}

module.exports = { generateFullMetadata };
