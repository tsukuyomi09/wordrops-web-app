let debounceTimer;
const resultsDiv = document.getElementById("results");

document.getElementById("search-input").addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const query = document.getElementById("search-input").value;

    if (query.length >= 3) {
        // Aspetta almeno 3 caratteri
        debounceTimer = setTimeout(() => searchUsers(query), 300); // Attendi 300ms
    } else {
        document.getElementById("results").innerHTML = ""; // Svuota risultati
    }
});

async function searchUsers(query) {
    try {
        const response = await fetch(
            `/search-users?username=${encodeURIComponent(query)}`
        );
        const users = await response.json();

        if (users.length === 0) {
            resultsDiv.innerHTML = "<p>Nessun utente trovato.</p>";
        } else {
            resultsDiv.innerHTML = users
                .map(
                    (user) =>
                        `<div 
                    class="user flex bg-gray-200 mb-4 w-full items-center space-x-4 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-all"
                    data-username="${user.username}" 
                    data-avatar="${user.avatar}">
                    <div class="flex w-full items-center space-x-3 justify-start">
                        <!-- Avatar -->
                        <img src="/images/avatars/${user.avatar}.png" alt="${user.username} Avatar" class="w-8 h-8 rounded-full border-2 border-orange-400">
                        <!-- Username -->
                        <strong class="text-lg font-bold text-gray-800">${user.username}</strong>
                    </div>
                </div>`
                )
                .join("");
        }
    } catch (error) {
        resultsDiv.innerHTML = "<p>Errore durante la ricerca.</p>";
        console.error(error);
    }
}

resultsDiv.addEventListener("click", (event) => {
    const userElement = event.target.closest(".user"); // Trova l'elemento cliccato
    if (userElement) {
        const username = userElement.getAttribute("data-username");
        window.location.href = `/profile/${username}`;
    }
});

function showAvatarTransition() {
    const avatarContainer = document.querySelector(".avatar-container");
    setTimeout(() => {
        avatarContainer.classList.add("show");
    }, 50); // Ritardo per la transizione
}

showAvatarTransition();

function dashboardButton() {
    const username = localStorage.getItem("username");
    if (username) {
        // Fai il redirect alla dashboard dell'utente
        window.location.href = `/dashboard/${username}`;
    } else {
        alert("Impossibile recuperare l'username. Effettua il login.");
    }
}

function openSearch() {
    const searchWrapper = document.getElementById("user-search-wrapper");
    searchWrapper.classList.remove("opacity-0"); // Mostra il div con opacità 1
}

function closeSearch() {
    const searchWrapper = document.getElementById("user-search-wrapper");
    searchWrapper.classList.add("opacity-0"); // Nasconde il div con opacità 0
}

function toggleDropdown() {
    const menu = document.getElementById("dropdownMenu");
    menu.classList.toggle("hidden");
}

async function logout() {
    try {
        buttonSound();
        sessionStorage.clear();

        const response = await fetch("/logout", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Errore durante il logout:", errorData.error);
        }
    } catch (error) {
        console.error("Errore: Problema con il logout:", error);
    } finally {
        // In ogni caso, rimuovi tutto e reindirizza
        localStorage.clear();
        window.location.href = "/register01";
    }
}

// Opzionale: chiude il menu se clicchi fuori
window.addEventListener("click", function (e) {
    const button = document.querySelector("button[onclick='toggleDropdown()']");
    const menu = document.getElementById("dropdownMenu");
    if (!button.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add("hidden");
    }
});
