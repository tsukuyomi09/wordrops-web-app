let debounceTimer;
const resultsDiv = document.getElementById('results');

document.getElementById('search-input').addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = document.getElementById('search-input').value;

    if (query.length >= 3) { // Aspetta almeno 3 caratteri
        debounceTimer = setTimeout(() => searchUsers(query), 300); // Attendi 300ms
    } else {
        document.getElementById('results').innerHTML = ''; // Svuota risultati
    }
});


async function searchUsers(query) {
    try {
        const response = await fetch(`/search-users?username=${encodeURIComponent(query)}`);
        const users = await response.json();

        if (users.length === 0) {
            resultsDiv.innerHTML = '<p>Nessun utente trovato.</p>';
        } else {
            resultsDiv.innerHTML = users.map(user =>
                `<div 
                    class="user flex bg-gray-200 mb-4 w-full items-center space-x-4 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-all"
                    data-username="${user.username}" 
                    data-avatar="${user.avatar}">
                    <div class="flex w-full items-center space-x-3 justify-start">
                        <!-- Avatar -->
                        <img src="/images/avatars/${user.avatar}.png" alt="${user.username} Avatar" class="w-8 h-8 rounded-full border-2 border-orange-400">
                        <!-- Username -->
                        <strong class="text-lg font-bold text-gray-800">${user.username}</strong>
                    </div>
                </div>`
            ).join('');
        }
    } catch (error) {
        resultsDiv.innerHTML = '<p>Errore durante la ricerca.</p>';
        console.error(error);
    }
}

resultsDiv.addEventListener('click', event => {
    const userElement = event.target.closest('.user'); // Trova l'elemento cliccato
    if (userElement) {
        const username = userElement.getAttribute('data-username');
        window.location.href = `/profile/${username}`;
    }
});



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
            document.getElementById("main-avatar").src = `/images/avatars/${data.avatar}.png` || "/images/avatars/luffy-icon-chibi.png";
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

function dashboardButton(){
    const username = localStorage.getItem('username');
    window.location.href = `/dashboard/${username}`;

}
