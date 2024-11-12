
const formInput = document.getElementById("p-input");
const contentWrapper = document.getElementById("content-wrapper");
const newItemContainer = document.querySelector(".new-item-container");

document.addEventListener("DOMContentLoaded", () => {
    checkQueueStatus()
});


function checkQueueStatus() {
    fetch("http://127.0.0.1:3000/queue", {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.inQueue) {
            // L'utente è già in coda
            setButton("Abbandona", "DELETE");
        } else {
            // L'utente non è in coda
            setButton("Nuova Partita", "POST");
        }
    })
    .catch(error => {
        console.error('Errore nel verificare lo stato della coda:', error);
    });
    };


function fetchItems() {
    fetch("http://127.0.0.1:3000/items",{
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
        displayItems(data); // Mostra gli elementi ricevuti
    })
    .catch(error => {
        console.error("Errore durante il recupero degli elementi:", error);
        console.log("Response status:", error.response ? error.response.status : "nessuna risposta");
    });

}

fetchItems();


function displayItems(items) {

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
    fetch("http://127.0.0.1:3000/items", {
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
        fetchItems()

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
    
    fetch(`http://127.0.0.1:3000/items/${itemId}`, {
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
        fetchItems()

    })
    .catch(error => {
        console.error("Errore durante l'invio:", error);
    });

}

function toggleQueue(method) {
    fetch("http://127.0.0.1:3000/queue", {
        method: method,  // Usa il metodo passato (POST o DELETE)
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',  // Includi i cookie di sessione // Passa l'azione di toggle
    })
    .then(response => response.json())  // Converte la risposta in JSON
    .then(data => {
        if (data.success) {
            // Se l'utente è stato aggiunto o rimosso con successo
            alert(method === "POST" ? "Sei stato messo in coda!" : "Sei stato rimosso dalla coda.");
            checkQueueStatus();  // Ricarica lo stato del pulsante
        } else {
            alert("Errore nell'aggiornare lo stato della coda.");
        }
    })
    .catch(error => console.error('Errore nella richiesta:', error));
}

function setButton(buttonText, method) {
    const queueButton = document.getElementById("queue-button");
    queueButton.textContent = buttonText;  // Cambia il testo del pulsante
    queueButton.onclick = function() {
        toggleQueue(method);  // Imposta l'azione corretta al clic
    };
}



