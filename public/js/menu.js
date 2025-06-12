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

function modalDeleteAccount() {
    const modal = document.getElementById("delete-modal");

    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closeDeleteModal() {
    const modal = document.getElementById("delete-modal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}

async function confirmDeleteAccount() {
    const res = await fetch("/profile/delete-account", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
    });

    const data = await res.json();

    if (res.ok) {
        alert("Account cancellato. Verrai disconnesso.");
        window.location.href = "/";
    } else {
        alert(data.message || "Errore nella cancellazione.");
    }
}
