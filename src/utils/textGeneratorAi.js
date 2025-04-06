const OpenAI = require("openai");
const dotenv = require("dotenv");

// Carica le variabili d'ambiente dal file .env
dotenv.config();

// Inizializza OpenAI con la tua chiave API
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Funzione per generare titolo e riassunto
async function generateBookMetadata(chaptersToElaborate) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "Sei un assistente che genera titoli e quarte di copertina per libri. Rispondi sempre con un JSON valido, senza formattazione Markdown.",
                },
                {
                    role: "user",
                    content: `Genera un JSON con titolo e quarta di copertina per il seguente testo: """${chaptersToElaborate}"""`,
                },
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        let rawContent = response.choices[0].message.content;

        //  Rimuove eventuali delimitatori Markdown (es. ```json ... ```)
        rawContent = rawContent
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        console.log("📜 JSON ricevuto:", rawContent); // Debugging

        return JSON.parse(rawContent); // Ora il JSON è pulito
    } catch (error) {
        console.error("Errore nella generazione dei metadati:", error);
        throw error;
    }
}

module.exports = { generateBookMetadata };
