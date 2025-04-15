// button functionalities
const betaForm = document.getElementById("beta-form");
const registerButton = document.getElementById("registerButton");

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

registerButton.addEventListener("mouseover", function () {
    registerButton.textContent = "Presto disponibile"; // Cambia il testo su hover
});

registerButton.addEventListener("mouseout", function () {
    registerButton.textContent = "REGISTRATI"; // Torna al testo originale quando il mouse esce
});

// text animation

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

// numbers animation

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

// game mode  animation

const revealRightElement = document.getElementById("top-container");
const revealLeftElement = document.getElementById("bottom-container");

// Creiamo un osservatore con un nome diverso per evitare conflitti
const observerReveal = new IntersectionObserver(
    (entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                // Se l'elemento è visibile, aggiungi la classe per farlo rivelare
                entry.target.classList.add("reveal-visible");

                // Fermiamo l'osservazione per evitare che venga eseguito più volte
                observer.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.2 }
); // Considera l'elemento come visibile quando almeno il 50% è visibile

// Osserviamo entrambi i div
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
            const response = await fetch("/waiting-list", {
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

            if (response.ok) {
                document.getElementById("waiting-list-form").reset();
                alert("Grazie.. ti avviseremo al piu presto!");
            } else {
                alert("Qualcosa é andato storto");
            }
        } catch (error) {
            console.error("Errore durante la registrazione:", error);
        }
    });
