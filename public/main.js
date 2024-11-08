const formInput = document.getElementById("p-input");
const contentWrapper = document.getElementById("content-wrapper");
const newItemContainer = document.querySelector(".new-item-container");
let user_id = null;

window.addEventListener("DOMContentLoaded", function () {
    user_id = sessionStorage.getItem("user_id"); 
    console.log(`addEventListener: ${user_id}`)
    if (user_id) {
        document.getElementById("pagewrap").classList.remove("hidden");
        fetchItems()
    } else {
        window.location.href = "./register.html"; 
        return // Reindirizza se non autenticato
    }
});


function fetchItems() {
    fetch("http://127.0.0.1:3000/items",{
        method: "GET",  // Metodo GET per ottenere gli item
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user_id}`  // Aggiungi l'ID come header Authorization
        }
        
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
    });
}

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
            "Authorization": `Bearer ${user_id}`  // Aggiungi l'ID come header Authorization
        },
        // credentials: 'include',
        body: JSON.stringify({ item: newItemValue }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log("Elemento aggiunto:", data);
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
            "Authorization": `Bearer ${user_id}`  // Aggiungi l'ID come header Authorization
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



