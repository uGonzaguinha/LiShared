// shared_list.js

// Variáveis globais
const listElement = document.querySelector('[data-list-id]');
const listId = listElement?.dataset.listId;
const canEdit = listElement?.dataset.canEdit === 'true';

// Função auxiliar para obter o CSRF token
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

// Funções de manipulação da tabela
function addItemToTable(item) {
    const tbody = document.querySelector('#listaItens tbody');
    if (!tbody) {
        console.error('Elemento tbody não encontrado em addItemToTable.');
        return;
    }
    const tr = document.createElement('tr');
    tr.setAttribute('data-item-id', item.id);
    tr.innerHTML = createItemRow(item);

    // Adicionar com animação
    tr.style.opacity = '0';
    tbody.appendChild(tr);
    setTimeout(() => {
        tr.style.opacity = '1';
    }, 10);

    // Remover mensagem de "nenhum item" se existir
    const noItemsMessage = tbody.querySelector('.no-items');
    if (noItemsMessage) {
        noItemsMessage.remove();
    }
}

function updateItemInTable(item) {
    const tr = document.querySelector(`tr[data-item-id="${item.id}"]`);
    if (tr) {
        tr.innerHTML = createItemRow(item);
        tr.classList.add('updated');
        setTimeout(() => {
            tr.classList.remove('updated');
        }, 1500);
    } else {
        console.error('Elemento tr não encontrado em updateItemInTable.');
    }
}

function removeItemFromTable(itemId) {
    const tr = document.querySelector(`tr[data-item-id="${itemId}"]`);
    if (tr) {
        // Remover com animação
        tr.style.transition = 'all 0.3s ease';
        tr.style.opacity = '0';
        tr.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            tr.remove();

            // Verificar se a tabela está vazia
            const tbody = document.querySelector('#listaItens tbody');
            if (tbody && tbody.children.length === 0) {
                tbody.innerHTML = '<tr class="no-items"><td colspan="4">Nenhum item na lista.</td></tr>';
            }
        }, 300);
    } else {
        console.error('Elemento tr não encontrado em removeItemFromTable.');
    }
}

function createItemRow(item) {
    return `
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>
            <span class="status-badge ${item.is_purchased ? 'purchased' : ''}">
                ${item.is_purchased ? 'Comprado' : 'Pendente'}
            </span>
        </td>
        ${canEdit ? `
            <td>
                <button onclick="editarItem(${item.id})" class="btn btn-primary btn-sm">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="removerItem(${item.id})" class="btn btn-danger btn-sm">
                    <i class="fas fa-trash"></i> Remover
                </button>
            </td>
        ` : ''}
    `;
}

