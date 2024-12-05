const DEBUG = true;

function debugLog(message, data) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}:`, data);  // Removido o 'z' que causava o erro
    }
}


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

let currentListId = null;

document.addEventListener('DOMContentLoaded', function() {
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

    if (botaoCriarLista) {
        botaoCriarLista.onclick = function() {
            modalCriarLista.style.display = "block";
        };
    }

    if (botaoAdicionarAmigo) {
        botaoAdicionarAmigo.onclick = function() {
            modalAdicionarAmigo.style.display = "block";
        };
    }

    Array.from(botoesFechar).forEach(botao => {
        botao.onclick = function() {
            this.closest('.modal').style.display = "none";
        };
    });

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

    document.querySelectorAll('.fechar').forEach(button => {
        button.onclick = function() {
            this.closest('.modal').style.display = "none";
        }
    });

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

        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !resultadosDiv.contains(e.target)) {
                resultadosDiv.style.display = 'none';
            }
        });
    }

    const formularioCriarLista = document.getElementById('formularioCriarLista');
    if (formularioCriarLista) {
        formularioCriarLista.onsubmit = function(e) {
            e.preventDefault();
            
            const nome = document.getElementById('nomeLista').value;
            
            fetch('/create_shopping_list/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: nome })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('modalCriarLista').style.display = "none";
                    document.getElementById('nomeLista').value = '';
                    
                    // Atualizar a página de forma mais suave
                    const listaCompras = document.getElementById('listaCompras');
                    if (listaCompras) {
                        fetch('/get_shopping_list/' + data.list_id + '/')
                            .then(response => response.json())
                            .then(listData => {
                                if (listData.success) {
                                    const novaLista = document.createElement('div');
                                    novaLista.className = 'lista-item';
                                    novaLista.setAttribute('data-id', listData.lista.id);
                                    novaLista.setAttribute('data-is-owner', 'true');
                                    novaLista.innerHTML = `
                                        <h3>${listData.lista.name}</h3>
                                        <p>Criada em: ${new Date().toLocaleDateString()}</p>
                                        <div class="lista-buttons">
                                            <button onclick="editarLista('${listData.lista.id}')" class="btn btn-primary">Editar</button>
                                            <button onclick="visualizarLista('${listData.lista.id}')" class="btn btn-secondary">Visualizar</button>
                                            <button onclick="compartilharLista('${listData.lista.id}')" class="btn btn-info"><i class="fas fa-share"></i> Compartilhar</button>
                                            <button onclick="excluirLista('${listData.lista.id}')" class="btn btn-danger">Excluir</button>
                                        </div>
                                    `;
                                    listaCompras.insertBefore(novaLista, listaCompras.firstChild);
                                }
                            });
                    }
                    
                    // Atualizar feed de atividades
                    setTimeout(atualizarFeedAtividades, 500);
                } else {
                    alert(data.message || 'Erro ao criar lista.');
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao criar lista. Por favor, tente novamente.');
            });
        };
    }
});

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
            if (data.success) {
                document.getElementById('editListaNome').value = data.lista.name;
                const tbody = document.querySelector('#editListaItens tbody');
                if (tbody) {
                    tbody.innerHTML = '';
                    
                    if (data.lista.items && data.lista.items.length > 0) {
                        data.lista.items.forEach(item => {
                            adicionarLinhaItem(tbody, item);
                        });
                    }
                }
                
                modalEditarLista.style.display = "block";
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao carregar lista');
        });
};

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
            <select class="item-status" required>
                <option value="false" ${!item.is_purchased ? 'selected' : ''}>Pendente</option>
                <option value="true" ${item.is_purchased ? 'selected' : ''}>Comprado</option>
            </select>
        </td>
        <td>
            <button onclick="this.closest('tr').remove()" class="btn btn-danger">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    tbody.appendChild(tr);
}

document.getElementById('btnAdicionarItem')?.addEventListener('click', function() {
    const tbody = document.querySelector('#editListaItens tbody');
    adicionarLinhaItem(tbody, {});
});

window.salvarAlteracoes = function() {
    const nome = document.getElementById('editListaNome').value;
    const itens = [];
    
    // Coletar dados dos itens da tabela
    document.querySelectorAll('#editListaItens tbody tr').forEach(tr => {
        const itemId = tr.getAttribute('data-item-id');
        const nome = tr.querySelector('.item-nome')?.value;
        const quantidade = tr.querySelector('.item-quantidade')?.value;
        const status = tr.querySelector('.item-status')?.value === 'true';
        
        if (nome && quantidade) {
            itens.push({
                id: itemId,
                name: nome,
                quantity: parseInt(quantidade),
                is_purchased: status
            });
        }
    });

    // Enviar dados para o servidor
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
            // Fechar modal
            document.getElementById('modalEditarLista').style.display = "none";
            
            // Atualizar a visualização
            visualizarLista(currentListId);
            
            // Atualizar feed de atividades
            setTimeout(() => {
                try {
                    atualizarFeedAtividades();
                } catch (error) {
                    console.error('Erro ao atualizar feed:', error);
                }
            }, 500);
        } else {
            console.error('Erro ao salvar alterações:', data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
    });
};

window.visualizarLista = function(listaId) {
    currentListId = listaId;
    const modalVisualizarLista = document.getElementById('modalVisualizarLista');
    
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
                if (tbody) {
                    tbody.innerHTML = '';
                    
                    if (data.lista.items && data.lista.items.length > 0) {
                        data.lista.items.forEach(item => {
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
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao carregar lista');
        });
};

window.compartilharLista = function(listaId) {
    currentListId = listaId;
    const modalCompartilhar = document.getElementById('modalCompartilhar');
    
    if (!modalCompartilhar) {
        console.error('Modal de compartilhamento não encontrado');
        return;
    }

    const radioPermissoes = modalCompartilhar.querySelectorAll('input[name="permission"]');
    const shareTypeInputs = modalCompartilhar.querySelectorAll('input[name="shareType"]');
    const friendSelector = modalCompartilhar.querySelector('#friendSelector');
    const shareLink = modalCompartilhar.querySelector('#shareLink');

    radioPermissoes.forEach(radio => {
        if (radio.value === 'view') radio.checked = true;
    });

    shareTypeInputs.forEach(radio => {
        if (radio.value === 'selected') radio.checked = true;
    });

    if (shareLink) {
        shareLink.value = '';
    }

    if (friendSelector) {
        friendSelector.style.display = 'block';
    }

    modalCompartilhar.querySelectorAll('input[name="selectedFriends"]').forEach(cb => {
        cb.checked = false;
    });

    shareTypeInputs.forEach(input => {
        input.onchange = function() {
            if (friendSelector) {
                friendSelector.style.display = this.value === 'selected' ? 'block' : 'none';
            }
        };
    });

    fetch(`/get_share_link/${listaId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success && shareLink) {
                shareLink.value = data.share_url;
                if (data.share_type === 'all') {
                    const allRadio = modalCompartilhar.querySelector('input[name="shareType"][value="all"]');
                    if (allRadio) {
                        allRadio.checked = true;
                        if (friendSelector) {
                            friendSelector.style.display = 'none';
                        }
                    }
                }
                
                if (data.can_edit) {
                    const editRadio = modalCompartilhar.querySelector('input[name="permission"][value="edit"]');
                    if (editRadio) {
                        editRadio.checked = true;
                    }
                }
            }
        })
        .catch(error => {
            console.error('Erro ao carregar configurações:', error);
        });

    modalCompartilhar.style.display = 'block';
};

