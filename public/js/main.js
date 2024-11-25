const formInput = document.getElementById("p-input");
const usernameDashboard = document.getElementById("username");


function fetchdashboardData() {
    fetch("/dashboardData",{
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
        displayItems(data.username); // Mostra gli elementi ricevuti
    })
    .catch(error => {
        console.error("Errore durante il recupero degli elementi:", error);
        console.log("Response status:", error.response ? error.response.status : "nessuna risposta");
    });

}

function displayItems(username) {
    const usernameDashboard = document.getElementById("username");
    usernameDashboard.textContent = username;

}

fetchdashboardData();


function joinQueue() {
    fetch("/gamequeue", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    })
    .then(response => response.json())
    .then(data => {
        if (data.game_id) {
            // Redirect manuale dopo aver ricevuto la risposta dal server
            const redirectUrl = `gamequeue/${data.game_id}`;
            console.log('Reindirizzamento a:', redirectUrl);  // Verifica l'URL di destinazione
            window.location.href = redirectUrl;
        } else {
            console.error('Errore: nessun game_id ricevuto');
        }
    })
    .catch(error => {
        console.error('Errore nella richiesta per unirsi alla coda:', error);
    });
}

document.getElementById('toggle-slider').addEventListener('click', () => {
    const slider = document.getElementById('avatarSlider');
    slider.classList.toggle('show');
  });


function logout(){
    fetch("/logout", {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    })
    .then(response => {
        if (response.ok) {
            window.location.href = "/"; 
        } else {
            return response.json(); 
        }
    })
    .then(errorData => {
        if (errorData && errorData.error) {
            console.error('Errore durante il logout: ', errorData.error);
        }
    })
    .catch(error => {
        console.error('Errore: Problema con il logout: ', error);
    });

}









