document.getElementById('registerForm').addEventListener('submit', function(e) {
    // Remover esta linha para permitir o envio do formulário
    // e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMessage = document.getElementById('errorMessage');

    // Reset error message
    errorMessage.textContent = '';

    // Check if passwords match
    // if (password !== confirmPassword) {
    //     errorMessage.textContent = 'As senhas não estão iguais.';
    //     return;
    // }

    // Se você quiser fazer o envio com AJAX:
    // const formData = new FormData(this);
    // fetch('/cadastro/', {
    //     method: 'POST',
    //     body: formData,
    //     headers: {
    //         'X-CSRFToken': '{{ csrf_token }}'
    //     }
    // }).then(response => {
    //     if (response.ok) {
    //         alert('Cadastro realizado com sucesso!');
    //         // Redirecionar ou fazer outra ação
    //     } else {
    //         // Lidar com erros
    //     }
    // });
});
