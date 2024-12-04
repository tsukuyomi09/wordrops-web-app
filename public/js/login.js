document.getElementById("registrationForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const userEmail = document.getElementById("regEmail").value;
    const userPassword = document.getElementById("regPassword").value;
    const userName = document.getElementById("regUserName").value;

    console.log(`email: ${userEmail}`)
    console.log(`password: ${userPassword}`)

    try{
        const response = await fetch("/register", {
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({userName, userEmail, userPassword})
        });

        if (response.ok) {
            const data = await response.json()
            alert("You are now registered");
            document.getElementById('registrationForm').reset();

        } else {
            const errorData = await response.json();
            alert(`Errore: ${errorData.message}`);
        }

    } catch (error){
        console.error('Errore:', error);
        alert('Si è verificato un errore durante la registrazione.');
    }
})


document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const loginUserName = document.getElementById("loginUserName").value;
    const loginPassword = document.getElementById("loginPassword").value;

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify({ loginUserName, loginPassword })
        });

        if (response.ok) {
            localStorage.setItem('username', loginUserName);
            document.getElementById('loginForm').reset();
            window.location.href = `/dashboard/${loginUserName}`;
        } else {
            alert('Credenziali errate');
        }
    } catch (error) {
        console.error('Errore durante il login:', error);
    }
});