function generateInitialShareLink(listaId) {
    fetch(`/get_share_link/${listaId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('shareLink').value = data.share_url;
            }
        });
}

function setupShareTypeToggle() {
    const shareTypeInputs = document.getElementsByName('shareType');
    const friendSelector = document.getElementById('friendSelector');
    
    shareTypeInputs.forEach(input => {
        input.onchange = function() {
            friendSelector.style.display = this.value === 'selected' ? 'block' : 'none';
        };
    });
}

function applyShareSettings() {
    if (!currentListId) return;

    const modalCompartilhar = document.getElementById('modalCompartilhar');
    if (!modalCompartilhar) return;

    const shareType = modalCompartilhar.querySelector('input[name="shareType"]:checked')?.value;
    const selectedFriends = Array.from(modalCompartilhar.querySelectorAll('input[name="selectedFriends"]:checked'))
        .map(cb => cb.value);
    const canEdit = modalCompartilhar.querySelector('input[name="permission"]:checked')?.value === 'edit';

    if (!shareType) {
        alert('Selecione um tipo de compartilhamento.');
        return;
    }

    if (shareType === 'selected' && selectedFriends.length === 0) {
        alert('Selecione pelo menos um amigo para compartilhar.');
        return;
    }

    fetch(`/update_share_settings/${currentListId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            share_type: shareType,
            selected_friends: selectedFriends,
            can_edit: canEdit
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const shareLinkInput = modalCompartilhar.querySelector('#shareLink');
            if (shareLinkInput) {
                shareLinkInput.value = data.share_url;
            }
            alert('Configurações de compartilhamento aplicadas com sucesso!');
            setTimeout(atualizarFeedAtividades, 500);
        } else {
            alert(data.message || 'Erro ao aplicar configurações.');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao aplicar configurações. Por favor, tente novamente.');
    });
}

