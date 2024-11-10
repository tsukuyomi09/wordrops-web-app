const currentUrl = window.location.href
console.log(`current: ${currentUrl}`)

function verifyUser(currentUrl) {

    fetch("http://127.0.0.1:3000/verifyuser", {
        method: "GET",
        credentials: "include"
    })
    .then(response => {
        if (response.ok) {
            // Se la risposta è ok e l'utente è sulla pagina di registrazione, lo mandiamo alla main
            if (currentUrl.includes("register.html")) {
                window.location.href = '/public/main.html';
            }
        } else {
            // Se la risposta non è ok e l'utente non è già sulla pagina di registrazione
            if (!currentUrl.includes("register.html")) {
                window.location.href = '/public/register.html';
            }
        }
    })
    .catch(error => {
        console.error('Errore nel verifyuser:', error);
    })
};

verifyUser(currentUrl);
 