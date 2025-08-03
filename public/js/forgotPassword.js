async function sendResetLink() {
    const emailInput = document.getElementById("email");
    const messageBox = document.getElementById("message-box");
    const button = document.getElementById("sendResetButton");
    const userEmail = emailInput.value.trim();

    if (!userEmail || !/^\S+@\S+\.\S+$/.test(userEmail)) {
        showMessage("Please enter a valid email");
        return;
    }

    button.disabled = true;
    button.textContent = "Sending...";

    try {
        const res = await fetch("/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userEmail }),
        });

        const data = await res.json();

        if (res.ok) {
            showMessage(
                "Check your email inbox, follow the link, and reset your password",
                "green"
            );
        } else {
            showMessage(data.message || "Something went wrong");
        }
    } catch (err) {
        showMessage("Server error. Try again later.");
    }

    button.disabled = false;
    button.textContent = "SEND RESET LINK";
}

function showMessage(msg, color = "red") {
    const box = document.getElementById("message-box");
    box.textContent = msg;
    box.className = `mt-8 text-${color}-400 font-semibold text-center transition-opacity duration-600 opacity-100`;

    setTimeout(() => {
        box.classList.replace("opacity-100", "opacity-0");
    }, 3000);
}
