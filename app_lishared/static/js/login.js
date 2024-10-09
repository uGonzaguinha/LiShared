document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const messagesDiv = document.getElementById('messages');

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(loginForm);

        fetch(loginForm.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            // Clear previous messages
            messagesDiv.innerHTML = '';

            // Create message element
            const messageElement = document.createElement('div');
            messageElement.textContent = data.message;
            messageElement.className = data.success ? 'success' : 'error';

            // Add message to the messages div
            messagesDiv.appendChild(messageElement);

            if (data.success) {
                // Redirect after 2 seconds on success
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 2000);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Display a generic error message
            const errorElement = document.createElement('div');
            errorElement.textContent = 'Ocorreu um erro. Por favor, tente novamente.';
            errorElement.className = 'error';
            messagesDiv.appendChild(errorElement);
        });
    });
});