const bookLimit = 10;
let bookOffset = 10;

document.addEventListener("DOMContentLoaded", function () {
    startPing(60000);
});

function startPing(intervalMs = 60000) {
    async function ping() {
        try {
            const res = await fetch("/profile/user-last-seen", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) throw new Error("Ping error");
        } catch (err) {
            console.error("Ping failed", err);
        }
    }

    ping(); // ping iniziale subito
    setInterval(ping, intervalMs);
}

function dashboardButton() {
    const username = localStorage.getItem("username");
    if (username) {
        window.location.href = `/dashboard/${username}`;
    } else {
        const registerModal = document.getElementById("popup-register-user");
        registerModal.classList.remove("hidden");
    }
}

function closeModal(id) {
    const modalToClose = document.getElementById(id);
    modalToClose.classList.add("hidden");
}

function loadMoreBooks() {
    fetch(`/community/load-more-books/?offset=${bookOffset}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network error");
            }
            return response.json();
        })
        .then((data) => {
            if (data.games.length > 0) {
                const books = data.games;
                displayUserBooks(books);
                bookOffset += bookLimit;
            }
        })
        .catch((error) => {
            console.error("Error fetching items:", error);
        });
}

function displayUserBooks(books) {
    const booksGrid = document.getElementById("games-content");

    books.forEach((book) => {
        const card = document.createElement("div");
        card.className =
            "flex flex-col md:flex-row p-4 gap-4 bg-gray-50 rounded-lg shadow-xs";

        // Container immagine
        const imageContainer = document.createElement("div");
        imageContainer.className = "relative flex justify-start items-start";

        const link = document.createElement("a");
        link.href = `/story/${book.lang}/${book.id}-${book.slug}`;
        link.target = "_blank";

        link.className = "card-container flex justify-start items-start";

        // Star icon se è classificata
        if (book.game_type === "classificata") {
            const starIcon = document.createElement("img");
            starIcon.src = "/images/icons/star.png";
            starIcon.className = "absolute z-10 w-4 h-4 top-2 left-2";
            starIcon.alt = "star";
            link.appendChild(starIcon);
        }

        const coverImg = document.createElement("img");
        coverImg.src =
            book.cover_image_url || "/images/book_cover_placeholder.jpeg";
        coverImg.alt = `Cover of ${book.title}`;
        coverImg.className = "w-24 md:w-48 lg:h-64 object-cover rounded-sm";

        link.appendChild(coverImg);
        imageContainer.appendChild(link);

        // Container testo
        const textContainer = document.createElement("div");

        textContainer.className =
            "flex-1 md:p-4 flex flex-col justify-start gap-4 items-start relative";

        const langBox = document.createElement("div");
        langBox.className =
            "md:absolute md:-top-4 md:-right-4 static text-xs md:text-lm p-1 md:p-2 border-1 bg-orange-500 text-white font-bold flex items-center justify-center rounded select-none z-10";
        langBox.title = book.lang.toUpperCase();
        langBox.textContent = book.lang.toUpperCase();
        const title = document.createElement("h3");
        title.className = "text-xl md:text-2xl italic font-semibold";
        title.textContent = book.title;

        const backCover = document.createElement("p");
        backCover.className = "text-sm hidden md:block";
        backCover.textContent = book.back_cover;

        textContainer.appendChild(langBox);
        textContainer.appendChild(title);
        textContainer.appendChild(backCover);

        // Append tutto
        card.appendChild(imageContainer);
        card.appendChild(textContainer);

        booksGrid.appendChild(card);
    });
}
