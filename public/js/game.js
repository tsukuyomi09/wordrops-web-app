// Lato client
async function getGamePlayers () {
    const gameId = window.location.pathname.split('/').pop();  // Ottieni gameId dall'URL
    const response = await fetch(`/game/${gameId}/players`);

    if (!response.ok) {
        console.error("Errore nel recupero dei giocatori");
        return;
    }
 
    const players = await response.json();
    const currentUser = { username: localStorage.getItem('username') };

    // Aggiungi i giocatori al DOM
    const playersList = document.getElementById('players-list');
    players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('player', 'flex', 'flex-col', 'items-center', 'text-center');

        // Verifica se l'avatar esiste nel localStorage o nel database
        const avatarSrc = player.avatar ? `/images/avatars/${player.avatar}.png` : '/images/avatars/default-avatar.png';

        const isCurrentUser = player.username === currentUser.username;

        playerDiv.innerHTML = `
        <div class="flex items-center justify-center w-12 h-12 bg-white rounded-full">
            <img src="${avatarSrc}" alt="${player.username}'s avatar" class="w-8 h-8 " />
        </div>
        <span class="text-sm font-medium ${isCurrentUser ? 'text-green-600' : 'text-gray-700'}">${player.username}</span>`;
        
        playersList.appendChild(playerDiv);
    });
};

getGamePlayers();


