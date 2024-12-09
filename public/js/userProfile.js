
function getUserData(){
    const username = window.location.pathname.split('/')[2]
    if (username) {
    
        fetch(`/userProfileData/${username}`, {
            method: "GET",  // Metodo GET per ottenere gli item
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include"
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Errore nella rete");
            }
            return response.json();
        })
        .then(data => {
            displayUserItems(data); // Mostra gli elementi ricevuti
        })
        .catch(error => {
            console.error("Errore durante il recupero degli elementi:", error);
            console.log("Response status:", error.response ? error.response.status : "nessuna risposta");
        });
    }
    
    function displayUserItems(data) {
        if (data) {
            document.getElementById("username").textContent = data.username || "Nome utente non disponibile";
            document.getElementById("main-avatar").src = `/images/avatars/${data.avatar}.png`;
            document.getElementById("chapters-written").textContent = data.capitoli_scritti || 0;
            document.getElementById("user-score").textContent = data.punteggio || 0;
        }
    }
}

getUserData()

function showAvatarTransition() {
    const avatarContainer = document.querySelector('.avatar-container');
    setTimeout(() => {
        avatarContainer.classList.add('show');
    }, 50); // Ritardo per la transizione
}

showAvatarTransition()