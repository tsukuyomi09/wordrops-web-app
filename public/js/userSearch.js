let debounceTimer;

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
    const resultsDiv = document.getElementById('results');

    try {
        const response = await fetch(`/search-users?username=${encodeURIComponent(query)}`);
        const users = await response.json();

        if (users.length === 0) {
            resultsDiv.innerHTML = '<p>Nessun utente trovato.</p>';
        } else {
            resultsDiv.innerHTML = users.map(user =>
                `<div class="user flex bg-gray-200 w-full items-center space-x-4 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-all">
                    <!-- Il contenitore cliccabile che occupa tutta la larghezza -->
                    <div class="flex w-full items-center space-x-3 justify-start">
                        <!-- Avatar -->
                        <img src="/images/avatars/${user.avatar}.png" alt="Avatar" class="w-6 h-6 rounded-full border-4 border-orange-400	">
                        <!-- Username -->
                        <strong class="text-mg font-nold text-gray-800">${user.username}</strong>
                    </div>
                </div>`
            ).join('');
        }
    } catch (error) {
        resultsDiv.innerHTML = '<p>Errore durante la ricerca.</p>';
        console.error(error);
    }
}
