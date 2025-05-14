const btnAutori = document.getElementById("btnAutori");
const dropAutori = document.getElementById("dropupAutori");

const btnCapitoli = document.getElementById("btnCapitoli");
const dropCapitoli = document.getElementById("dropupCapitoli");

btnAutori.addEventListener("click", () => {
    dropAutori.classList.toggle("hidden");
    dropCapitoli.classList.add("hidden"); // chiude l’altro se aperto
});

btnCapitoli.addEventListener("click", () => {
    dropCapitoli.classList.toggle("hidden");
    dropAutori.classList.add("hidden");
});
