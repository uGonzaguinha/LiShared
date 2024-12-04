from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from .models import ShoppingList, SharedList, Item, ActivityLog, FriendRequest, Friendship
import json

class TestLiShared(TestCase):
    def setUp(self):
        # Criar usuários para testes
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@test.com'
        )
        self.user2 = User.objects.create_user(
            username='testuser2',
            password='testpass123',
            email='test2@test.com'
        )
        
        # Criar uma lista de compras para testes
        self.shopping_list = ShoppingList.objects.create(
            name='Lista de Teste',
            owner=self.user
        )

    def test_user_authentication(self):
        """Testar autenticação de usuários"""
        # Teste de registro
        response = self.client.post(reverse('cadastro'), {
            'username': 'newuser',
            'email': 'new@user.com',
            'password': 'newpass123',
            'confirmPassword': 'newpass123'
        })
        self.assertEqual(response.status_code, 200)
        
        # Teste de login
        login_data = {
            'username': 'newuser',
            'password': 'newpass123'
        }
        
        login_response = self.client.post(
            reverse('login'),
            data=json.dumps(login_data),
            content_type='application/json'
        )
        
        # Código 302 é esperado para redirecionamento após login bem-sucedido
        self.assertEqual(login_response.status_code, 302)
        
        # Verificar se o usuário está autenticado
        self.assertTrue(
            User.objects.filter(username='newuser').exists()
        )
        
        # Teste de logout
        self.client.login(username='newuser', password='newpass123')
        logout_response = self.client.post(reverse('logout'))
        self.assertEqual(logout_response.status_code, 200)

    def test_shopping_list_operations(self):
        """Testar operações CRUD de listas de compras"""
        self.client.login(username='testuser', password='testpass123')
        
        # Criar lista
        response = self.client.post(reverse('create_shopping_list'), {
            'name': 'Nova Lista'
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(json.loads(response.content)['success'])
        
        # Obter lista
        list_id = ShoppingList.objects.get(name='Nova Lista').id
        response = self.client.get(reverse('get_shopping_list', args=[list_id]))
        self.assertEqual(response.status_code, 200)
        
        # Atualizar lista
        response = self.client.post(reverse('update_shopping_list', args=[list_id]), {
            'name': 'Lista Atualizada',
            'items': []
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        # Excluir lista
        response = self.client.delete(reverse('delete_shopping_list', args=[list_id]))
        self.assertEqual(response.status_code, 200)

    def test_item_operations(self):
        """Testar operações com itens"""
        self.client.login(username='testuser', password='testpass123')
        
        # Adicionar item
        response = self.client.post(reverse('add_item_to_list', args=[self.shopping_list.id]), {
            'name': 'Item Teste',
            'quantity': 1
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        # Verificar se o item foi criado
        item = Item.objects.filter(name='Item Teste').first()
        self.assertIsNotNone(item, "Item não foi criado corretamente")
        
        # Obter item
        response = self.client.get(reverse('get_item', args=[item.id]))
        self.assertEqual(response.status_code, 200)
        
        # Atualizar item
        response = self.client.post(reverse('update_item', args=[item.id]), {
            'name': 'Item Atualizado',
            'quantity': 2,
            'is_purchased': True
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        # Verificar se a atualização funcionou
        item.refresh_from_db()
        self.assertEqual(item.name, 'Item Atualizado')
        self.assertEqual(item.quantity, 2)
        self.assertTrue(item.is_purchased)
        
        # Armazenar o ID do item antes de deletá-lo
        item_id = item.id
        
        # Excluir item
        response = self.client.delete(reverse('delete_item', args=[item_id]))
        self.assertEqual(response.status_code, 200)
        
        # Verificar se o item foi realmente excluído
        self.assertFalse(
            Item.objects.filter(id=item_id).exists(),
            "O item não foi excluído corretamente"
        )

    def test_sharing_operations(self):
        """Testar operações de compartilhamento"""
        self.client.login(username='testuser', password='testpass123')
        
        # Criar amizade
        friendship = Friendship.objects.create(user=self.user, friend=self.user2)
        
        # Compartilhar lista - Corrigindo para usar SharedList
        shared_list = SharedList.objects.create(
            shopping_list=self.shopping_list,
            user=self.user2,
            can_edit=True
        )
        
        response = self.client.post(reverse('share_list', args=[self.shopping_list.id]), {
            'user_id': self.user2.id,
            'can_edit': True
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        
        # Verificar se o compartilhamento existe
        self.assertTrue(
            SharedList.objects.filter(
                shopping_list=self.shopping_list,
                user=self.user2
            ).exists()
        )

    def test_friend_operations(self):
        """Testar operações de amizade"""
        self.client.login(username='testuser', password='testpass123')
        
        # Enviar solicitação de amizade
        response = self.client.post(reverse('send_friend_request'), {
            'user_id': self.user2.id
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        
        # Buscar a solicitação de amizade
        friend_request = FriendRequest.objects.get(from_user=self.user, to_user=self.user2)
        
        # Aceitar solicitação como user2
        self.client.login(username='testuser2', password='testpass123')
        response = self.client.post(reverse('accept_friend_request', args=[friend_request.id]))
        
        self.assertEqual(response.status_code, 200)
        
        # Verificar se a amizade foi criada nos dois sentidos
        friendship = Friendship.objects.filter(
            user=self.user,
            friend=self.user2
        ).exists() and Friendship.objects.filter(
            user=self.user2,
            friend=self.user
        ).exists()
        
        self.assertTrue(friendship)

    def test_activity_log(self):
        """Testar registro de atividades"""
        self.client.login(username='testuser', password='testpass123')
        
        # Criar atividade
        ActivityLog.objects.create(
            user=self.user,
            action='add',
            details='Teste de atividade',
            shopping_list=self.shopping_list
        )
        
        # Verificar feed de atividades
        response = self.client.get(reverse('get_recent_activities'))
        self.assertEqual(response.status_code, 200)
        activities = json.loads(response.content)['activities']
        self.assertTrue(len(activities) > 0)

    def test_search_functionality(self):
        """Testar funcionalidade de busca"""
        self.client.login(username='testuser', password='testpass123')
        
        # Buscar usuários
        response = self.client.get(reverse('search_users'), {'term': 'test'})
        self.assertEqual(response.status_code, 200)
        
        # Buscar listas e amigos
        response = self.client.get(reverse('search'), {'term': 'test'})
        self.assertEqual(response.status_code, 200)
