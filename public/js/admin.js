async function adminLogin() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch("/admin/admin-panel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
        messageWrongCredentials();
        console.log("Non hai accessi");
        return;
    } else {
        const { panelData } = await response.json();
        displayPlatformData(panelData);
        document.getElementById("admin-login").classList.add("hidden");
        document.getElementById("admin-panel").classList.remove("hidden");
    }
}

function displayPlatformData(panelData) {
    console.log(panelData);
    const activeGames = document.getElementById("active-games-count");
    const gamesCompletedToday = document.getElementById("completed-today");
    const gamesCompletedWeek = document.getElementById("completed-week");
    const activeUsersNow = document.getElementById("active-users-now");
    const activeUsersToday = document.getElementById("active-users-today");
    const activeUsersWeek = document.getElementById("active-users-week");
    const registeredToday = document.getElementById("registered-today");
    const registeredWeek = document.getElementById("registered-week");
    activeGames.textContent = panelData.activeGames.count;
    gamesCompletedToday.textContent =
        panelData.gamesCompleted.games_completed_today;
    gamesCompletedWeek.textContent =
        panelData.gamesCompleted.games_completed_week;
    activeUsersNow.textContent = panelData.users.users_online;
    activeUsersToday.textContent = panelData.users.users_active_today;
    activeUsersWeek.textContent = panelData.users.users_active_week;
    registeredToday.textContent = panelData.users.users_registered_today;
    registeredWeek.textContent = panelData.users.users_registered_week;
}

function messageWrongCredentials() {
    const errorEl = document.getElementById("login-error");
    errorEl.classList.remove("opacity-0");
    errorEl.classList.add("opacity-100");
    setTimeout(() => {
        errorEl.classList.remove("opacity-100");
        errorEl.classList.add("opacity-0");
    }, 1500);
}
