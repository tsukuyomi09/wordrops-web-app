const usernameInput = document.getElementById("username");
const confirmButton = document.getElementById("confirmButton");

function checkUsername() {
    const username = usernameInput.value.trim();
    const confirmButton = document.getElementById("confirmButton");
    const errorEl = document.getElementById("username-error");

    const validUsernameRegex = /^[a-zA-Z0-9-_.]+$/;

    let errorMsg = "";

    if (username.length === 0) {
        // reset state
        confirmButton.disabled = true;
        confirmButton.classList.remove("bg-blue-400");
        confirmButton.classList.add("bg-red-400");
        confirmButton.textContent = "CHOOSE A VALID USERNAME";
        errorEl.classList.add("opacity-0");
        return;
    }

    if (username.length < 4 || username.length > 16) {
        errorMsg = "Username must be 4–16 characters.";
    } else if (!validUsernameRegex.test(username)) {
        errorMsg =
            "Only letters, numbers, dashes (-), underscores (_) and dots (.) are allowed.";
    }

    if (errorMsg) {
        confirmButton.disabled = true;
        confirmButton.classList.remove("bg-blue-400");
        confirmButton.classList.add("bg-red-400");
        confirmButton.textContent = "CHOOSE A VALID USERNAME";

        errorEl.textContent = errorMsg;
        errorEl.classList.remove("opacity-0");
        errorEl.classList.add("opacity-100");
    } else {
        confirmButton.disabled = false;
        confirmButton.classList.remove("bg-red-400");
        confirmButton.classList.add("bg-blue-400");
        confirmButton.textContent = "CONTINUE";

        errorEl.classList.remove("opacity-100");
        errorEl.classList.add("opacity-0");
    }
}

usernameInput.addEventListener("input", checkUsername);

async function checkUsernameAndProceed() {
    const username = document.getElementById("username").value;

    if (!username) {
        alert("Please enter a username.");
        return;
    }
    try {
        const response = await fetch(
            `/onboarding/check-username?username=${encodeURIComponent(
                username
            )}`
        );
        const data = await response.json();
        usernameAvailable = data.available;
        if (usernameAvailable) {
            goToStep2(username);
        } else {
            usernameErrorAnimation();
        }
    } catch {
        alert("An error occurred. Please try again later.");
    }
}

function usernameErrorAnimation() {
    const errorEl = document.getElementById("username-error");
    errorEl.textContent = "Username already taken.";
    errorEl.classList.remove("opacity-0");
    errorEl.classList.add("opacity-100");

    setTimeout(() => {
        errorEl.classList.remove("opacity-100");
        errorEl.classList.add("opacity-0");
    }, 2000);
}

function goToStep2(username) {
    if (username) {
        const step1 = document.getElementById("step1");
        step1.classList.remove("opacity-100");
        step1.classList.add("opacity-0");

        setTimeout(() => {
            step1.classList.add("hidden");
            const step2 = document.getElementById("step2");
            step2.classList.remove("hidden");

            step2.classList.remove("opacity-0");
            step2.classList.add("opacity-100");
        }, 1000);
    } else {
        alert("Enter a username.");
    }
}

function gobackToStep1() {
    const step2 = document.getElementById("step2");
    step2.classList.remove("opacity-100");
    step2.classList.add("opacity-0");

    setTimeout(() => {
        step2.classList.add("hidden");
        const step1 = document.getElementById("step1");
        step1.classList.remove("hidden");

        const confirmButton = document.getElementById("confirm-profile");
        confirmButton.classList.add("hidden");
        confirmButton.classList.remove("inline-flex");

        document.querySelectorAll(".avatar").forEach((el) => {
            el.classList.remove("selected-avatar");
        });

        step1.classList.remove("opacity-0");
        step1.classList.add("opacity-100");
    }, 500);
}

function confirmProfile() {
    const username = document.getElementById("username").value;
    const avatarName = document.getElementById("selectedAvatar").value;
    if (username && avatarName) {
        finishOnboarding(username, avatarName);
    } else {
        alert("Make sure you have selected an avatar.");
    }
}

function selectAvatar(id) {
    document.querySelectorAll(".avatar").forEach((el) => {
        el.classList.remove("selected-avatar");
    });

    const confirmButton = document.getElementById("confirm-profile");
    confirmButton.classList.remove("hidden");
    confirmButton.classList.add("inline-flex");
    confirmButton.classList.remove("opacity-0");
    confirmButton.classList.add("opacity-100");

    const clickedImg = document.querySelector(
        `.avatar-image[onclick="selectAvatar(${id})"]`
    );

    if (clickedImg) {
        const avatarName = clickedImg.getAttribute("data-name");
        const container = clickedImg.closest(".avatar");
        if (container) container.classList.add("selected-avatar");
        const selectedAvatarInput = document.getElementById("selectedAvatar");
        if (selectedAvatarInput) {
            selectedAvatarInput.value = avatarName;
        } else {
            alert("Error: 'selectedAvatar' field not found.");
        }
    }
}

async function finishOnboarding(username, avatarName) {
    try {
        const urlPath = window.location.pathname;
        const email = urlPath.split("/")[2];
        const response = await fetch(`/onboarding/finish-onboarding/${email}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, avatarName }),
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("username", data.username);
            window.location.href = `/dashboard/${data.username}`;
        } else {
            const errorData = await response.json();
            alert(
                "Error completing onboarding: " +
                    (errorData.message || "Please try again later.")
            );
        }
    } catch {
        alert("Network error while sending data. Please try again.");
    }
}
