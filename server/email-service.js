const nodemailer = require('nodemailer');

// Funzione per inviare l'email
const sendWelcomeEmail = async (userEmail, userName ) => {
    // Configurazione del trasportatore per Gmail (può essere anche un altro provider)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'samuelesala9999@gmail.com', // Sostituisci con il tuo indirizzo email
            pass: 'ivwz spph hpfb orob', // Sostituisci con la tua password o una password specifica per app
        }
    });

    // Opzioni per l'email
    const mailOptions = {
        from: 'samuelesala9999@gmail.com',
        to: userEmail, // L'email dell'utente che si è appena registrato
        subject: 'Benvenuto nella nostra piattaforma!',
        text: `Ciao ${userName},\n\nGrazie per esserti registrato. Il tuo nome utente è: ${userName}\n\nSiamo felici di averti con noi!`
    };

    // Invia l'email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email inviata:', info.response);
    } catch (error) {
        console.error('Errore nell\'invio dell\'email:', error);
    }
};

module.exports = { sendWelcomeEmail };
