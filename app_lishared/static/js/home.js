document.addEventListener('DOMContentLoaded', function() {
    const createListBtn = document.getElementById('createListBtn');
    const createListModal = document.getElementById('createListModal');
    const logoutModal = document.getElementById('logoutModal');
    const closeBtn = document.getElementsByClassName('close')[0];
    const createListForm = document.getElementById('createListForm');
    const listaCompras = document.getElementById('listaCompras');
    const logoutBtn = document.getElementById('logoutBtn');

    createListBtn.onclick = function() {
        createListModal.style.display = "block";
    }

    closeBtn.onclick = function() {
        createListModal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == createListModal) {
            createListModal.style.display = "none";
        }
    }

    createListForm.onsubmit = function(e) {
        e.preventDefault();
        const listName = document.getElementById('listName').value;
        createNewList(listName);
        createListModal.style.display = "none";
        createListForm.reset();
    }

    function createNewList(name) {
        const listItem = document.createElement('div');
        listItem.className = 'lista-item';
        listItem.innerHTML = `
            <h3>${name}</h3>
            <p>Criada em: ${new Date().toLocaleDateString()}</p>
            <button onclick="editList('${name}')">Editar</button>
            <button onclick="deleteList('${name}')">Excluir</button>
        `;
        listaCompras.appendChild(listItem);
    }

    // Funções para editar e excluir listas (a serem implementadas no backend)
    window.editList = function(name) {
        console.log(`Editar lista: ${name}`);
        // Implementar lógica de edição
    }

    window.deleteList = function(name) {
        console.log(`Excluir lista: ${name}`);
        // Implementar lógica de exclusão
    }

    logoutBtn.onclick = function() {
        logoutModal.style.display = "block";
        setTimeout(function() {
            fetch('/logout/', {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }).then(() => {
                window.location.href = '/';
            });
        }, 500);
    }
});