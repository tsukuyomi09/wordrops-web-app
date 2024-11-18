
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
    fetch("http://127.0.0.1:3000/item",{
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

        // Popola i dati
        newItem.querySelector(".new-p").textContent = item.item; // Aggiungi il testo dell'item
        const removeButton = newItem.querySelector(".remove-button")
        removeButton.setAttribute("data-id", item.id);
        // Aggiungi il nuovo nodo al contenitore principale
        contentWrapper.appendChild(newItem);
    });
}

function submitText(event){

    event.preventDefault();
    const newItemValue = formInput.value

    if (!newItemValue) {
        const errorMessage = document.querySelector(".error-message-div");
        errorMessage.style.display = "block";
        setTimeout( () => {
            errorMessage.style.display = "none";
        }, 2000)
        return;
    }

    // richiesta fetch
    fetch("http://127.0.0.1:3000/item", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ item: newItemValue }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        formInput.value = ""
        fetchdashboardData()

    })
    .catch(error => {
        console.error("Errore durante l'invio:", error);
    });
}

function removeItem(event){

    event.preventDefault();
    const thisButton = event.target
    const parentDiv = thisButton.closest('.item-container');

    const itemId = thisButton.getAttribute("data-id")
    console.log(itemId)
    fetch(`http://127.0.0.1:3000/item/${itemId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log("Item removed:", data);
        fetchdashboardData()

    })
    .catch(error => {
        console.error("Errore durante l'invio:", error);
    });

}

function joinQueue() {
    fetch("http://127.0.0.1:3000/gamequeue", {
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









