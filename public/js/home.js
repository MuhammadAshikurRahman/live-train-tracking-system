document.getElementById('logoutBtn').addEventListener('click', async function() {
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            window.location.href = '/'; // Redirect to login page after logout
        } else {
            const result = await response.json();
            Toastify({
                text: result.message || 'Logout failed!',
                duration: 3000,
                gravity: "top",
                position: "right",
                stopOnFocus: true
            }).showToast();
        }
    } catch (error) {
        console.error('Logout error:', error);
        Toastify({
            text: 'Logout failed!',
            duration: 3000,
            gravity: "top",
            position: "right",
            stopOnFocus: true
        }).showToast();
    }
});