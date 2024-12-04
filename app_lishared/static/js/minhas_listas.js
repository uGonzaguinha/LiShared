// minhas_listas.js

// Função para obter o cookie CSRF
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [key, value] = cookie.trim().split('=');
            if (key === name) {
                cookieValue = decodeURIComponent(value);
                break;
            }
        }
    }
    return cookieValue;
}

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const botaoCriarLista = document.getElementById('botaoCriarLista');
    const modalCriarLista = document.getElementById('modalCriarLista');
    const modalEditarLista = document.getElementById('modalEditarLista');
    const modalVisualizarLista = document.getElementById('modalVisualizarLista');
    const botoesFechar = document.getElementsByClassName('fechar');
    let currentListId = null;

    // Função para abrir modal
    function abrirModal(modal) {
        if (modal) {
            modal.style.display = "block";
        }
    }

    // Função para fechar modais
    function fecharModais() {
        const modais = document.querySelectorAll('.modal');
        modais.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // Event listeners para fechar modais
    Array.from(botoesFechar).forEach(btn => {
        btn.addEventListener('click', fecharModais);
    });

    // Funções de manipulação de listas
    window.editarLista = function(listaId) {
        currentListId = listaId;
        const modalEditarLista = document.getElementById('modalEditarLista');
        
        fetch(`/get_shopping_list/${listaId}/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar lista');
                }
                return response.json();
            })
            .then(data => {
                if (data.success && data.lista) {
                    const editListaNome = document.getElementById('editListaNome');
                    const tbody = document.querySelector('#editListaItens tbody');
                    
                    if (!editListaNome || !tbody) {
                        console.error('Elementos do modal não encontrados');
                        return;
                    }

                    editListaNome.value = data.lista.name;
                    tbody.innerHTML = '';
                    
                    if (data.lista.items && data.lista.items.length > 0) {
                        data.lista.items.forEach(item => {
                            const tr = document.createElement('tr');
                            tr.setAttribute('data-item-id', item.id);
                            tr.innerHTML = `
                                <td>
                                    <input type="text" class="item-nome" value="${item.name}" required>
                                </td>
                                <td>
                                    <input type="number" class="item-quantidade" value="${item.quantity}" min="1" required>
                                </td>
                                <td>
                                    <input type="checkbox" class="item-comprado" ${item.is_purchased ? 'checked' : ''}>
                                </td>
                                <td>
                                    <button onclick="this.closest('tr').remove()" class="btn btn-danger">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            `;
                            tbody.appendChild(tr);
                        });
                    }
                    
                    modalEditarLista.style.display = "block";
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao carregar lista');
            });
    };

    window.visualizarLista = function(listaId) {
        currentListId = listaId;
        
        fetch(`/get_shopping_list/${listaId}/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar lista');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    const tbody = document.querySelector('#tabelaItens tbody');
                    tbody.innerHTML = '';
                    
                    data.lista.items.forEach(item => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>${item.is_purchased ? 'Comprado' : 'Pendente'}</td>
                            <td>
                                <button onclick="editarItem(${item.id})" class="btn btn-primary">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="removerItem(${item.id})" class="btn btn-danger">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        `;
                        tbody.appendChild(tr);
                    });
                    
                    abrirModal(modalVisualizarLista);
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao carregar lista');
            });
    };

    // Formulário de criar lista
    const formularioCriarLista = document.getElementById('formularioCriarLista');
    if (formularioCriarLista) {
        formularioCriarLista.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            
            fetch('/create_shopping_list/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(Object.fromEntries(formData))
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload();
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao criar lista');
            });
        });
    }
});