async function registerUser() {
    const userEmail = document.getElementById("email").value;
    const userPassword = document.getElementById("password").value;

    try {
        const response = await fetch("/auth/register", {
            method: "POST",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify({ userEmail, userPassword }),
        });

        if (response.ok) {
            const data = await response.json();
            const modal = document.getElementById("registration-modal");
            modal.classList.remove("hidden");
            modal.classList.add("flex");

            setTimeout(() => {
                modal.classList.add("hidden");
                modal.classList.remove("flex");
            }, 5000);
        } else {
            const errorData = await response.json();
            alert(errorData.message || "Registrazione fallita. Riprova.");
        }
    } catch {
        alert("Errore di rete. Riprova più tardi.");
    }
}

async function loginUser() {
    const userEmail = document.getElementById("email").value;
    const userPassword = document.getElementById("password").value;

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
        alert("Errore di rete. Riprova più tardi.");
    }
}

// google sign in

function handleCredentialResponse(response) {
    fetch("/auth/google-login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken: response.credential }),
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
                    alert("Autenticazione fallita. Riprova.");
                }
            }
        })
        .catch(() => {
            alert("Errore durante il login con Google. Riprova più tardi.");
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
        alert("Errore nel caricamento di Google Login. Ricarica la pagina.");
    }
};
