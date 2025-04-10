async function registerUser() {
    const userEmail = document.getElementById("email").value;
    const userPassword = document.getElementById("password").value;

    try {
        const response = await fetch("/register", {
            method: "POST",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify({ userEmail, userPassword }),
        });

        if (response.ok) {
            const data = await response.json();
            alert("You are now registered");
            document.getElementById("registrationForm").reset();
        } else {
            const errorData = await response.json();
            alert(`Errore: ${errorData.message}`);
        }
    } catch (error) {
        console.error("Errore:", error);
        alert("Si è verificato un errore durante la registrazione.");
    }
}

async function loginUser() {
    const userEmail = document.getElementById("email").value;
    const userPassword = document.getElementById("password").value;

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ userEmail, userPassword }),
        });

        const data = await response.json(); // Parsing della risposta JSON

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
                alert("Credenziali errate");
            }
        }
    } catch (error) {
        console.error("Errore durante il login:", error);
    }
}

// google sign in

function handleCredentialResponse(response) {
    fetch("/google-login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken: response.credential }),
    })
        .then((res) => res.json())
        .then((data) => {
            console.log("Risposta dal server:", data);
            if (data.success) {
                if (data.needsProfileCompletion && data.redirectTo) {
                    window.location.href = data.redirectTo;
                } else {
                    // Reindirizza alla homepage o dashboard se ha già completato il profilo
                    localStorage.setItem("username", data.user.username);
                    window.location.href = `/dashboard/${data.user.username}`;
                }
            }
        })
        .catch((error) => {
            console.error("Errore durante l'invio del token al server:", error);
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
        console.error("Google API non caricato correttamente.");
    }
};
