let debounceTimer;
const resultsDiv = document.getElementById("results");

document.getElementById("search-input").addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const query = document.getElementById("search-input").value;

    if (query.length >= 3) {
        debounceTimer = setTimeout(() => searchUsers(query), 300);
    } else {
        document.getElementById("results").innerHTML = "";
    }
});

async function searchUsers(query) {
    try {
        const response = await fetch(
            `/search/search-user?username=${encodeURIComponent(query)}`
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
                        <div class="p-2 h-12 w-12 flex flex-col items-center rounded-full bg-gray-100 shadow-2xl">
                            <img src="/images/avatars/${user.avatar}.png" alt="${user.username} Avatar" class="w-auto h-full  mb-1" />
                        </div>
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
    const userElement = event.target.closest(".user");
    if (userElement) {
        const username = userElement.getAttribute("data-username");
        window.location.href = `/profile/${username}`;
    }
});

function dashboardButton() {
    const username = localStorage.getItem("username");
    if (username) {
        window.location.href = `/dashboard/${username}`;
    } else {
        alert("Impossibile recuperare l'username. Effettua il login.");
    }
}

function toggleSearch() {
    const container = document.getElementById("search-container");
    container.classList.toggle("hidden");
}

function toggleDropdown() {
    const menu = document.querySelector(".dropdown-menu");
    menu.classList.toggle("hidden");
}

function toggleDropdownMobile() {
    const menu = document.querySelector(".dropdown-menu-mobile");
    menu.classList.toggle("hidden");
}

async function logout() {
    try {
        const response = await fetch("/auth/logout", {
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
        localStorage.clear();
        window.location.href = "/";
    }
}

window.addEventListener("click", function (e) {
    const button = document.querySelector("button[onclick='toggleDropdown()']");
    const menu = document.getElementById("dropdownMenu");
    if (!button.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add("hidden");
    }
});

function modalDeleteAccount() {
    const modal = document.getElementById("delete-modal");
    const passwordInput = document.getElementById("confirm-password");

    passwordInput.value = "";
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closeDeleteModal() {
    const modal = document.getElementById("delete-modal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}

async function confirmDeleteAccount() {
    const password = document.getElementById("confirm-password").value;

    if (!password) {
        alert("Inserisci la password per confermare.");
        return;
    }

    const res = await fetch("/profile/delete-account", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
    });

    const data = await res.json();

    if (res.ok) {
        alert("Account cancellato. Verrai disconnesso.");
        window.location.href = "/";
    } else {
        alert(data.message || "Errore nella cancellazione.");
    }
}
