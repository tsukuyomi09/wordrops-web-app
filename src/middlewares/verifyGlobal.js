const GLOBAL_SECRET = process.env.GLOBAL_SECRET

function verifyToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];  // Prendi il token dalla header
  
    if (!token) {
        return res.redirect('/password');
    }
  
    jwt.verify(token, GLOBAL_SECRET, (err, decoded) => {
      if (err) {
        return res.redirect('/password');
      }
      req.user = decoded;  // Aggiungi i dati decodificati alla richiesta
      next();
    });
  }


  module.exports = verifyToken;
