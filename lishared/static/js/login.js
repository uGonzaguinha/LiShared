document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const messagesDiv = document.getElementById('messages');

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(loginForm);

        fetch('/login/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            messagesDiv.innerHTML = '';
            const messageElement = document.createElement('div');
            messageElement.textContent = data.message;
            messageElement.className = data.success ? 'success' : 'error';
            messagesDiv.appendChild(messageElement);

            if (data.success) {
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 1500);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            const errorElement = document.createElement('div');
            errorElement.textContent = 'Ocorreu um erro. Por favor, tente novamente.';
            errorElement.className = 'error';
            messagesDiv.appendChild(errorElement);
        });
    });
});