document.addEventListener("DOMContentLoaded", function () {
    startPing(60000);
});

function startPing(intervalMs = 60000) {
    async function ping() {
        try {
            const res = await fetch("/profile/user-last-seen", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) throw new Error("Errore ping");
        } catch (err) {
            console.error("Ping fallito", err);
        }
    }

    ping(); // ping iniziale subito
    setInterval(ping, intervalMs);
}

// button functionalities
const betaForm = document.getElementById("beta-form");

function openBetaForm() {
    betaForm.classList.remove("hidden");
    betaForm.classList.add("flex");
    document.body.style.overflow = "hidden";
}

function closeBetaForm() {
    betaForm.classList.add("hidden");
    betaForm.classList.remove("flex");
    document.body.style.overflow = "";
}

const revealElements = document.querySelectorAll(".reveal-on-scroll");

const revealOnScroll = () => {
    revealElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;

        if (isVisible) {
            element.classList.add("opacity-100", "-translate-y-10");
        }
    });
};

window.addEventListener("scroll", revealOnScroll);
revealOnScroll();

const number1 = document.getElementById("number-1");
const number4 = document.getElementById("number-4");

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                number4.classList.add("tilt-right");
                number1.classList.add("tilt-left");
            } else {
                number4.classList.remove("tilt-right");
                number1.classList.remove("tilt-left");
            }
        });
    },
    { threshold: 0.5 }
);

observer.observe(number1);
observer.observe(number4);

const revealRightElement = document.getElementById("top-container");
const revealLeftElement = document.getElementById("bottom-container");

const observerReveal = new IntersectionObserver(
    (entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("reveal-visible");
                observer.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.2 }
);

observerReveal.observe(revealRightElement);
observerReveal.observe(revealLeftElement);

document
    .getElementById("waiting-list-form")
    .addEventListener("submit", async (e) => {
        e.preventDefault();

        const waitingListName = document.getElementById("name").value;
        const waitingListEmail = document.getElementById("email").value;
        const waitingListpreferences =
            document.getElementById("preferences").value;
        const waitingListGender = document.getElementById("gender").value;
        const waitingListAge = document.getElementById("age_range").value;

        try {
            const response = await fetch("/onboarding/waiting-list", {
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    waitingListName,
                    waitingListEmail,
                    waitingListpreferences,
                    waitingListGender,
                    waitingListAge,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.code === "DUPLICATE_EMAIL") {
                    showPopupMessage(errorData.message);
                } else {
                    showPopupMessage(
                        errorData.message || "Qualcosa è andato storto."
                    );
                }
                return;
            }

            // Se la risposta è OK
            document.getElementById("waiting-list-form").reset();
            showPopupMessage("Grazie mille, a breve riceverai un'email");
            closeBetaForm();
        } catch (error) {
            console.error("Errore durante la registrazione:", error);
            showPopupMessage(
                "Impossibile connettersi al server. Controlla la tua connessione."
            );
        }
    });

const showPopupMessage = (message) => {
    const popup = document.getElementById("popup-beta-tester");
    const popupText = document.getElementById("popup-beta-tester-text");
    popupText.textContent = message;
    popup.classList.remove("hidden");

    setTimeout(() => {
        popup.classList.add("hidden");
        popupText.textContent = "";
    }, 3000);
};
