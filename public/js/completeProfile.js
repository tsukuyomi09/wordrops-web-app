const usernameInput = document.getElementById("username");
const confirmButton = document.getElementById("confirmButton");

function checkUsername() {
    const username = usernameInput.value; // Ottieni il valore dell'input

    const validUsernameRegex = /^[a-zA-Z0-9-_\.]+$/;

    if (
        !validUsernameRegex.test(username) ||
        username.length < 4 ||
        username.length > 16
    ) {
        confirmButton.disabled = true; // Disabilita il pulsante
        confirmButton.classList.remove("bg-blue-600");
        confirmButton.classList.add("bg-blue-400"); // Torna blu
    } else {
        confirmButton.disabled = false; // Abilita il pulsante
        confirmButton.classList.remove("bg-blue-400");
        confirmButton.classList.add("bg-blue-600"); // Cambia colore in verde
    }
}

usernameInput.addEventListener("input", checkUsername);

async function checkUsernameAndProceed() {
    const username = document.getElementById("username").value;

    if (!username) {
        alert("Per favore, inserisci un username.");
        return;
    }

    try {
        const response = await fetch(
            `/check-username?username=${encodeURIComponent(username)}`
        );
        const data = await response.json();
        usernameAvailable = data.available;

        if (usernameAvailable) {
            goToStep2(username); // se tutto ok, passo al secondo step
        } else {
            usernameErrorAnimation();
        }
    } catch (error) {
        console.error("Errore nella verifica dell'username:", error);
        alert("Si è verificato un errore. Riprova più tardi.");
    }
}

function usernameErrorAnimation() {
    const errorEl = document.getElementById("username-error");
    console.log(`parte la funzione`);

    // Mostra con opacità al 100% con una transizione
    errorEl.classList.remove("opacity-0");
    errorEl.classList.add("opacity-100");

    // Dopo 800ms torna a nascondere (300ms visibile + 500ms pausa)
    setTimeout(() => {
        errorEl.classList.remove("opacity-100");
        errorEl.classList.add("opacity-0");
    }, 2000);
}

// Step navigation
function goToStep2(username) {
    if (username) {
        // Fade-out di step1
        const step1 = document.getElementById("step1");
        step1.classList.remove("opacity-100");
        step1.classList.add("opacity-0");

        // Dopo che il fade-out è completato (500ms), nascondi step1 e mostra step2
        setTimeout(() => {
            step1.classList.add("hidden"); // Nasconde step1 completamente
            const step2 = document.getElementById("step2");
            step2.classList.remove("hidden"); // Mostra step2

            // Fade-in di step2
            step2.classList.remove("opacity-0");
            step2.classList.add("opacity-100");
        }, 1000); // Tempo per completare il fade-out di step1 (500ms)
    } else {
        alert("Per favore, inserisci un username.");
    }
}

function gobackToStep1() {
    // Fade-out di step2
    const step2 = document.getElementById("step2");
    step2.classList.remove("opacity-100");
    step2.classList.add("opacity-0");

    // Dopo che il fade-out è completato (500ms), nascondi step2 e mostra step1
    setTimeout(() => {
        step2.classList.add("hidden"); // Nasconde step2 completamente
        const step1 = document.getElementById("step1");
        step1.classList.remove("hidden"); // Mostra step1

        const confirmButton = document.getElementById("confirm-profile");
        confirmButton.classList.add("hidden"); // Nasconde il pulsante
        document.querySelectorAll(".avatar").forEach((el) => {
            el.classList.remove("selected-avatar");
        });

        const chooseAvatarText = document.getElementById("choose-avatar-text");
        chooseAvatarText.classList.remove("hidden"); // Mostra il testo

        // Fade-in di step1
        step1.classList.remove("opacity-0");
        step1.classList.add("opacity-100");
    }, 500); // Tempo per completare il fade-out di step2 (500ms)
}

// Confirm profile and submit
function confirmProfile() {
    const username = document.getElementById("username").value;
    const avatarName = document.getElementById("selectedAvatar").value; // Recupera il nome dell'avatar
    if (username && avatarName) {
        finishOnboarding(username, avatarName);
    } else {
        alert("Assicurati di aver selezionato un avatar.");
    }
}

function selectAvatar(id) {
    document.querySelectorAll(".avatar").forEach((el) => {
        el.classList.remove("selected-avatar");
    });

    const confirmButton = document.getElementById("confirm-profile");
    confirmButton.classList.remove("hidden");
    confirmButton.classList.remove("opacity-0");
    confirmButton.classList.add("opacity-100");

    const chooseAvatarText = document.getElementById("choose-avatar-text");
    chooseAvatarText.classList.remove("opacity-100");
    chooseAvatarText.classList.add("opacity-0");

    const clickedImg = document.querySelector(
        `.avatar-image[onclick="selectAvatar(${id})"]`
    );

    if (clickedImg) {
        const avatarName = clickedImg.getAttribute("data-name");
        const container = clickedImg.closest(".avatar");
        if (container) container.classList.add("selected-avatar");

        // Trova il campo input nascosto e imposta il valore dell'avatar selezionato
        const selectedAvatarInput = document.getElementById("selectedAvatar");
        if (selectedAvatarInput) {
            selectedAvatarInput.value = avatarName; // Imposta il nome dell'avatar nel campo nascosto
            console.log(`Avatar selezionato: ${avatarName}`);
        } else {
            console.error("Campo 'selectedAvatar' non trovato");
        }
    }
}

async function finishOnboarding(username, avatarName) {
    try {
        const urlPath = window.location.pathname;
        const email = urlPath.split("/")[2];
        const response = await fetch(`/finish-onboarding/${email}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, avatarName }),
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("username", data.username);
            console.log("Dati ricevuti dal server:", data);
            window.location.href = `/dashboard/${data.username}`;
        } else {
            const errorData = await response.json();
            alert(
                "Errore durante il completamento dell'onboarding: " +
                    errorData.message
            );
        }
    } catch (error) {
        console.error("Errore nella fetch:", error);
        alert("Si è verificato un errore durante l'invio dei dati.");
    }
}
