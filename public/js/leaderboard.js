let page = 1;
const limit = 20;
document.addEventListener("DOMContentLoaded", function () {
    fetchLeaderboard(page);
});

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

async function fetchLeaderboard(page) {
    const response = await fetch(`/leaderboard/?page=${page}&limit=${limit}`);
    const data = await response.json();
    console.log(data);
    if (page === 1) {
        document.getElementById("podium").classList.remove("hidden");
        const podiumUsers = data.users.slice(0, 3);
        const tableUsers = data.users.slice(3);
        updatePodium(podiumUsers);
        updateTable(tableUsers);
    } else {
        document.getElementById("podium").classList.add("hidden");
        updateTable(data.users);
    }

    document.getElementById("page-number").textContent = `Page ${page}`;
    document.getElementById("prev").disabled = page === 1;
    document.getElementById("next").disabled = !data.hasNextPage;
}

function updateTable(users) {
    const leaderboardBody = document.getElementById("leaderboard-body");
    leaderboardBody.innerHTML = ""; // Clear the leaderboard list

    users.forEach((user, index) => {
        let rank;
        if (page === 1) {
            rank = index + 4;
        } else {
            rank = (page - 1) * limit + index + 1;
        }
        const row = document.createElement("tr");
        row.classList.add(index % 2 === 0 ? "bg-white" : "custom-light-bg");
        const tableAvatarBgColor =
            index % 2 === 0 ? "bg-custom-light" : "bg-white";

        row.innerHTML = `
        <td class="px-4 md:px-8 py-4 text-left font-semibold text-xs md:text-lg text-gray-800">${rank}</td>
        <td class="px-6 md:px-12 py-4 ">
            <a href="/profile-page/${user.username}" target="blank" class="block">
                <div class="flex justify-start items-center gap-2 md:gap-4">
                    <div class="rounded-md md:rounded-lg overflow-hidden ${tableAvatarBgColor} size-7 md:size-10 ">
                        <img src="/images/avatars/${user.avatar}.png" alt="${user.username}'s avatar"  class="w-full h-full object-contain" />
                    </div>
                    <span class="font-semibold text-xs md:text-lg text-gray-900">${user.username}</span>
                </div>
            </a>
        </td>
        <td class="px-4 md:px-8 py-4 text-right font-semibold text-xs md:text-lg text-gray-800">${user.ranked_score}</td>
    `;

        leaderboardBody.appendChild(row);
    });
}

function updatePodium(podiumUsers) {
    const positions = ["first", "second", "third"];

    podiumUsers.forEach((user, index) => {
        const id = positions[index];
        if (!id || !user) return;

        document.getElementById(
            `${id}-avatar`
        ).src = `/images/avatars/${user.avatar}.png`;
        document.getElementById(`${id}-username`).textContent = user.username;
        document.getElementById(
            `${id}-score`
        ).textContent = `${user.ranked_score}`;
        document.getElementById(
            `${id}-games`
        ).textContent = `${user.ranked_played}`;
        document.getElementById(`${id}-rank`).textContent = `${index + 1}`;

        const container = document.getElementById(`${id}-container`);
        container.href = `/profile-page/${user.username}`;
        container.target = "_blank";
    });
}

function prevPage() {
    if (page > 1) {
        page--;
        fetchLeaderboard(page);
        window.scrollTo(0, 0);
    }
}

function nextPage() {
    page++;
    fetchLeaderboard(page);
    window.scrollTo(0, 0);
}

async function searchUser() {
    const input = document.getElementById("search-input");
    const username = input.value.trim();
    if (!username) return;

    try {
        const response = await fetch("/leaderboard/search-user", {
            method: "POST", // Usa POST
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username: username }),
        });
        if (response.ok) {
            window.location.href = `/profile-page/${username}`;
            return;
        }

        throw new Error(data.error || "Errore nella ricerca");
    } catch (err) {
        console.error(err);
        const errorMessage = document.getElementById("error-message");
        errorMessage.textContent = "L'utente non esiste";
        errorMessage.classList.remove("hidden");
        setTimeout(() => {
            errorMessage.classList.add("hidden");
        }, 2000);
    }
}
