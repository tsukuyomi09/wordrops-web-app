let page = 1;
const limit = 20;

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
}

function updateTable(users) {
    const leaderboardBody = document.getElementById("leaderboard-body");
    leaderboardBody.innerHTML = ""; // Clear the leaderboard list

    users.forEach((user, index) => {
        const rank = (page - 1) * limit + index + 1; // <- FIX
        const row = document.createElement("tr");
        row.classList.add(index % 2 === 0 ? "bg-white" : "custom-light-bg");
        const tableAvatarBgColor =
            index % 2 === 0 ? "bg-custom-light" : "bg-white";

        row.innerHTML = `
        <td class="px-8 py-4 text-left font-semibold text-xl text-gray-800">${rank}</td>
        <td class="px-12 py-4 ">
            <div class="flex justify-start items-center  gap-4">
                <div class=" p-3 rounded-lg ${tableAvatarBgColor} h-18 w-18">
                    <img src="/images/avatars/${user.avatar}.png" alt="${user.username}'s avatar"  class="w-full h-full object-contain" />
                </div>
                <span class="font-semibold text-xl text-gray-900">${user.username}</span>
            </div>
        </td>
        <td class="px-10 py-4 text-right font-semibold text-xl text-gray-800">${user.ranked_score}</td>
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
    });
}

document.getElementById("prev").addEventListener("click", () => {
    if (page > 1) {
        page--;
        fetchLeaderboard(page);
    }
});

document.getElementById("next").addEventListener("click", () => {
    page++;
    fetchLeaderboard(page);
});

fetchLeaderboard(page);
