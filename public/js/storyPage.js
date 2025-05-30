/// MENU TOGGLE CHAPTERS AND AUTHORS ///

const btnAutori = document.getElementById("btnAutori");
const dropAutori = document.getElementById("dropupAutori");
const btnCapitoli = document.getElementById("btnCapitoli");
const dropCapitoli = document.getElementById("dropupCapitoli");

function authorsDropup() {
    btnAutori.classList.toggle("text-custom-blue");
    btnAutori.classList.toggle("text-gray-800");
    btnCapitoli.classList.remove("text-custom-blue");
    btnCapitoli.classList.add("text-gray-800");
    dropAutori.classList.toggle("hidden");
    dropCapitoli.classList.add("hidden");
}

function chaptersDropup() {
    btnCapitoli.classList.toggle("text-custom-blue");
    btnCapitoli.classList.toggle("text-gray-800");
    btnAutori.classList.remove("text-custom-blue");
    btnAutori.classList.add("text-gray-800");
    dropCapitoli.classList.toggle("hidden");
    dropAutori.classList.add("hidden");
}

/// MENU TOGGLE CHAPTERS AND AUTHORS ///

/// change chapter dropdown ///

const wrapperContainer = document.getElementById("content-wrapper");

document.querySelectorAll(".chapter-btn").forEach((button) => {
    button.addEventListener("click", () => {
        const idx = button.dataset.index;
        const chapter = chapters[idx];

        document.getElementById("chapter-title").textContent = chapter.title;
        document.getElementById("chapter-content").textContent =
            chapter.content;
        document.getElementById("chapter-username").textContent =
            chapter.username;
        document.getElementById(
            "chapter-avatar"
        ).src = `/images/avatars/${chapter.avatar}.png`;

        dropCapitoli.classList.add("hidden");
        wrapperContainer.scrollIntoView({ behavior: "smooth" });
    });
});

/// back to dashboard button ///

function dashboardButton() {
    const username = localStorage.getItem("username");
    if (username) {
        window.location.href = `/dashboard/${username}`;
    } else {
        const registerModal = document.getElementById("popup-register-user");
        registerModal.classList.remove("hidden");
    }
}

/// back to dashboard button ///

function openRegisterModal() {
    const registerModal = document.getElementById("popup-register-user");
    registerModal.classList.remove("hidden");
}

function openComingSoonModal() {
    const ComingSoonModal = document.getElementById("popup-coming-soon");
    ComingSoonModal.classList.remove("hidden");
}

/// score logic ///

const giveScoreModal = document.getElementById("vote-modal");
const starContainer = document.getElementById("star-container");
const confirmBtn = document.getElementById("send-vote");

let selectedRating = 0;

// Funzione per creare stelle dinamiche con eventi inline
function createStars() {
    starContainer.innerHTML = ""; // pulisci
    for (let i = 1; i <= 5; i++) {
        const starWrapper = document.createElement("div");
        starWrapper.dataset.index = i;
        starWrapper.className =
            "cursor-pointer transition-transform duration-200 hover:scale-105  inline-block md:size-10 size-8";

        // Inserisci qui il placeholder per l'SVG, sostituirai con il codice reale
        starWrapper.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 83.947 79.762">
        <path id="empty_star" d="M16383.426,1489.74c-3.51,0-11.145,21.87-14.229,23.87s-24.95,2.132-25.867,5.382,17.762,16.4,19.012,19.813-6.177,24.691-3.927,26.524,21.168-10.215,25.011-10.381,21.91,12.465,24.744,10.381-5.549-23.941-4.465-26.524,20.633-17.48,19.549-20.563-24.482-2.632-26.732-4.632S16386.934,1489.74,16383.426,1489.74Z" transform="translate(-16341.316 -1487.74)" fill="none" stroke="#0a0a0a" stroke-width="4"/>
        </svg>`;

        // Eventi inline onclick, onmouseover, onmouseout con funzioni globali (che devi definire)
        starWrapper.setAttribute("onclick", `setRating(${i})`);
        starWrapper.setAttribute("onmouseover", `highlightStars(${i})`);
        starWrapper.setAttribute("onmouseout", `resetStars()`);

        starContainer.appendChild(starWrapper);
    }
}

// Hover dinamico
function updateStars() {
    const stars = starContainer.querySelectorAll("div");
    stars.forEach((starDiv, i) => {
        const idx = i + 1;

        const path = starDiv.querySelector("path");
        if (!path) return;

        if (idx <= selectedRating) {
            path.setAttribute("fill", "gold"); // stella piena
        }
    });
}

function highlightStars(index) {
    const stars = starContainer.querySelectorAll("div");
    stars.forEach((starDiv, i) => {
        const idx = i + 1;

        const path = starDiv.querySelector("path");
        if (!path) return;

        if (idx <= index) {
            path.setAttribute("fill", "gold");
            path.setAttribute("stroke", "gold");
        } else {
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", "#0a0a0a");
        }
    });
}

// Reset dopo hover
function resetStars() {
    updateStars();
}

// Click per selezione voto
function setRating(index) {
    selectedRating = index;
    updateStars();
    confirmBtn.disabled = false;
}

// Apertura modal
function openVoteModal() {
    selectedRating = 0;
    confirmBtn.disabled = true;
    createStars();
    giveScoreModal.classList.remove("hidden");
}

function closeModal(id) {
    const modalToClose = document.getElementById(id);
    modalToClose.classList.add("hidden");
}

async function sendVote() {
    voteText = document.getElementById("book-vote-text");
    const storyPath = window.location.pathname;
    const story_id = parseInt(storyPath.split("/").pop().split("-")[0], 10);

    if (isNaN(story_id)) {
        console.error("❌ ID della storia non valido.");
        return;
    }

    try {
        const res = await fetch(`/story/story-rate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                story_id,
                story_vote: selectedRating,
            }),
        });
        const data = await res.json();

        if (res.status === 401) {
            timeoutPlusMessage("registrati per accedere");
        }

        if (!res.ok) {
            throw new Error(data.message || "Errore sconosciuto");
        }

        if (data.status === "unchanged") {
            timeoutPlusMessage(data.message);
        }

        timeoutPlusMessage(data.message);
        updateVoteDisplay(selectedRating, data.data.average);
    } catch (err) {
        console.error("Errore durante l'invio del voto:", err.message);
        // Eventuale feedback visivo per l'utente
    }
}

function timeoutPlusMessage(text) {
    voteText = document.getElementById("book-vote-text");
    voteText.innerText = text;
    setTimeout(() => {
        closeModal("vote-modal");
        voteText.innerText = "Vota!";
    }, 2000);
}

function updateVoteDisplay(selectedRating, average) {
    document.getElementById("user-vote").innerText = selectedRating;
    document.getElementById("average-rating").innerText = average.toFixed(1);
}
