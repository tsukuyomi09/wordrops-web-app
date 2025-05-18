document.addEventListener("DOMContentLoaded", function () {
    fetchStoryData();
});

async function fetchStoryData() {
    try {
        const pathParts = window.location.pathname.split("/");
        const story_id = pathParts[pathParts.length - 1];
        console.log();
        const response = await fetch(`/story/story-data/${story_id}`);
        if (!response.ok) {
            throw new Error("Errore nel recupero dei dati della storia");
        }

        const data = await response.json();
        console.log(data);
        displayStoryOnPage(data);
    } catch (error) {
        console.error("Errore nel recupero dei dati della storia", error);
    }
}

function displayStoryOnPage(data) {
    document.getElementById("book-title").innerText = data.title;
}

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
        console.log(idx);
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
        alert("Errore: nome utente non trovato.");
    }
}

/// back to dashboard button ///

/// score logic ///

const voteBtn = document.querySelector("button.flex");
const giveScoreModal = document.getElementById("voteModal");
const starContainer = document.getElementById("starContainer");
const cancelBtn = document.getElementById("cancelVote");
const confirmBtn = document.getElementById("confirmVote");

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

// Aggiorna visivamente le stelle
function openVoteModal() {
    selectedRating = 0;
    confirmBtn.disabled = true;
    createStars();
    giveScoreModal.classList.remove("hidden");
}

// Apertura modal
function openVoteModal() {
    selectedRating = 0;
    confirmBtn.disabled = true;
    createStars();
    giveScoreModal.classList.remove("hidden");
}

function closeVoteModal() {
    giveScoreModal.classList.add("hidden");
}
function confirmVote() {
    giveScoreModal.classList.add("hidden");
    console.log("Voto selezionato:", selectedRating);
    // submit voto al server
}

voteBtn.onclick = openVoteModal;
