const pointsMap = {
    1: 10, // Capitolo migliore
    2: 5, // Capitolo buono
    3: 0, // Capitolo medio
    4: -5, // Capitolo scadente
    5: -10, // Capitolo peggiore
};

function calculateAndAssignRatings(chapterRatings, gameChapters) {
    return gameChapters.map((chapter, index) => {
        // Trova il rating del capitolo corrispondente
        const rating = chapterRatings.find(
            (r) => r.chapterNumber === index + 1
        );
        if (rating) {
            return {
                ...chapter,
                points: pointsMap[rating.number], // Assegna il punteggio
                comment: rating.comment, // Assegna il commento
            };
        }

        return chapter;
    });
}

module.exports = { calculateAndAssignRatings };