// Função para copiar o link
function copyShareLink() {
    const shareLinkInput = document.getElementById('shareLink');
    if (!shareLinkInput || !shareLinkInput.value) {
        alert('Primeiro aplique as configurações de compartilhamento.');
        return;
    }

    shareLinkInput.select();
    document.execCommand('copy');

    // Feedback visual
    const button = event.currentTarget;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copiado!';
    setTimeout(() => {
        button.innerHTML = originalText;
    }, 2000);
}

function shareViaEmail() {
    const shareLink = document.getElementById('shareLink').value;
    const subject = 'Lista compartilhada via LiShared';
    const body = `Confira esta lista de compras: ${shareLink}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function shareViaWhatsApp() {
    const shareLink = document.getElementById('shareLink').value;
    const text = `Confira esta lista de compras: ${shareLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

window.excluirLista = function(listaId) {
    if (!confirm('Deseja realmente excluir esta lista?')) return;

    fetch(`/delete_shopping_list/${listaId}/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const listaElement = document.querySelector(`.lista-item[data-id="${listaId}"]`);
            if (listaElement) {
                // Animação de fade out
                listaElement.style.transition = 'all 0.3s ease';
                listaElement.style.opacity = '0';
                listaElement.style.transform = 'translateY(-20px)';
                
                setTimeout(() => {
                    listaElement.remove();
                    
                    // Verificar se há mais listas
                    const listaCompras = document.getElementById('listaCompras');
                    if (listaCompras && listaCompras.children.length === 0) {
                        listaCompras.innerHTML = '<p class="no-lists">Nenhuma lista disponível</p>';
                    }

                    // Atualizar o feed sem recarregar a página
                    try {
                        atualizarFeedAtividades();
                    } catch (error) {
                        console.error('Erro ao atualizar feed:', error);
                    }

                    // Recarregar apenas o conteúdo necessário após 500ms
                    setTimeout(() => {
                        fetch(window.location.href)
                            .then(response => response.text())
                            .then(html => {
                                const parser = new DOMParser();
                                const newDoc = parser.parseFromString(html, 'text/html');
                                
                                // Atualizar lista de compras
                                const newListaCompras = newDoc.getElementById('listaCompras');
                                if (newListaCompras && listaCompras) {
                                    listaCompras.innerHTML = newListaCompras.innerHTML;
                                }
                                
                                // Atualizar feed de atividades
                                const newFeed = newDoc.getElementById('feedAtividades');
                                const currentFeed = document.getElementById('feedAtividades');
                                if (newFeed && currentFeed) {
                                    currentFeed.innerHTML = newFeed.innerHTML;
                                }
                            })
                            .catch(error => console.error('Erro ao atualizar conteúdo:', error));
                    }, 500);
                }, 300);
            }
        } else {
            console.error('Erro ao excluir lista:', data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
    });
};

window.excluirLista = function(listaId) {
    // Verificar se o usuário é o dono da lista
    const listaElement = document.querySelector(`.lista-item[data-id="${listaId}"]`);
    const isOwner = listaElement.getAttribute('data-is-owner') === 'true';

    if (isOwner) {
        if (confirm('Deseja realmente excluir esta lista? Esta ação não poderá ser desfeita e a lista será removida para todos os usuários.')) {
            fetch(`/delete_shopping_list/${listaId}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    removerListaDoDOM(listaId);
                    atualizarFeedAtividades();
                } else {
                    alert('Erro ao excluir lista: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao excluir lista. Por favor, tente novamente.');
            });
        }
    } else {
        // Modal para remover apenas a visualização
        const modalRemoverVisualizacao = document.getElementById('modalRemoverVisualizacao');
        modalRemoverVisualizacao.style.display = "block";
        
        // Configurar o botão de confirmação
        document.getElementById('confirmarRemoverVisualizacao').onclick = function() {
            fetch(`/remove_shared_list/${listaId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    removerListaDoDOM(listaId);
                    atualizarFeedAtividades();
                    modalRemoverVisualizacao.style.display = "none";
                } else {
                    alert('Erro ao remover visualização: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao remover visualização. Por favor, tente novamente.');
            });
        };
    }
};

// Função auxiliar para remover lista do DOM
function removerListaDoDOM(listaId) {
    const listaElement = document.querySelector(`.lista-item[data-id="${listaId}"]`);
    if (listaElement) {
        listaElement.style.transition = 'all 0.3s ease';
        listaElement.style.opacity = '0';
        listaElement.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            listaElement.remove();
            
            // Verificar se há mais listas
            const listaCompras = document.getElementById('listaCompras');
            if (listaCompras && listaCompras.children.length === 0) {
                listaCompras.innerHTML = '<p class="no-lists">Nenhuma lista disponível</p>';
            }
        }, 300);
    }
}

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

// Funções de amizade atualizadas
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

// Adicionar item à lista
window.adicionarItem = function(listaId) {
    const nome = document.getElementById('nomeItem').value;
    const quantidade = document.getElementById('quantidadeItem').value;

    if (!nome) {
        alert('Por favor, insira um nome para o item.');
        return;
    }

    fetch(`/add_item_to_list/${listaId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            name: nome,
            quantity: quantidade || 1
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Limpar campos
            document.getElementById('nomeItem').value = '';
            document.getElementById('quantidadeItem').value = '';
            
            // Atualizar a lista e o feed
            visualizarLista(listaId);
        }
    });
};

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
                atualizarFeedAtividades()
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

