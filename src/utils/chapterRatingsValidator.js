function validateArrayFormat(ratings, numberOfChapters) {
    if (!Array.isArray(ratings)) {
        throw new Error("Scores must be an array.");
    }
    if (ratings.length !== numberOfChapters) {
        throw new Error(
            "The number of scores must match the number of chapters."
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
                message: `Chapter ${
                    index + 1
                }: Invalid "chapterNumber" received:  ${rating.chapterNumber}`,
            },
            {
                valid: chapterNumber >= 1 && chapterNumber <= numberOfChapters,
                message: `Chapter ${
                    index + 1
                }: "chapterNumber" out of range (1-${numberOfChapters}). Received: ${chapterNumber}`,
            },
            {
                valid: !seenChapterNumbers.has(chapterNumber),
                message: `Chapter ${
                    index + 1
                }: "chapterNumber" duplicate: ${chapterNumber}`,
            },
            {
                valid: typeof comment === "string" && comment.trim() !== "",
                message: `Chapter ${index + 1}: "comment" invalid or missing.`,
            },
        ];

        validations.forEach(({ valid, message }) => {
            if (!valid) errors.push(message);
        });

        seenChapterNumbers.add(chapterNumber);
    });

    if (errors.length > 0) {
        throw new Error(`Chapter validation errors:\n- ${errors.join("\n- ")}`);
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
                `The "number" value for chapter ${rating.chapterNumber} is not a valid integer.`
            );
        }
    });
}

function validateScoreRange(ratings, numberOfChapters) {
    ratings.forEach((rating) => {
        if (rating.number < 1 || rating.number > numberOfChapters) {
            throw new Error(
                `The "number" for chapter ${rating.chapterNumber} is not within the valid range [1, ${numberOfChapters}].`
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