// Funções CRUD
if (canEdit) {
    window.adicionarItem = function() {
        const nome = document.getElementById('novoItemNome').value.trim();
        const quantidade = document.getElementById('novoItemQuantidade').value.trim();

        if (!nome || !quantidade) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        fetch(`/add_item_to_list/${listId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                name: nome,
                quantity: parseInt(quantidade)
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Resposta do adicionarItem:', data); // Log para depuração
            if (data.success) {
                addItemToTable(data.item);
                document.getElementById('modalAdicionarItem').style.display = 'none';
                document.getElementById('formAdicionarItem').reset();
            } else {
                alert(data.message || 'Erro ao adicionar item.');
            }
        })
        .catch(error => {
            console.error('Erro ao adicionar item:', error);
            alert('Erro ao adicionar item. Por favor, tente novamente.');
        });
    };

    window.editarItem = function(itemId) {
        const tr = document.querySelector(`tr[data-item-id="${itemId}"]`);
        if (!tr) {
            console.error('Elemento tr não encontrado em editarItem.');
            return;
        }
        const name = tr.cells[0].textContent.trim();
        const quantity = tr.cells[1].textContent.trim();
        const isPurchased = tr.querySelector('.status-badge').classList.contains('purchased');

        document.getElementById('editItemId').value = itemId;
        document.getElementById('editItemNome').value = name;
        document.getElementById('editItemQuantidade').value = quantity;
        document.getElementById('editItemComprado').checked = isPurchased;

        document.getElementById('modalEditarItem').style.display = 'block';
    };

    window.salvarItem = function() {
        const itemId = document.getElementById('editItemId').value;
        const nome = document.getElementById('editItemNome').value.trim();
        const quantidade = parseInt(document.getElementById('editItemQuantidade').value.trim());
        const comprado = document.getElementById('editItemComprado').checked;

        if (!nome || !quantidade) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        fetch(`/update_item/${itemId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                name: nome,
                quantity: quantidade,
                is_purchased: comprado
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Resposta do salvarItem:', data); // Log para depuração
            if (data.success) {
                if (data.item) {
                    updateItemInTable(data.item);
                    document.getElementById('modalEditarItem').style.display = 'none';
                } else {
                    console.error('Objeto item ausente na resposta.');
                    alert('Resposta do servidor inválida. Por favor, tente novamente.');
                }
            } else {
                alert(data.message || 'Erro ao atualizar item.');
            }
        })
        .catch(error => {
            console.error('Erro ao atualizar item:', error);
            alert('Erro ao atualizar item. Por favor, tente novamente.');
        });
    };

    window.removerItem = function(itemId) {
        if (confirm('Deseja realmente excluir este item?')) {
            fetch(`/delete_item/${itemId}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            })
            .then(response => response.json())
            .then(data => {
                console.log('Resposta do removerItem:', data); // Log para depuração
                if (data.success) {
                    removeItemFromTable(itemId);
                } else {
                    alert(data.message || 'Erro ao excluir item.');
                }
            })
            .catch(error => {
                console.error('Erro ao excluir item:', error);
                alert('Erro ao excluir item. Por favor, tente novamente.');
            });
        }
    };
}

// Função para abrir o modal de compartilhar
function abrirModalCompartilhar() {
    const modal = document.getElementById('modalCompartilhar');
    modal.style.display = 'block';
}

// Função para fechar os modais
function fecharModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Função para compartilhar a lista
function compartilharLista() {
    const checkboxes = document.querySelectorAll('input[name="selectedFriends"]:checked');
    const selectedFriends = Array.from(checkboxes).map(cb => cb.value);

    if (!canEdit) {
        alert("Você Não tem Permissão para Compartilhar Esta Lista.");
        return;
    }

    fetch(`/share_list/${listId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ selectedFriends })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            fecharModal();
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Erro ao compartilhar lista:', error);
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    if (canEdit) {
        // Botão Adicionar Item
        const btnAdicionarItem = document.getElementById('btnAdicionarItem');
        if (btnAdicionarItem) {
            btnAdicionarItem.onclick = function() {
                document.getElementById('modalAdicionarItem').style.display = 'block';
            };
        }

        // Form Adicionar Item
        const formAdicionarItem = document.getElementById('formAdicionarItem');
        if (formAdicionarItem) {
            formAdicionarItem.onsubmit = function(e) {
                e.preventDefault();
                adicionarItem();
            };
        }

        // Form Editar Item
        const formEditarItem = document.getElementById('formEditarItem');
        if (formEditarItem) {
            formEditarItem.onsubmit = function(e) {
                e.preventDefault();
                salvarItem();
            };
        }
    }

    // Fechar Modais para Todos os Usuários
    document.querySelectorAll('.fechar').forEach(button => {
        button.onclick = function() {
            this.closest('.modal').style.display = 'none';
        };
    });

    // Fechar Modal ao Clicar Fora
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };

    const btnCompartilhar = document.getElementById('btnCompartilharLista');
    if (btnCompartilhar) {
        btnCompartilhar.addEventListener('click', abrirModalCompartilhar);
    }

    document.querySelectorAll('.fechar').forEach(button => {
        button.addEventListener('click', fecharModal);
    });

    window.onclick = function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        });
    };
});

// Estilos para animações (opcional)
const style = document.createElement('style');
style.textContent = `
    .updated {
        animation: highlight 1.5s ease-out;
    }
    
    @keyframes highlight {
        0% { background-color: #fff3cd; }
        100% { background-color: transparent; }
    }
    
    #listaItens tbody tr {
        transition: opacity 0.3s ease, transform 0.3s ease;
    }
    
    .no-items td {
        text-align: center;
        color: var(--dark-gray);
        padding: 20px;
        font-style: italic;
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-bar input');
    const resultadosDiv = document.querySelector('.resultados-pesquisa');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            if (this.value.length >= 2) {
                fetch(`/search/?term=${this.value}`)
                    .then(response => response.json())
                    .then(data => {
                        resultadosDiv.innerHTML = '';
                        
                        // Seção de Listas
                        if (data.listas && data.listas.length > 0) {
                            const listasDiv = document.createElement('div');
                            listasDiv.innerHTML = '<h3>Listas</h3>';
                            data.listas.forEach(lista => {
                                const itemDiv = document.createElement('div');
                                itemDiv.innerHTML = `
                                    <div onclick="visualizarLista(${lista.id})">
                                        ${lista.name}
                                    </div>
                                `;
                                listasDiv.appendChild(itemDiv);
                            });
                            resultadosDiv.appendChild(listasDiv);
                        }

                        // Seção de Amigos
                        if (data.amigos && data.amigos.length > 0) {
                            const amigosDiv = document.createElement('div');
                            amigosDiv.innerHTML = '<h3>Amigos</h3>';
                            data.amigos.forEach(amigo => {
                                const itemDiv = document.createElement('div');
                                itemDiv.innerHTML = `
                                    <div>
                                        ${amigo.username}
                                    </div>
                                `;
                                amigosDiv.appendChild(itemDiv);
                            });
                            resultadosDiv.appendChild(amigosDiv);
                        }

                        resultadosDiv.style.display = data.listas.length > 0 || data.amigos.length > 0 ? 'block' : 'none';
                    });
            } else {
                resultadosDiv.style.display = 'none';
            }
        });

        // Fechar resultados ao clicar fora
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !resultadosDiv.contains(e.target)) {
                resultadosDiv.style.display = 'none';
            }
        });
    }
});