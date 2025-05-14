/// MENU TOGGLE CHAPTERS AND AUTHORS ///

const btnAutori = document.getElementById("btnAutori");
const dropAutori = document.getElementById("dropupAutori");
const btnCapitoli = document.getElementById("btnCapitoli");
const dropCapitoli = document.getElementById("dropupCapitoli");

function authorsDropup() {
    btnAutori.classList.toggle("text-custom-blue");
    btnAutori.classList.toggle("text-gray-800");
    btnCapitoli.classList.remove("text-custom-blue");
    btnCapitoli.classList.add("text-gray-800");
    dropAutori.classList.toggle("hidden");
    dropCapitoli.classList.add("hidden");
}

function chaptersDropup() {
    btnCapitoli.classList.toggle("text-custom-blue");
    btnCapitoli.classList.toggle("text-gray-800");
    btnAutori.classList.remove("text-custom-blue");
    btnAutori.classList.add("text-gray-800");
    dropCapitoli.classList.toggle("hidden");
    dropAutori.classList.add("hidden");
}

/// MENU TOGGLE CHAPTERS AND AUTHORS ///