// Função para salvar edições do item
window.salvarEditarItem = function() {
    const itemId = document.getElementById('editItemId').value;
    const nome = document.getElementById('editItemNome').value;
    const quantidade = document.getElementById('editItemQuantidade').value;
    const comprado = document.getElementById('editItemComprado').checked;

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
        if (data.success) {
            document.getElementById('modalEditarItem').style.display = "none";
            visualizarLista(currentListId);
            setTimeout(() => {
                atualizarFeedAtividades();
            }, 500);
        }
    });
};

// Função para remover item
window.removerItem = function(itemId) {
    if (!confirm('Deseja realmente excluir este item?')) return;
    
    fetch(`/delete_item/${itemId}/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Atualizar lista e feed
            visualizarLista(currentListId);
        }
    });
};

// Única função para atualizar o feed de atividades
function atualizarFeedAtividades() {
    debugLog('Iniciando atualização do feed');
    const feedElement = document.getElementById('feedAtividades');
    if (!feedElement) return;

    fetch('/get_recent_activities/', {
        method: 'GET',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) throw new Error('Erro na resposta do servidor');
        return response.json();
    })
    .then(data => {
        debugLog('Dados recebidos do servidor', data);
        if (!data.success) {
            console.error('Erro ao buscar atividades:', data.message);
            return;
        }

        if (data.activities && Array.isArray(data.activities)) {
            feedElement.innerHTML = data.activities.length > 0 
                ? data.activities.map(activity => `
                    <li class="activity-item">
                        <div class="activity-content">
                            <div class="activity-text">
                                ${activity.details}
                            </div>
                            <div class="activity-time">
                                ${activity.time_ago} atrás
                            </div>
                        </div>
                    </li>
                `).join('')
                : '<li class="activity-item"><div class="activity-content"><div class="activity-text">Nenhuma atividade recente.</div></div></li>';
        }
    })
    .catch(error => {
        console.error('Erro ao atualizar feed:', error);
    });
}

// Atualização inicial e periódica do feed
document.addEventListener('DOMContentLoaded', function() {
    // Atualização inicial
    atualizarFeedAtividades();
    
    // Atualizar a cada 30 segundos
    const intervalId = setInterval(atualizarFeedAtividades, 30000);
    
    // Limpar intervalo quando a página for fechada
    window.addEventListener('beforeunload', () => {
        clearInterval(intervalId);
    });
});

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
            setTimeout(() => {
                atualizarFeedAtividades();
            }, 500);
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

function generateShareLink() {
    const shareType = document.querySelector('input[name="shareType"]:checked').value;
    const selectedFriends = Array.from(document.getElementsByName('selectedFriends'))
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    const canEdit = document.getElementById('canEdit').checked;
    
    if (shareType === 'selected' && selectedFriends.length === 0) {
        alert('Selecione pelo menos um amigo para compartilhar.');
        return;
    }
    
    fetch(`/share_list/${currentListId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            share_type: shareType,
            selected_friends: selectedFriends,
            can_edit: canEdit
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('shareLink').value = data.share_url;
        } else {
            alert(data.message);
        }
    });
}

