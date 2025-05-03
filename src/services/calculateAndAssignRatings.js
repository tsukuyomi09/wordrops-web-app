const pointsMap = {
    1: 10,
    2: 5,
    3: 0,
    4: -5,
    5: -10,
};

function calculateAndAssignRatings(chapterRatings, gameChapters) {
    return gameChapters.map((chapter, index) => {
        const rating = chapterRatings.find(
            (r) => r.chapterNumber === index + 1
        );
        if (rating) {
            return {
                ...chapter,
                points: pointsMap[rating.number],
                comment: rating.comment,
            };
        }

        return chapter;
    });
}

module.exports = { calculateAndAssignRatings };
