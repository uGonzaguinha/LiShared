// home.js

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

// Variável global para armazenar o ID da lista atual
let currentListId = null;

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const botaoCriarLista = document.getElementById('botaoCriarLista');
    const modalCriarLista = document.getElementById('modalCriarLista');
    const botaoNotificacoes = document.getElementById('botaoNotificacoes');
    const modalNotificacoes = document.getElementById('modalNotificacoes');
    const botoesFechar = document.getElementsByClassName('fechar');
    const botaoLogout = document.getElementById('botaoLogout');
    const botaoAdicionarAmigo = document.getElementById('botaoAdicionarAmigo');
    const modalAdicionarAmigo = document.getElementById('modalAdicionarAmigo');
    const pesquisaAmigo = document.getElementById('pesquisaAmigo');
    const resultadosPesquisaAmigos = document.getElementById('resultadosPesquisaAmigos');

    // Event Listeners para Modais
    if (botaoCriarLista) {
        botaoCriarLista.onclick = function() {
            modalCriarLista.style.display = "block";
        };
    }

    if (botaoNotificacoes) {
        botaoNotificacoes.onclick = function() {
            modalNotificacoes.style.display = "block";
            checkForNewNotifications();
        };
    }

    if (botaoAdicionarAmigo) {
        botaoAdicionarAmigo.onclick = function() {
            modalAdicionarAmigo.style.display = "block";
        };
    }

    // Fechar Modais
    Array.from(botoesFechar).forEach(botao => {
        botao.onclick = function() {
            this.closest('.modal').style.display = "none";
        };
    });

    // Logout
    if (botaoLogout) {
        botaoLogout.onclick = function() {
            if (confirm('Deseja realmente sair?')) {
                fetch('/logout/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken'),
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.location.href = data.redirect;
                    }
                });
            }
        };
    }

    // Pesquisa de Amigos
    if (pesquisaAmigo) {
        pesquisaAmigo.addEventListener('input', function() {
            if (this.value.length > 2) {
                fetch(`/search_users/?term=${this.value}`)
                    .then(response => response.json())
                    .then(data => {
                        resultadosPesquisaAmigos.innerHTML = '';
                        data.users.forEach(user => {
                            const div = document.createElement('div');
                            div.className = 'resultado-usuario';
                            div.innerHTML = `
                                <span>${user.username}</span>
                                <button onclick="sendFriendRequest(${user.id})">Adicionar</button>
                            `;
                            resultadosPesquisaAmigos.appendChild(div);
                        });
                    });
            }
        });
    }

    // Inicializar notificações
    setupNotifications();

    // Event listeners para os botões de fechar modais
    document.querySelectorAll('.fechar').forEach(button => {
        button.onclick = function() {
            this.closest('.modal').style.display = "none";
        }
    });

    // Pesquisa de listas e amigos
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        const resultadosDiv = document.createElement('div');
        resultadosDiv.className = 'resultados-pesquisa';
        searchInput.parentNode.appendChild(resultadosDiv);

        searchInput.addEventListener('input', function() {
            if (this.value.length >= 2) {
                fetch(`/search/?term=${this.value}`)
                    .then(response => response.json())
                    .then(data => {
                        resultadosDiv.innerHTML = '';

                        // Seção de Listas
                        if (data.listas.length > 0) {
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
                        if (data.amigos.length > 0) {
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

                        // Mostrar ou esconder resultados
                        if (data.listas.length > 0 || data.amigos.length > 0) {
                            resultadosDiv.style.display = 'block';
                        } else {
                            resultadosDiv.style.display = 'none';
                        }
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

    // Formulário de criar lista
    const formularioCriarLista = document.getElementById('formularioCriarLista');
    if (formularioCriarLista) {
        formularioCriarLista.onsubmit = function(e) {
            e.preventDefault();
            const formData = new FormData(formularioCriarLista);
            
            fetch('/create_shopping_list/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(Object.fromEntries(formData))
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload();
                }
            });
        };
    }
});

// Funções de manipulação de listas
window.editarLista = function(listaId) {
    currentListId = listaId;
    const modalEditarLista = document.getElementById('modalEditarLista');
    
    fetch(`/get_shopping_list/${listaId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('editListaNome').value = data.list.name;
                const tbody = document.querySelector('#editListaItens tbody');
                tbody.innerHTML = '';
                
                if (data.list.items && data.list.items.length > 0) {
                    data.list.items.forEach(item => {
                        adicionarLinhaItem(tbody, item);
                    });
                }
                
                modalEditarLista.style.display = "block";
            }
        });
};

// Função para adicionar linha de item na tabela
function adicionarLinhaItem(tbody, item = {}) {
    const tr = document.createElement('tr');
    if (item.id) {
        tr.setAttribute('data-item-id', item.id);
    }
    tr.innerHTML = `
        <td>
            <input type="text" class="item-nome" value="${item.name || ''}" required>
        </td>
        <td>
            <input type="number" class="item-quantidade" value="${item.quantity || 1}" min="1" required>
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
}

// Event listener para o botão de adicionar item
document.getElementById('btnAdicionarItem')?.addEventListener('click', function() {
    const tbody = document.querySelector('#editListaItens tbody');
    adicionarLinhaItem(tbody, {});
});

// Função para salvar alterações
window.salvarAlteracoes = function() {
    const nome = document.getElementById('editListaNome').value;
    const itens = [];
    
    document.querySelectorAll('#editListaItens tbody tr').forEach(tr => {
        // Pega o ID do item se existir (para itens existentes)
        const itemId = tr.getAttribute('data-item-id');
        
        itens.push({
            id: itemId, // undefined para novos itens
            name: tr.querySelector('.item-nome').value,
            quantity: parseInt(tr.querySelector('.item-quantidade').value),
            is_purchased: tr.querySelector('.item-comprado').checked
        });
    });

    fetch(`/update_shopping_list/${currentListId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            name: nome,
            items: itens
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('modalEditarLista').style.display = "none";
            location.reload();
        } else {
            alert(data.message);
        }
    });
};

// Função para visualizar lista
window.visualizarLista = function(listaId) {
    currentListId = listaId;
    fetch(`/get_shopping_list/${listaId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const modalVisualizarLista = document.getElementById('modalVisualizarLista');
                const tbody = document.querySelector('#tabelaItens tbody');
                
                if (modalVisualizarLista && tbody) {
                    tbody.innerHTML = '';
                    
                    if (data.list.items && data.list.items.length > 0) {
                        data.list.items.forEach(item => {
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>${item.is_purchased ? 'Comprado' : 'Pendente'}</td>
                                <td>
                                    <button onclick="editarItem(${item.id})" class="btn btn-primary">
                                        <i class="fas fa-edit"></i> Editar
                                    </button>
                                    <button onclick="removerItem(${item.id})" class="btn btn-danger">
                                        <i class="fas fa-trash"></i> Excluir
                                    </button>
                                </td>
                            `;
                            tbody.appendChild(tr);
                        });
                    } else {
                        tbody.innerHTML = '<tr><td colspan="4">Nenhum item na lista</td></tr>';
                    }
                    
                    modalVisualizarLista.style.display = "block";
                }
            }
        });
};

window.compartilharLista = function(listaId) {
    // Implementar lógica de compartilhamento
    alert('Funcionalidade em desenvolvimento');
};

window.excluirLista = function(listaId) {
    if (confirm('Deseja realmente excluir esta lista?')) {
        fetch(`/delete_shopping_list/${listaId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload();
            }
        });
    }
};

// Funções de amizade
window.acceptFriend = function(requestId) {
    fetch(`/accept_friend_request/${requestId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        }
    });
};

window.rejectFriend = function(requestId) {
    fetch(`/reject_friend_request/${requestId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        }
    });
};

window.sendFriendRequest = function(userId) {
    fetch('/send_friend_request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ user_id: userId })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.success) {
            document.getElementById('modalAdicionarAmigo').style.display = "none";
        }
    });
};

// Sistema de Notificações
let currentNotifications = [];

function setupNotifications() {
    const botaoNotificacoes = document.getElementById('botaoNotificacoes');
    const modalNotificacoes = document.getElementById('modalNotificacoes');
    const countElement = document.getElementById('notificationsCount');

    // Verificação inicial de notificações
    checkForNewNotifications();

    // Verificar novas notificações a cada 30 segundos
    setInterval(checkForNewNotifications, 30000);

    // Eventos do modal de notificações
    if (botaoNotificacoes) {
        botaoNotificacoes.addEventListener('click', function() {
            modalNotificacoes.style.display = 'block';
            updateNotificationsUI();
        });
    }

    // Evento para fechar o modal
    const fecharBtn = modalNotificacoes.querySelector('.fechar');
    if (fecharBtn) {
        fecharBtn.addEventListener('click', function() {
            modalNotificacoes.style.display = 'none';
        });
    }
}

function checkForNewNotifications() {
    fetch('/get_notifications/', {
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        currentNotifications = data.notifications;
        updateNotificationsUI();
        updateNotificationBadge();
    })
    .catch(error => console.error('Erro ao buscar notificações:', error));
}

function updateNotificationsUI() {
    const listaNotificacoes = document.getElementById('listaNotificacoes');
    if (!listaNotificacoes) return;

    listaNotificacoes.innerHTML = '';

    if (currentNotifications.length === 0) {
        listaNotificacoes.innerHTML = '<div class="no-notifications">Nenhuma notificação</div>';
        return;
    }

    currentNotifications.forEach(notification => {
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification-item ${notification.is_read ? 'read' : 'unread'}`;
        
        let content = `
            <div class="notification-content">
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${notification.created_at}</div>
            </div>
        `;

        if (notification.type === 'friend_request' && !notification.is_read) {
            content += `
                <div class="notification-actions">
                    <button onclick="acceptFriend(${notification.friend_request_id})" class="btn btn-success btn-sm">
                        <i class="fas fa-check"></i> Aceitar
                    </button>
                    <button onclick="rejectFriend(${notification.friend_request_id})" class="btn btn-danger btn-sm">
                        <i class="fas fa-times"></i> Recusar
                    </button>
                </div>
            `;
        }

        notificationElement.innerHTML = content;
        listaNotificacoes.appendChild(notificationElement);
    });
}

function updateNotificationBadge() {
    const countElement = document.getElementById('notificationsCount');
    if (!countElement) return;

    const unreadCount = currentNotifications.filter(n => !n.is_read).length;
    
    if (unreadCount > 0) {
        countElement.style.display = 'block';
        countElement.textContent = unreadCount;
    } else {
        countElement.style.display = 'none';
    }
}

// Funções para gerenciar solicitações de amizade
function acceptFriend(requestId) {
    fetch('/accept_friend_request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ request_id: requestId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            checkForNewNotifications();
        }
    });
}

function rejectFriend(requestId) {
    fetch('/reject_friend_request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ request_id: requestId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            checkForNewNotifications();
        }
    });
}

// Funções de notificação
let lastNotificationCheck = new Date();
let notificationCheckInterval;

function setupNotifications() {
    const botaoNotificacoes = document.getElementById('botaoNotificacoes');
    const modalNotificacoes = document.getElementById('modalNotificacoes');
    const fecharBtn = modalNotificacoes.querySelector('.fechar');

    // Verificar notificações inicialmente e a cada 5 segundos
    checkForNewNotifications();
    notificationCheckInterval = setInterval(checkForNewNotifications, 5000);

    // Abrir modal de notificações
    botaoNotificacoes.addEventListener('click', () => {
        modalNotificacoes.style.display = 'block';
        checkForNewNotifications();
    });

    // Fechar modal
    fecharBtn.addEventListener('click', () => {
        modalNotificacoes.style.display = 'none';
    });
}

function checkForNewNotifications() {
    fetch('/get_notifications/', {
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => updateNotificationsUI(data.notifications));
}

function updateNotificationsUI(notifications) {
    const listaNotificacoes = document.getElementById('listaNotificacoes');
    const countElement = document.getElementById('notificationsCount');
    const unreadNotifications = notifications.filter(n => !n.is_read);

    // Atualizar contador
    if (unreadNotifications.length > 0) {
        countElement.style.display = 'block';
        countElement.textContent = unreadNotifications.length;
    } else {
        countElement.style.display = 'none';
    }

    // Atualizar lista de notificações se o modal estiver aberto
    if (document.getElementById('modalNotificacoes').style.display === 'block') {
        listaNotificacoes.innerHTML = '';

        if (notifications.length > 0) {
            notifications.forEach(notification => {
                const notificationElement = document.createElement('div');
                notificationElement.className = `notification-item ${notification.is_read ? 'read' : 'unread'}`;

                if (notification.type === 'friend_request' && !notification.is_read) {
                    notificationElement.innerHTML = `
                        <div class="notification-content">
                            <p>${notification.message}</p>
                            <div class="notification-actions">
                                <button onclick="acceptFriend(${notification.friend_request_id})" class="btn btn-success btn-sm">
                                    <i class="fas fa-check"></i> Aceitar
                                </button>
                                <button onclick="rejectFriend(${notification.friend_request_id})" class="btn btn-danger btn-sm">
                                    <i class="fas fa-times"></i> Recusar
                                </button>
                            </div>
                        </div>
                    `;
                } else {
                    notificationElement.innerHTML = `
                        <div class="notification-content">
                            <p>${notification.message}</p>
                        </div>
                    `;
                }

                listaNotificacoes.appendChild(notificationElement);
            });
        } else {
            listaNotificacoes.innerHTML = '<div class="no-notifications">Nenhuma notificação</div>';
        }
    }
}

// Inicializar as notificações quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    setupNotifications();
});

// Função para fechar modais quando clicar fora
window.onclick = function(event) {
    const modais = document.getElementsByClassName('modal');
    Array.from(modais).forEach(modal => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}

document.querySelectorAll('.fechar').forEach(button => {
    button.onclick = function() {
        this.closest('.modal').style.display = "none";
    }
});

// Adicionar item à lista
function adicionarItem(listaId) {
    const nome = prompt("Nome do item:");
    const quantidade = prompt("Quantidade:");
    
    if (nome && quantidade) {
        fetch(`/add_item_to_list/${listaId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                name: nome,
                quantity: quantidade
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                visualizarLista(listaId);
            }
        });
    }
}

// Função para adicionar novo item
window.adicionarNovoItem = function() {
    const nome = prompt("Nome do item:");
    const quantidade = prompt("Quantidade:");
    
    if (nome && quantidade && currentListId) {
        fetch(`/add_item_to_list/${currentListId}/`, {
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
            if (data.success) {
                visualizarLista(currentListId);
            }
        });
    }
};

// Função para editar item
window.editarItem = function(itemId) {
    fetch(`/get_item/${itemId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const modalEditarItem = document.getElementById('modalEditarItem');
                document.getElementById('editItemId').value = itemId;
                document.getElementById('editListaId').value = currentListId;
                document.getElementById('editItemNome').value = data.item.name;
                document.getElementById('editItemQuantidade').value = data.item.quantity;
                document.getElementById('editItemComprado').checked = data.item.is_purchased;
                modalEditarItem.style.display = "block";
            }
        });
};

// Função para remover item
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
            if (data.success) {
                visualizarLista(currentListId);
            }
        });
    }
};

// Evento de submit do formulário de edição de item
document.getElementById('formEditarItem')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const itemId = document.getElementById('editItemId').value;
    const itemData = {
        name: document.getElementById('editItemNome').value,
        quantity: parseInt(document.getElementById('editItemQuantidade').value),
        is_purchased: document.getElementById('editItemComprado').checked
    };

    fetch(`/update_item/${itemId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(itemData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('modalEditarItem').style.display = "none";
            visualizarLista(currentListId);
        }
    });
});

// Atualizar o código para fechar modais
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
};

// Atualizar manipuladores de eventos para fechar modais
document.querySelectorAll('.fechar').forEach(button => {
    button.onclick = function() {
        this.closest('.modal').style.display = "none";
    };
});