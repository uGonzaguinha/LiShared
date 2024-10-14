document.addEventListener('DOMContentLoaded', function() {
    const createListBtn = document.getElementById('createListBtn');
    const createListModal = document.getElementById('createListModal');
    const notificationsBtn = document.getElementById('notificationsBtn');
    const notificationsModal = document.getElementById('notificationsModal');
    const closeBtns = document.getElementsByClassName('close');
    const createListForm = document.getElementById('createListForm');
    const listaCompras = document.getElementById('listaCompras');
    const activityFeed = document.getElementById('activityFeed');
    const friendsList = document.getElementById('friendsList');
    const friendRequests = document.getElementById('friendRequests');
    const logoutBtn = document.getElementById('logoutBtn');

    function openModal(modal) {
        modal.style.display = "block";
    }

    function closeModal(modal) {
        modal.style.display = "none";
    }

    createListBtn.onclick = function() {
        openModal(createListModal);
    }

    notificationsBtn.onclick = function() {
        openModal(notificationsModal);
    }

    for (let closeBtn of closeBtns) {
        closeBtn.onclick = function() {
            closeModal(this.closest('.modal'));
        }
    }

    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    }

    createListForm.onsubmit = function(e) {
        e.preventDefault();
        const listName = document.getElementById('listName').value;
        createNewList(listName);
    }

    function createNewList(name) {
        fetch('/create_shopping_list/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ name: name })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const listItem = createListElement(data.id, data.name, new Date().toLocaleDateString());
                listaCompras.insertBefore(listItem, listaCompras.firstChild);
                closeModal(createListModal);
                createListForm.reset();
            } else {
                alert('Erro ao criar lista: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ocorreu um erro ao criar a lista.');
        });
    }

    function createListElement(id, name, date) {
        const listItem = document.createElement('div');
        listItem.className = 'lista-item';
        listItem.dataset.id = id;
        listItem.innerHTML = `
            <h3>${name}</h3>
            <p>Criada em: ${date}</p>
            <button onclick="editList('${id}')">Editar</button>
            <button onclick="shareList('${id}')">Compartilhar</button>
            <button onclick="deleteList('${id}')">Excluir</button>
        `;
        return listItem;
    }

    window.editList = function(id) {
        console.log(`Editar lista: ${id}`);
    }

    window.shareList = function(id) {
        console.log(`Compartilhar lista: ${id}`);
    }

    window.deleteList = function(id) {
        if (confirm('Tem certeza que deseja excluir esta lista?')) {
            fetch(`/delete_shopping_list/${id}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const listItem = document.querySelector(`.lista-item[data-id="${id}"]`);
                    listItem.remove();
                } else {
                    alert('Erro ao excluir lista: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Ocorreu um erro ao excluir a lista.');
            });
        }
    }

    window.acceptFriend = function(requestId) {
        fetch(`/accept_friend_request/${requestId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const requestElement = document.querySelector(`.friend-request[data-id="${requestId}"]`);
                requestElement.remove();
                addFriend(data.friend.username, data.friend.status);
            } else {
                alert('Erro ao aceitar solicitação: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ocorreu um erro ao aceitar a solicitação de amizade.');
        });
    }

    window.rejectFriend = function(requestId) {
        fetch(`/reject_friend_request/${requestId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const requestElement = document.querySelector(`.friend-request[data-id="${requestId}"]`);
                requestElement.remove();
            } else {
                alert('Erro ao rejeitar solicitação: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ocorreu um erro ao rejeitar a solicitação de amizade.');
        });
    }

    function addFriend(name, status) {
        const friendItem = document.createElement('div');
        friendItem.className = 'friend-item';
        friendItem.innerHTML = `
            <h4>${name}</h4>
            <p>${status}</p>
        `;
        friendsList.appendChild(friendItem);
    }

    // Logout
    logoutBtn.onclick = function() {
        fetch('/logout/', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        }).then(() => {
            window.location.href = '/';
        });
    }

    // Obter token CSRF
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Testar notificação
    function setupNotifications() {
        setInterval(() => {
            const notification = `Nova atividade em ${new Date().toLocaleTimeString()}`;
            addNotification(notification);
        }, 30000);
    }

    function addNotification(message) {
        const notificationsList = document.getElementById('notificationsList');
        const notificationItem = document.createElement('li');
        notificationItem.textContent = message;
        notificationsList.appendChild(notificationItem);

        updateNotificationCount();
    }

    function updateNotificationCount() {
        const count = document.getElementById('notificationsList').children.length;
        notificationsBtn.textContent = `Notificações (${count})`;
    }

    setupNotifications();
});