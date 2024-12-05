// Lato client
window.onload = async function() {
    const gameId = window.location.pathname.split('/').pop();  // Ottieni gameId dall'URL
    const response = await fetch(`/game/${gameId}/players`);
    const players = await response.json();
    const currentUser = { username: localStorage.getItem('username') };

    // Aggiungi i giocatori al DOM
    const playersList = document.getElementById('players-list');
    players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('player', 'flex', 'flex-col', 'items-center', 'text-center');

        const isCurrentUser = player.username === currentUser.username;

        playerDiv.innerHTML = `
            <img src="/images/avatars/${player.avatar}.png" alt="${player.username}'s avatar" class="avatar w-10 h-12 mb-2" />
            <span class="text-lg font-medium ${isCurrentUser ? 'text-green-500' : 'text-gray-700'}">${player.username}</span>
        `;
        document.getElementById('players-list').appendChild(playerDiv);
    });
};
