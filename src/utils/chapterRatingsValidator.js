function validateArrayFormat(ratings, numberOfChapters) {
    if (!Array.isArray(ratings)) {
        throw new Error("I punteggi devono essere un array.");
    }
    if (ratings.length !== numberOfChapters) {
        throw new Error(
            "Il numero di punteggi deve corrispondere al numero dei capitoli."
        );
    }
}

function validateChapterFormat(ratings, numberOfChapters) {
    const errors = [];
    const seenChapterNumbers = new Set();

    ratings.forEach((rating, index) => {
        let { chapterNumber, comment } = rating;

        // Normalizzazione
        if (typeof chapterNumber === "string") {
            chapterNumber = parseInt(chapterNumber, 10);
        }

        const validations = [
            {
                valid:
                    typeof chapterNumber === "number" &&
                    !isNaN(chapterNumber) &&
                    chapterNumber > 0,
                message: `Capitolo ${
                    index + 1
                }: "chapterNumber" non valido. Ricevuto: ${
                    rating.chapterNumber
                }`,
            },
            {
                valid: chapterNumber >= 1 && chapterNumber <= numberOfChapters,
                message: `Capitolo ${
                    index + 1
                }: "chapterNumber" fuori range (1-${numberOfChapters}). Ricevuto: ${chapterNumber}`,
            },
            {
                valid: !seenChapterNumbers.has(chapterNumber),
                message: `Capitolo ${
                    index + 1
                }: "chapterNumber" duplicato: ${chapterNumber}`,
            },
            {
                valid: typeof comment === "string" && comment.trim() !== "",
                message: `Capitolo ${index + 1}: "comment" non valido o vuoto.`,
            },
        ];

        validations.forEach(({ valid, message }) => {
            if (!valid) errors.push(message);
        });

        seenChapterNumbers.add(chapterNumber);
    });

    if (errors.length > 0) {
        throw new Error(
            `Errori validazione capitoli:\n- ${errors.join("\n- ")}`
        );
    }
}

function validateScoreFormat(ratings) {
    ratings.forEach((rating) => {
        if (typeof rating.number === "string") {
            rating.number = parseInt(rating.number, 10); // meglio parseInt
        }
        if (
            typeof rating.number !== "number" ||
            isNaN(rating.number) ||
            !Number.isInteger(rating.number)
        ) {
            throw new Error(
                `Il valore "number" per il capitolo ${rating.chapterNumber} non è un intero valido.`
            );
        }
    });
}

function validateScoreRange(ratings, numberOfChapters) {
    ratings.forEach((rating) => {
        if (rating.number < 1 || rating.number > numberOfChapters) {
            throw new Error(
                `Il "number" del capitolo ${rating.chapterNumber} non è nel range valido [1, ${numberOfChapters}].`
            );
        }
    });
}

function validateChapterRatings(ratings, numberOfChapters) {
    validateArrayFormat(ratings, numberOfChapters);
    validateChapterFormat(ratings, numberOfChapters);
    validateScoreFormat(ratings);
    validateScoreRange(ratings, numberOfChapters);
}

module.exports = {
    validateChapterRatings,
};
