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
