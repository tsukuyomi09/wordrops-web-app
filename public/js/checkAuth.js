async function checkSessionStatus() {
    try {
        const response = await fetch("/auth/check-session", {
            method: "GET",
        });

        if (!response.ok) {
            console.log("Invalid session");

            const currentPath = window.location.pathname;
            if (currentPath !== "/register") {
                window.location.href = "/";
            }
        } else {
            const currentPath = window.location.pathname;
            if (currentPath === "/register") {
                const username = localStorage.getItem("username");
                window.location.href = `/dashboard/${username}`;
            }
        }
    } catch (error) {
        console.error("Error checking session:", error);
    }
}

document.addEventListener("DOMContentLoaded", checkSessionStatus);
