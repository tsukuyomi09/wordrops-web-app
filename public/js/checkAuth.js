async function checkSessionStatus() {
    try {
        const response = await fetch("/check-session", {
            method: "GET",
            credentials: "same-origin",
        });

        if (!response.ok) {
            console.log("Sessione non valida");

            const currentPath = window.location.pathname;
            if (currentPath !== "/register01") {
                window.location.href = "/";
            }
        } else {
            const currentPath = window.location.pathname;
            if (currentPath === "/register01") {
                const username = localStorage.getItem("username");
                window.location.href = `/dashboard/${username}`;
            }
        }
    } catch (error) {
        console.error("Errore durante il controllo della sessione:", error);
    }
}

document.addEventListener("DOMContentLoaded", checkSessionStatus);
