document.getElementById("registrationForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const userEmail = document.getElementById("regEmail").value;
    const userPassword = document.getElementById("regPassword").value;
    const userName = document.getElementById("regUserName").value;

    console.log(`email: ${userEmail}`)
    console.log(`password: ${userPassword}`)

    try{
        const response = await fetch("http://127.0.0.1:3000/register", {
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

    try{
        const response = await fetch("http://127.0.0.1:3000/login", {
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({loginUserName, loginPassword})
        });

        if (response.ok) {
            const data = await response.json()
            alert(data.message);
            document.getElementById('loginForm').reset();
            console.log(data.redirectUrl)
            if (data.redirectUrl && data.user_id) {
                sessionStorage.setItem('user_id', data.user_id);
                setTimeout(() => {
                    window.location.href = data.redirectUrl;
                }, 1000);
            }
        } else {
            const errorData = await response.json();
            alert(`Errore: ${errorData.message}`);
        }

    } catch (error){
        alert(`Si è verificato un errore durante il login: ${error}`);
    }
})