document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registerForm');
    const messagesDiv = document.getElementById('messages');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);

        fetch('/cadastro/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            }
        })
        .then(response => response.json())
        .then(data => {
            messagesDiv.innerHTML = '';

            if (data.success) {
                const successDiv = document.createElement('div');
                successDiv.className = 'success';
                successDiv.textContent = data.message;
                messagesDiv.appendChild(successDiv);

                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 1500);
            } else if (data.errors) {
                Object.values(data.errors).forEach(error => {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error';
                    errorDiv.textContent = error;
                    messagesDiv.appendChild(errorDiv);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = 'Ocorreu um erro. Por favor, tente novamente.';
            messagesDiv.appendChild(errorDiv);
        });
    });
});