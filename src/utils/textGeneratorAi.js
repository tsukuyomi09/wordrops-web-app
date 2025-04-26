const OpenAI = require("openai");
const dotenv = require("dotenv");

// async function generateFullMetadata(chaptersToElaborate, gameType) {
//     const titleAndBackCover = await generateTitleAndBlurb(chaptersToElaborate);
//     const genres = await generateGenres(chaptersToElaborate);

//     let chapterRatings = [];
//     if (gameType === "ranked") {
//         chapterRatings = await generateChapterRatings(chaptersToElaborate);
//     }

//     return {
//         title: titleAndBackCover.title,
//         blurb: titleAndBackCover.backCover,
//         genres,
//         chapterRatings,
//     };
// }

// Carica le variabili d'ambiente dal file .env
dotenv.config();

// Inizializza OpenAI con la tua chiave API
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function generateFullMetadata(chaptersToElaborate, gameType) {
    const titleAndBackCover = await generateTitleAndBlurb(chaptersToElaborate);
    const genres = await generateGenres(chaptersToElaborate);

    return {
        title: titleAndBackCover.title,
        backCover: titleAndBackCover.backCover,
        genres,
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
                content: `Genera un JSON valido e preciso con il titolo:title e la quarta di copertina:backCover (massimo 100 parole), in questo formato: 
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

        // Convertiamo gli ID in numeri prima di restituirli
        const genres = parsedResponse.map((id) => parseInt(id, 10));

        if (
            Array.isArray(genres) &&
            genres.every((id) => Number.isInteger(id) && id >= 1 && id <= 10)
        ) {
            return genres; // Restituisce l'array dei generi validi
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
