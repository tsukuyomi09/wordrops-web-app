// 1. Al caricamento della pagina:
//    - Controlla se esiste lo "status" nel session storage:
//      - Se sì:
//        - Se lo status è "in_game":
//          - Controlla se esiste il "gameId" nel session storage:
//            - Se sì, connettiti alla partita usando il gameId.
//            - Altrimenti, recupera il gameId dal server e connettiti.
//        - Se lo status non è "in_game", termina.
//      - Se no:
//        - Recupera lo status dal server e salvalo nel session storage.
//        - Se lo status è "in_game", recupera il gameId dal server e connettiti.
//        - Altrimenti, termina.

// 2. Funzione per connettersi alla partita:
//    - Usa il gameId per stabilire la connessione WebSocket.
//    - Implementa logica di connessione.

// 3. Funzione per recuperare dati dal server:
//    - Recupera lo "status" o il "gameId" tramite una fetch API al backend.
//    - Gestisci eventuali errori.