function copyShareLink() {
    const shareLinkInput = document.getElementById('shareLink');
    shareLinkInput.select();
    document.execCommand('copy');
    
    // Feedback visual
    const button = event.currentTarget;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copiado!';
    setTimeout(() => {
        button.innerHTML = originalText;
    }, 2000);
}

function shareViaEmail() {
    const shareLink = document.getElementById('shareLink').value;
    const subject = 'Lista compartilhada via LiShared';
    const body = `Confira esta lista de compras: ${shareLink}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function shareViaWhatsApp() {
    const shareLink = document.getElementById('shareLink').value;
    const text = `Confira esta lista de compras: ${shareLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

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

window.excluirAmizade = function(amizadeId) {
    if (confirm('Tem certeza que deseja remover esta amizade?')) {
        fetch(`/excluir_amizade/${amizadeId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Remover o elemento da amizade do DOM com animação
                const amizadeElement = document.querySelector(`.item-amigo[data-amizade-id="${amizadeId}"]`);
                if (amizadeElement) {
                    amizadeElement.style.transition = 'all 0.3s ease';
                    amizadeElement.style.opacity = '0';
                    amizadeElement.style.transform = 'translateX(-20px)';
                    
                    setTimeout(() => {
                        amizadeElement.remove();
                        
                        // Verificar se não há mais amigos
                        const listaAmigos = document.getElementById('listaAmigos');
                        if (listaAmigos && listaAmigos.querySelectorAll('.item-amigo').length === 0) {
                            listaAmigos.innerHTML = '<p class="no-friends">Você não possui nenhum amigo no momento</p>';
                        }
                    }, 300);
                }
                
                // Atualizar o feed de atividades se necessário
                if (typeof atualizarFeedAtividades === 'function') {
                    atualizarFeedAtividades();
                }
                setTimeout(atualizarFeedAtividades, 500);
            } else {
                alert(data.message || 'Erro ao excluir amizade.');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao excluir amizade. Por favor, tente novamente.');
        });
    }
};