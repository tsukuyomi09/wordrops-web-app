async function submitNewPassword() {
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const messageBox = document.getElementById("message-box");

    console.log(newPassword);
    console.log(confirmPassword);

    if (!newPassword || newPassword.length < 6) {
        messageBox.textContent = "Password must be at least 6 characters";
        messageBox.style.opacity = 1;
        return;
    }

    if (newPassword !== confirmPassword) {
        messageBox.textContent = "Passwords do not match";
        messageBox.style.opacity = 1;
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
        messageBox.textContent = "Invalid or missing token.";
        messageBox.style.opacity = 1;
        return;
    }

    try {
        const res = await fetch("/auth/reset-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ token, newPassword }),
        });

        const data = await res.json();

        if (res.ok) {
            messageBox.style.color = "green";
            messageBox.textContent =
                "Password reset successfully. You can now log in.";
            setTimeout(() => {
                window.location.href = "/register";
            }, 2000);
        } else {
            messageBox.textContent =
                data.message || "Error resetting password.";
        }
    } catch (err) {
        console.error(err);
        messageBox.textContent = "Something went wrong. Try again later.";
    }

    messageBox.style.opacity = 1;
}
