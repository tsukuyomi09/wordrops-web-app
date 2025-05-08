let page = 1;
const limit = 20;
const podium = document.getElementById("podium");

async function fetchLeaderboard(page) {
    const response = await fetch(`/leaderboard/?page=${page}&limit=${limit}`);
    const data = await response.json();
    console.log(`data class: ${data}`);
    if (page === 1) {
        podium.classList.remove("hidden");
    } else {
        podium.classList.add("hidden");
    }
    const leaderboardBody = document.getElementById("leaderboard-body");
    leaderboardBody.innerHTML = ""; // Clear the leaderboard list

    data.users.forEach((user, index) => {
        const rank = (page - 1) * limit + index + 1; // <- FIX
        const row = document.createElement("tr");
        row.classList.add(index % 2 === 0 ? "bg-white" : "custom-light-bg");

        row.innerHTML = `
        <td class="px-8 py-4 text-left font-semibold text-xl text-gray-800">${rank}</td>
        <td class="px-12 py-4 ">
            <div class="flex justify-start items-center">
                <img src="/images/avatars/${user.avatar}.png" alt="${user.username}'s avatar"
                class="w-8 h-10 rounded-full mr-3" />
                <span class="font-semibold text-xl text-gray-900">${user.username}</span>
            </div>
        </td>
        <td class="px-10 py-4 text-right font-semibold text-xl text-gray-800">${user.ranked_score}</td>
    `;

        leaderboardBody.appendChild(row);
    });

    document.getElementById("page-number").textContent = `Page ${page}`;
    document.getElementById("prev").disabled = page === 1;
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
