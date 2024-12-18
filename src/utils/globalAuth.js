const jwt = require('jsonwebtoken');
const GLOBAL_PASSWORD = process.env.GLOBAL_PASSWORD; // La password che deve essere inserita
const GLOBAL_SECRET = process.env.GLOBAL_SECRET; // La chiave per firmare il token

// Questa è la route che gestisce la login
app.post('/password', (req, res) => {
  const { password } = req.body;

  // Controlla se la password è corretta
  if (password === GLOBAL_PASSWORD) {
    // Se la password è corretta, genera un token JWT
    const token = jwt.sign({ user: 'admin' }, GLOBAL_SECRET, { expiresIn: '5h' });

    // Invia il token come cookie al client (o nell'header, se preferisci)
    res.cookie('token', token, { httpOnly: true });  // Questo rende il cookie sicuro (non accessibile tramite JS)

    // Ora redirigi alla pagina protetta
    return res.redirect('/dashboard');
  }

  // Se la password è errata, torna alla pagina di login
  res.redirect('/password');
});


module.exports = {
    globalGenerateToken,
    globalSetAuthCookie,
    globalAuthenticateUser
};
