const bookLimit = 10;
let bookOffset = 10;

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
                throw new Error("Errore nella rete");
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
            console.error("Errore durante il recupero degli elementi:", error);
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
        link.href = `/storia/${book.id}-${book.slug}`;
        link.target = "_blank";

        link.className = "card-container flex justify-start items-start";

        // Star icon se è classificata
        if (book.game_type === "classificata") {
            const starIcon = document.createElement("img");
            starIcon.src = "/images/icons/star.png";
            starIcon.className = "absolute z-10 w-4 h-4 top-2 left-2";
            starIcon.alt = "stella";
            link.appendChild(starIcon);
        }

        const coverImg = document.createElement("img");
        coverImg.src =
            book.cover_image_url || "/images/book_cover_placeholder.jpeg";
        coverImg.alt = `Copertina di ${book.title}`;
        coverImg.className = "w-24 md:w-48 lg:h-64 object-cover rounded-sm";

        link.appendChild(coverImg);
        imageContainer.appendChild(link);

        // Container testo
        const textContainer = document.createElement("div");
        textContainer.className =
            "flex-1 md:p-4 flex flex-col justify-start gap-4 items-start";

        const title = document.createElement("h3");
        title.className = "text-sm md:text-md font-semibold text-gray-800";
        title.textContent = book.title;

        const backCover = document.createElement("p");
        backCover.className = "text-sm hidden md:block";
        backCover.textContent = book.back_cover;

        textContainer.appendChild(title);
        textContainer.appendChild(backCover);

        // Append tutto
        card.appendChild(imageContainer);
        card.appendChild(textContainer);

        booksGrid.appendChild(card);
    });
}
