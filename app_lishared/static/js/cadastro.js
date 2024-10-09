document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registerForm');
    const messagesDiv = document.getElementById('messages');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Clear previous messages
        messagesDiv.innerHTML = '';

        // Client-side validation
        if (password !== confirmPassword) {
            displayError('As senhas não coincidem.');
            return;
        }

        // Send form data to server
        fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displaySuccess('Cadastro realizado com sucesso! Aguarde que será redirecionado para tela de login');
                form.reset();
                setTimeout(() => {
                    window.location.href = '/login/'; // Adjust this URL to match your login page URL
                }, 2000);
            } else if (data.errors) {
                Object.values(data.errors).forEach(error => {
                    displayError(error);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            displayError('Ocorreu um erro. Por favor, tente novamente.');
        });
    });

    function displayError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        messagesDiv.appendChild(errorDiv);
    }

    function displaySuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.textContent = message;
        messagesDiv.appendChild(successDiv);
    }
});