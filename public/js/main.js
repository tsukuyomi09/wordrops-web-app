
const formInput = document.getElementById("p-input");
const contentWrapper = document.getElementById("content-wrapper");
const newItemContainer = document.querySelector(".new-item-container");
const usernameDashboard = document.getElementById("username");

async function checkSessionStatus() {
    try {
        const response = await fetch('/check-session', {
            method: 'GET',  // Usa il metodo GET per inviare la richiesta
            credentials: 'same-origin' // Invia i cookie con la richiesta
        });

        const data = await response.json();

        if (data.sessionActive) {
            // Se la sessione è attiva, reindirizza l'utente alla pagina del dashboard
             // Cambia la destinazione in base alla tua app
        } else {
            window.location.href = '/register';
            console.log('Sessione non attiva. Permesso di registrarsi.');
        }

    } catch (error) {
        console.error('Errore durante il controllo della sessione:', error);
    }
}

// Verifica se l'utente ha una sessione attiva appena carica la pagina
checkSessionStatus();


function fetchdashboardData() {
    fetch("/item",{
        method: "GET",  // Metodo GET per ottenere gli item
        headers: {
            "Content-Type": "application/json",
             // Aggiungi l'ID come header Authorization
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

        displayItems(data.username, data.items); // Mostra gli elementi ricevuti
    })
    .catch(error => {
        console.error("Errore durante il recupero degli elementi:", error);
        console.log("Response status:", error.response ? error.response.status : "nessuna risposta");
    });

}

fetchdashboardData();


function displayItems(username, items) {

    const usernameDashboard = document.getElementById("username");
    usernameDashboard.textContent = username;

    contentWrapper.innerHTML = '';

    items.forEach(item => {
        // Clona il template
        const newItem = newItemContainer.cloneNode(true); // Clona il contenuto del template
        
        newItem.style.display = 'block';
        // Popola i dati
        newItem.querySelector(".new-p").textContent = item.item; // Aggiungi il testo dell'item
        const removeButton = newItem.querySelector(".remove-button")
        removeButton.setAttribute("data-id", item.id);
        // Aggiungi il nuovo nodo al contenitore principale
        contentWrapper.appendChild(newItem);
    });
}


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









