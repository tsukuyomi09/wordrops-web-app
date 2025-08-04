const confirmPasswordInput = document.getElementById("confirm-password");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const googleLog = document.getElementById("buttonDiv");
const toggleText = document.getElementById("toggle-text");
const toggleButton = document.getElementById("toggle-button");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorEl = document.getElementById("login-error");
const registrationForm = document.getElementById("registrationForm");
const matchMsg = document.getElementById("password-match-msg");

let isRegistering = false;

function toggleMode() {
    isRegistering = !isRegistering;

    if (isRegistering) {
        confirmPasswordInput.classList.remove("hidden");
        loginBtn.classList.add("hidden");
        googleLog.classList.add("hidden");
        registerBtn.classList.remove("hidden");

        toggleText.textContent = "Already have an account?";
        toggleButton.textContent = "Login";
    } else {
        confirmPasswordInput.classList.add("hidden");
        loginBtn.classList.remove("hidden");
        googleLog.classList.remove("hidden");
        registerBtn.classList.add("hidden");

        toggleText.textContent = "Don't have an account?";
        toggleButton.textContent = "Create one";
    }
}

confirmPasswordInput.addEventListener("input", () => {
    if (confirmPasswordInput.value === "") {
        confirmPasswordInput.classList.remove(
            "border-red-500",
            "border-green-500"
        );
        matchMsg.classList.add("hidden");
        return;
    }

    if (confirmPasswordInput.value === passwordInput.value) {
        confirmPasswordInput.classList.remove("border-red-500");
        confirmPasswordInput.classList.add("border-green-500");
        matchMsg.classList.add("hidden");
    } else {
        confirmPasswordInput.classList.remove("border-green-500");
        confirmPasswordInput.classList.add("border-red-500");
        matchMsg.classList.remove("hidden");
    }
});

async function registerUser() {
    const userEmail = emailInput.value;
    const userPassword = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (userPassword !== confirmPassword) {
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get("lang") || "en";

    try {
        const response = await fetch("/auth/register", {
            method: "POST",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify({ userEmail, userPassword, lang }),
        });

        if (response.ok) {
            const modal = document.getElementById("registration-modal");
            modal.classList.remove("hidden");
            modal.classList.add("flex");

            setTimeout(() => {
                modal.classList.add("hidden");
                modal.classList.remove("flex");
            }, 3000);
        } else {
            const errorData = await response.json();
            alert(
                errorData.message || "Registration failed. Please try again."
            );
        }
    } catch {
        alert("Network error. Please try again later.");
    }
}

async function loginUser() {
    const userEmail = emailInput.value;
    const userPassword = passwordInput.value;

    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: {
                "Content-type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ userEmail, userPassword }),
        });

        const data = await response.json();

        if (response.ok) {
            if (data.redirectTo) {
                window.location.href = data.redirectTo;
            } else {
                localStorage.setItem("username", data.username);
                document.getElementById("registrationForm").reset();
                window.location.href = `/dashboard/${data.username}`;
            }
        } else {
            if (data.error === "unverified_email") {
                alert(data.message);
            } else {
                const errorEl = document.getElementById("login-error");
                errorEl.classList.remove("opacity-0");
                errorEl.classList.add("opacity-100");

                setTimeout(() => {
                    errorEl.classList.remove("opacity-100");
                    errorEl.classList.add("opacity-0");
                }, 1500);
            }
        }
    } catch {
        alert("Network error. Please try again later.");
    }
}

// google sign in

function handleCredentialResponse(response) {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get("lang") || "en";

    fetch("/auth/google-login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken: response.credential, lang }),
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                if (data.needsProfileCompletion && data.redirectTo) {
                    window.location.href = data.redirectTo;
                } else {
                    localStorage.setItem("username", data.user.username);
                    window.location.href = `/dashboard/${data.user.username}`;
                }
            } else {
                if (data.error === "EMAIL_ALREADY_EXISTS") {
                    alert(data.message);
                } else {
                    alert("Authentication failed. Please try again.");
                }
            }
        })
        .catch(() => {
            alert("Error during Google login. Please try again later.");
        });
}

window.onload = function () {
    if (typeof google !== "undefined" && google.accounts) {
        google.accounts.id.initialize({
            client_id:
                "706006966723-3qafmigciao7oo5vguvhks4353i6cvhq.apps.googleusercontent.com",
            callback: handleCredentialResponse,
        });

        google.accounts.id.renderButton(document.getElementById("buttonDiv"), {
            theme: "outline",
            size: "large",
        });
    } else {
        alert("Error loading Google Login. Please reload the page.");
    }
};
