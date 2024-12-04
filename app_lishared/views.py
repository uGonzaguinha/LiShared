from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth import authenticate, login as auth_login, logout
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.views.decorators.http import require_POST
from .models import ShoppingList, SharedList, Item, ActivityLog, FriendRequest, Friendship, SharedListLink, SharedListAccess
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.timesince import timesince
import json
from django.db.models import Q
from django.db import transaction
import uuid
from django.urls import reverse
import logging

logger = logging.getLogger(__name__)

def index(request):
    if request.user.is_authenticated:
        return redirect('home')
    return render(request, 'index.html')

@login_required
def home(request):
    user_lists = ShoppingList.objects.filter(owner=request.user).order_by('-updated_at')[:4]
    shared_lists = SharedList.objects.filter(user=request.user).select_related('shopping_list').order_by('-shopping_list__updated_at')[:4]

    all_lists = list(user_lists) + [sl.shopping_list for sl in shared_lists]
    all_lists.sort(key=lambda x: x.updated_at, reverse=True)
    recent_lists = all_lists[:4]

    recent_activities = ActivityLog.objects.filter(
        shopping_list__in=recent_lists
    ).select_related('user', 'shopping_list', 'item').order_by('-timestamp')[:10]

    user_friendships = Friendship.objects.filter(user=request.user)
    friend_requests = FriendRequest.objects.filter(to_user=request.user)

    context = {
        'recent_lists': recent_lists,
        'recent_activities': recent_activities,
        'user_friendships': user_friendships,
        'friend_requests': friend_requests,
    }
    return render(request, 'home.html', context)

@ensure_csrf_cookie
def cadastro(request):
    if request.user.is_authenticated:
        return redirect('home')
        
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirmPassword')

        errors = {}

        if password != confirm_password:
            errors['password'] = 'As senhas não coincidem.'

        if User.objects.filter(username=username).exists():
            errors['username'] = 'Nome de usuário já existe.'

        if User.objects.filter(email=email).exists():
            errors['email'] = 'Email já está em uso.'

        if errors:
            return JsonResponse({'success': False, 'errors': errors})

        try:
            user = User.objects.create_user(username=username, email=email, password=password)
            auth_login(request, user)
            return JsonResponse({
                'success': True, 
                'message': 'Cadastro realizado com sucesso.',
                'redirect': '/home/'
            })
        except Exception as e:
            return JsonResponse({'success': False, 'errors': {'geral': str(e)}})

    return render(request, 'cadastro.html')

@ensure_csrf_cookie
def login_view(request):
    if request.user.is_authenticated:
        return redirect('home')
        
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            auth_login(request, user)
            return JsonResponse({
                'success': True, 
                'message': 'Login realizado com sucesso.',
                'redirect': '/home/',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            })
        else:
            return JsonResponse({
                'success': False, 
                'message': 'Credenciais inválidas.'
            })
            
    return render(request, 'login.html')

@login_required
@require_POST
def logout_view(request):
    logout(request)
    return JsonResponse({
        'success': True, 
        'message': 'Logout realizado com sucesso.',
        'redirect': '/'
    })

@ensure_csrf_cookie
def csrf(request):
    return JsonResponse({'success': True})

@login_required
@require_http_methods(["POST"])
def create_shopping_list(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        name = data.get('name', '').strip()
        if name:
            ShoppingList.objects.create(name=name, owner=request.user)
            return JsonResponse({'success': True, 'message': 'Lista criada com sucesso!'})
        else:
            return JsonResponse({'success': False, 'message': 'Nome da lista não pode ser vazio.'})
    return JsonResponse({'success': False, 'message': 'Método não permitido.'})

@login_required
@require_http_methods(["GET"])
def get_shopping_list(request, list_id):
    try:
        shopping_list = get_object_or_404(ShoppingList, id=list_id)
        
        # Verificar permissão
        if shopping_list.owner != request.user and not shopping_list.shared_with.filter(user=request.user).exists():
            return JsonResponse({'success': False, 'message': 'Sem permissão'})
            
        items = shopping_list.items.all()
        
        return JsonResponse({
            'success': True,
            'lista': {
                'id': shopping_list.id,
                'name': shopping_list.name,
                'items': [{
                    'id': item.id,
                    'name': item.name,
                    'quantity': item.quantity,
                    'is_purchased': item.is_purchased
                } for item in items]
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})

@login_required
@require_http_methods(["POST"])
def update_shopping_list(request, list_id):
    try:
        shopping_list = get_object_or_404(ShoppingList, id=list_id)
        
        # Verificar permissão
        if shopping_list.owner != request.user and not shopping_list.shared_with.filter(user=request.user, can_edit=True).exists():
            return JsonResponse({'success': False, 'message': 'Sem permissão para editar'})
        
        data = json.loads(request.body)
        name = data.get('name', '').strip()
        items = data.get('items', [])
        
        if not name:
            return JsonResponse({'success': False, 'message': 'Nome da lista não pode ser vazio'})
        
        with transaction.atomic():
            # Atualizar nome da lista
            shopping_list.name = name
            shopping_list.save()
            
            # Atualizar itens
            current_items = {item.id: item for item in shopping_list.items.all()}
            
            for item_data in items:
                item_id = item_data.get('id')
                if item_id and item_id in current_items:
                    # Atualizar item existente
                    item = current_items[item_id]
                    item.name = item_data['name']
                    item.quantity = item_data['quantity']
                    item.is_purchased = item_data['is_purchased']
                    item.save()
                    del current_items[item_id]
                else:
                    # Criar novo item
                    Item.objects.create(
                        shopping_list=shopping_list,
                        name=item_data['name'],
                        quantity=item_data['quantity'],
                        is_purchased=item_data['is_purchased']
                    )
            
            # Remover itens que não estão mais na lista
            for item in current_items.values():
                item.delete()
        
        return JsonResponse({
            'success': True, 
            'message': 'Lista atualizada com sucesso'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Erro ao atualizar lista: {str(e)}'
        })

@login_required
@require_http_methods(["DELETE"])
def delete_shopping_list(request, list_id):
    if request.method == 'DELETE':
        shopping_list = get_object_or_404(ShoppingList, id=list_id, owner=request.user)
        shopping_list.delete()
        return JsonResponse({'success': True, 'message': 'Lista excluída com sucesso!'})
    return JsonResponse({'success': False, 'message': 'Método não permitido.'})

@login_required
@require_http_methods(["GET"])
def search_users(request):
    term = request.GET.get('term', '')
    users = User.objects.filter(Q(username__icontains=term) | Q(email__icontains=term)).exclude(id=request.user.id)
    user_data = [{'id': user.id, 'username': user.username} for user in users]
    return JsonResponse({'users': user_data})

@login_required
@require_http_methods(["GET"])
def search(request):
    term = request.GET.get('term', '')
    
    # Buscar listas do usuário
    listas = ShoppingList.objects.filter(
        Q(owner=request.user) & Q(name__icontains=term)
    ).values('id', 'name')
    
    # Buscar amigos
    amigos = Friendship.objects.filter(
        user=request.user,
        friend__username__icontains=term
    ).values('friend__id', 'friend__username')
    
    return JsonResponse({
        'listas': list(listas),
        'amigos': [{'id': amigo['friend__id'], 'username': amigo['friend__username']} 
                  for amigo in amigos]
    })

@login_required
@require_POST
def send_friend_request(request):
    data = json.loads(request.body)
    user_id = data.get('user_id')
    try:
        to_user = User.objects.get(id=user_id)
        
        # Verificar se já existe amizade
        if Friendship.objects.filter(
            Q(user=request.user, friend=to_user) | 
            Q(user=to_user, friend=request.user)
        ).exists():
            return JsonResponse({'success': False, 'message': 'Já são amigos.'})
            
        # Verificar se já existe solicitação pendente
        if FriendRequest.objects.filter(
            Q(from_user=request.user, to_user=to_user) |
            Q(from_user=to_user, to_user=request.user)
        ).exists():
            return JsonResponse({'success': False, 'message': 'Solicitação já enviada.'})
            
        friend_request = FriendRequest.objects.create(
            from_user=request.user, 
            to_user=to_user
        )
        
        return JsonResponse({'success': True, 'message': 'Solicitação enviada com sucesso.'})
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Usuário não encontrado.'})

@login_required
def accept_friend_request(request, request_id):
    try:
        friend_request = FriendRequest.objects.get(id=request_id, to_user=request.user)
        
        # Criar amizade bidirecional
        Friendship.objects.create(user=request.user, friend=friend_request.from_user)
        Friendship.objects.create(user=friend_request.from_user, friend=request.user)
        
        # Deletar a solicita������ão
        friend_request.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Solicitação aceita com sucesso.'
        })
    except FriendRequest.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Solicitação não encontrada.'})

@login_required
def reject_friend_request(request, request_id):
    try:
        friend_request = FriendRequest.objects.get(id=request_id, to_user=request.user)
        friend_request.delete()
        return JsonResponse({'success': True, 'message': 'Solicitação rejeitada com sucesso.'})
    except FriendRequest.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Solicitação não encontrada.'})

@login_required
@require_POST
def add_item_to_list(request, list_id):
    try:
        shopping_list = get_object_or_404(ShoppingList, id=list_id)
        
        # Verificar se o usuário tem permissão para adicionar itens
        if shopping_list.owner != request.user and not SharedList.objects.filter(shopping_list=shopping_list, user=request.user, can_edit=True).exists():
            return JsonResponse({'success': False, 'message': 'Você não tem permissão para adicionar itens nesta lista.'})
        
        data = json.loads(request.body)
        item_name = data.get('name')
        quantity = data.get('quantity', 1)
        is_purchased = data.get('is_purchased', False)
        
        if not item_name or quantity < 1:
            return JsonResponse({'success': False, 'message': 'Dados inválidos.'})
        
        # Criar o item
        item = Item.objects.create(
            name=item_name,
            shopping_list=shopping_list,
            quantity=quantity,
            is_purchased=is_purchased
        )
        
        # Serializar o item para retornar ao frontend
        serialized_item = {
            'id': item.id,
            'name': item.name,
            'quantity': item.quantity,
            'is_purchased': item.is_purchased,
            'created_at': item.created_at.strftime("%d/%m/%Y"),
            'updated_at': item.updated_at.strftime("%d/%m/%Y")
        }
        
        # Registrar a atividade de adição
        register_activity(
            user=request.user,
            action='add',
            details=f'{request.user.username} Adicionou "{item.name}" na "{shopping_list.name}"',
            shopping_list=shopping_list,
            item=item
        )
        
        return JsonResponse({'success': True, 'message': 'Item adicionado com sucesso.', 'item': serialized_item})
    
    except Exception as e:
        logger.error(f"Erro ao adicionar item: {e}")
        return JsonResponse({'success': False, 'message': 'Erro ao adicionar o item.'})

# views.py

@login_required
@require_POST
def update_item(request, item_id):
    try:
        item = get_object_or_404(Item, id=item_id)
        shopping_list = item.shopping_list
        
        # Verificar se o usuário tem permissão para atualizar o item
        if shopping_list.owner != request.user and not SharedList.objects.filter(shopping_list=shopping_list, user=request.user, can_edit=True).exists():
            return JsonResponse({'success': False, 'message': 'Você não tem permissão para atualizar este item.'})
        
        data = json.loads(request.body)
        new_name = data.get('name')
        new_quantity = data.get('quantity')
        new_is_purchased = data.get('is_purchased', False)
        
        if not new_name or new_quantity < 1:
            return JsonResponse({'success': False, 'message': 'Dados inválidos.'})
        
        # Atualizar os campos do item
        item.name = new_name
        item.quantity = new_quantity
        item.is_purchased = new_is_purchased
        item.save()
        
        # Serializar o item atualizado para retornar ao frontend
        serialized_item = {
            'id': item.id,
            'name': item.name,
            'quantity': item.quantity,
            'is_purchased': item.is_purchased,
            'created_at': item.created_at.strftime("%d/%m/%Y"),
            'updated_at': item.updated_at.strftime("%d/%m/%Y")
        }
        
        # Registrar a atividade de atualização
        register_activity(
            user=request.user,
            action='update',
            details=f'{request.user.username} Atualizou "{item.name}" na "{shopping_list.name}"',
            shopping_list=shopping_list,
            item=item
        )
        
        return JsonResponse({'success': True, 'message': 'Item atualizado com sucesso.', 'item': serialized_item})
    
    except Exception as e:
        logger.error(f"Erro ao atualizar item {item_id}: {e}")
        return JsonResponse({'success': False, 'message': 'Erro ao atualizar o item.'})

@login_required
@require_http_methods(["DELETE"])
def delete_item(request, item_id):
    try:
        # Buscar o item e verificar permissões
        item = get_object_or_404(Item, id=item_id)
        shopping_list = item.shopping_list

        # Verificar se o usuário tem permissão para deletar
        if not (shopping_list.owner == request.user or 
                SharedList.objects.filter(
                    shopping_list=shopping_list,
                    user=request.user,
                    can_edit=True
                ).exists()):
            return JsonResponse({
                'success': False,
                'message': 'Sem permissão para deletar este item.'
            })

        item_name = item.name
        
        # Deletar o item
        item.delete()

        # Registrar a atividade
        register_activity(
            user=request.user,
            action='delete',
            details=f'{request.user.username} Deletou "{item_name}" da "{shopping_list.name}"',
            shopping_list=shopping_list
        )

        return JsonResponse({
            'success': True,
            'message': 'Item deletado com sucesso.'
        })

    except Exception as e:
        logger.error(f"Erro ao deletar item {item_id}: {e}")
        return JsonResponse({
            'success': False,
            'message': f'Erro ao deletar o item: {str(e)}'
        })

@login_required
def get_item(request, item_id):
    item = get_object_or_404(Item, id=item_id)
    if item.shopping_list.owner != request.user and not item.shopping_list.shared_with.filter(user=request.user).exists():
        return JsonResponse({'success': False, 'message': 'Você não tem permissão para ver este item.'})
    
    return JsonResponse({
        'success': True,
        'item': {
            'id': item.id,
            'name': item.name,
            'quantity': item.quantity,
            'is_purchased': item.is_purchased
        }
    })

# Função auxiliar para registrar atividades
def register_activity(user, action, details='', shopping_list=None, item=None):
    """Registra uma atividade no feed."""
    try:
        activity = ActivityLog.objects.create(
            user=user,
            action=action,
            details=details,
            shopping_list=shopping_list,
            item=item
        )
        
        # Garantir que a atividade foi criada
        activity.refresh_from_db()
        return True
    except Exception as e:
        logger.error(f"Erro ao registrar atividade: {e}")
        return False

# views.py
@login_required
def get_recent_activities(request):
    # Modificar a query para garantir que estamos pegando todas as atividades relevantes
    activities = ActivityLog.objects.filter(
        Q(user=request.user) |
        Q(shopping_list__owner=request.user) |
        Q(shopping_list__shared_with__user=request.user)
    ).select_related(
        'user', 
        'shopping_list', 
        'item'
    ).order_by('-timestamp')[:10]
    
    # Melhorar a serialização dos dados
    activities_data = [{
        'details': activity.details,
        'time_ago': timesince(activity.timestamp),
        'user': activity.user.username,
        'action': activity.get_action_display(),
        'timestamp': activity.timestamp.strftime("%Y-%m-%d %H:%M:%S")
    } for activity in activities]

    return JsonResponse({'success': True, 'activities': activities_data})

@login_required
@require_http_methods(["POST"])
def share_list(request, list_id):
    if request.method == 'POST':
        shopping_list = get_object_or_404(ShoppingList, id=list_id, owner=request.user)
        data = json.loads(request.body)
        selected_friends_ids = data.get('selectedFriends', [])
        if selected_friends_ids:
            friends = User.objects.filter(id__in=selected_friends_ids)
            for friend in friends:
                # Implemente o compartilhamento conforme seu modelo, por exemplo:
                shopping_list.shared_with.add(friend)
            return JsonResponse({'success': True, 'message': 'Lista compartilhada com sucesso!'})
        else:
            return JsonResponse({'success': False, 'message': 'Nenhum amigo selecionado para compartilhar.'})
    return JsonResponse({'success': False, 'message': 'Método não permitido.'})

def shared_list_view(request, share_id):
    share_link = get_object_or_404(SharedListLink, share_id=share_id, is_active=True)
    shopping_list = share_link.shopping_list

    if not request.user.is_authenticated:
        messages.error(request, "Você precisa estar logado para acessar esta lista.")
        return redirect('login')

    share_access = share_link.access_permissions.first()

    if share_access.share_type == 'selected' and not (
        request.user == shopping_list.owner or 
        share_access.allowed_users.filter(id=request.user.id).exists()
    ):
        messages.error(request, "Você não tem permissão para acessar esta lista.")
        return redirect('home')

    shared_list, created = SharedList.objects.get_or_create(
        shopping_list=shopping_list,
        user=request.user,
        defaults={'can_edit': share_link.can_edit}
    )

    if shared_list.can_edit:
        friends = Friendship.objects.filter(user=request.user).values_list('friend', flat=True)
        friends = User.objects.filter(id__in=friends)
    else:
        friends = []

    context = {
        'list': shopping_list,
        'items': shopping_list.items.all(),
        'can_edit': shared_list.can_edit,
        'is_owner': request.user == shopping_list.owner,
        'friends': friends
    }

    return render(request, 'shared_list.html', context)

@login_required
def update_share_permissions(request, list_id):
    shopping_list = get_object_or_404(ShoppingList, id=list_id, owner=request.user)
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            share_link_id = data.get('share_id')
            new_permissions = data.get('permissions', {})
            
            share_link = SharedListLink.objects.get(
                id=share_link_id,
                shopping_list=shopping_list
            )
            
            share_access = share_link.access_permissions.first()
            
            # Atualizar tipo de compartilhamento
            if 'share_type' in new_permissions:
                share_access.share_type = new_permissions['share_type']
                share_access.save()
            
            # Atualizar usuários com permissão
            if 'allowed_users' in new_permissions:
                share_access.allowed_users.clear()
                for user_id in new_permissions['allowed_users']:
                    try:
                        user = User.objects.get(id=user_id)
                        share_access.allowed_users.add(user)
                    except User.DoesNotExist:
                        continue
            
            # Atualizar permissão de edição
            if 'can_edit' in new_permissions:
                share_link.can_edit = new_permissions['can_edit']
                share_link.save()
                
                # Atualizar permissões dos compartilhamentos existentes
                SharedList.objects.filter(
                    shopping_list=shopping_list,
                    user__in=share_access.allowed_users.all()
                ).update(can_edit=new_permissions['can_edit'])
            
            return JsonResponse({
                'success': True,
                'message': 'Permissões atualizadas com sucesso.'
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Erro ao atualizar permissões: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Método não permitido'})

@login_required
def get_share_link(request, list_id):
    shopping_list = get_object_or_404(ShoppingList, id=list_id, owner=request.user)
    
    # Buscar link existente ou criar um novo
    share_link, created = SharedListLink.objects.get_or_create(
        shopping_list=shopping_list,
        created_by=request.user,
        defaults={
            'can_edit': False,
            'is_active': True
        }
    )
    
    # Gerar URL absoluta para o link de compartilhamento
    share_url = request.build_absolute_uri(
        reverse('shared_list_view', kwargs={'share_id': share_link.share_id})
    )
    
    return JsonResponse({
        'success': True,
        'share_url': share_url,
        'share_id': str(share_link.share_id),
        'can_edit': share_link.can_edit
    })

# Continuação do views.py

@login_required
def get_share_link(request, list_id):
    shopping_list = get_object_or_404(ShoppingList, id=list_id, owner=request.user)
    
    # Buscar link existente ou criar um novo
    share_link, created = SharedListLink.objects.get_or_create(
        shopping_list=shopping_list,
        created_by=request.user,
        defaults={
            'can_edit': False,
            'is_active': True
        }
    )
    
    # Criar ou obter controle de acesso
    share_access, _ = SharedListAccess.objects.get_or_create(
        shared_link=share_link,
        defaults={
            'share_type': 'selected'
        }
    )
    
    # Gerar URL absoluta
    share_url = request.build_absolute_uri(
        reverse('shared_list_view', kwargs={'share_id': share_link.share_id})
    )
    
    return JsonResponse({
        'success': True,
        'share_url': share_url,
        'share_id': str(share_link.share_id),
        'can_edit': share_link.can_edit,
        'share_type': share_access.share_type,
        'allowed_users': list(share_access.allowed_users.values('id', 'username'))
    })

@login_required
def shared_list_view(request, share_id):
    share_link = get_object_or_404(SharedListLink, share_id=share_id, is_active=True)
    shopping_list = share_link.shopping_list
    
    # Verificar se usuário está logado
    if not request.user.is_authenticated:
        return redirect('login')
    
    # Verificar permissões de acesso
    share_access = share_link.access_permissions.first()
    if not share_access:
        return render(request, 'sem_acesso.html')
    
    is_owner = request.user == shopping_list.owner
    can_access = (
        is_owner or 
        share_access.share_type == 'all' or 
        share_access.allowed_users.filter(id=request.user.id).exists()
    )
    
    if not can_access:
        return render(request, 'sem_acesso.html')
    
    # Se tem acesso, criar ou atualizar compartilhamento
    if not is_owner:
        shared_list, created = SharedList.objects.get_or_create(
            shopping_list=shopping_list,
            user=request.user,
            defaults={'can_edit': share_link.can_edit}
        )
    
    context = {
        'list': shopping_list,
        'items': shopping_list.items.all().order_by('is_purchased', 'name'),
        'can_edit': is_owner or share_link.can_edit,
        'is_owner': is_owner,
    }
    
    return render(request, 'shared_list.html', context)

@login_required
@require_http_methods(["POST"])
def update_share_settings(request, list_id):
    shopping_list = get_object_or_404(ShoppingList, id=list_id, owner=request.user)
    
    try:
        data = json.loads(request.body)
        share_type = data.get('share_type', 'selected')
        selected_friends = data.get('selected_friends', [])
        can_edit = data.get('can_edit', False)
        
        # Criar ou atualizar link de compartilhamento
        share_link, _ = SharedListLink.objects.get_or_create(
            shopping_list=shopping_list,
            created_by=request.user,
            defaults={'is_active': True}
        )
        
        # Atualizar permissões
        share_link.can_edit = can_edit
        share_link.save()
        
        # Atualizar controle de acesso
        share_access, _ = SharedListAccess.objects.get_or_create(
            shared_link=share_link
        )
        
        share_access.share_type = share_type
        share_access.save()
        
        # Atualizar usuários com acesso
        share_access.allowed_users.clear()
        if share_type == 'selected':
            for friend_id in selected_friends:
                try:
                    friend = User.objects.get(id=friend_id)
                    share_access.allowed_users.add(friend)
                except User.DoesNotExist:
                    continue
        
        # Gerar URL para compartilhamento
        share_url = request.build_absolute_uri(
            reverse('shared_list_view', kwargs={'share_id': share_link.share_id})
        )
        
        return JsonResponse({
            'success': True,
            'share_url': share_url,
            'message': 'Configurações de compartilhamento atualizadas com sucesso.'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Erro ao atualizar configurações: {str(e)}'
        })

@login_required
def minhas_listas(request):
    minhas_lists = ShoppingList.objects.filter(owner=request.user).order_by('-created_at')
    friends = User.objects.filter(friendship__user=request.user)
    can_edit = True  # Ajuste com a lógica de permissões adequada
    share_link = ''  # Gere o link de compartilhamento se necessário

    context = {
        'minhas_lists': minhas_lists,
        'friends': friends,
        'can_edit': can_edit,
        'share_link': share_link,
    }
    return render(request, 'minhas_listas.html', context)

@login_required
def perfil(request):
    context = {
        'user': request.user,
        'profile': request.user.userprofile
    }
    return render(request, 'perfil.html', context)

@login_required
@require_POST
def remove_shared_list(request, list_id):
    try:
        # Buscar o compartilhamento da lista
        shared_list = SharedList.objects.get(
            shopping_list_id=list_id,
            user=request.user
        )
        
        # Registrar a atividade de remoção
        register_activity(
            user=request.user,
            action='delete',
            details=f'{request.user.username} removeu sua visualização da lista "{shared_list.shopping_list.name}"',
            shopping_list=shared_list.shopping_list
        )
        
        # Remover o compartilhamento
        shared_list.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Visualização removida com sucesso.'
        })
        
    except SharedList.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Lista compartilhada não encontrada.'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        })

@login_required
@require_POST
def excluir_amizade(request, amizade_id):
    try:
        # Buscar a amizade
        amizade = get_object_or_404(Friendship, id=amizade_id, user=request.user)
        amigo = amizade.friend
        
        # Excluir amizade bidirecional
        Friendship.objects.filter(
            (Q(user=request.user) & Q(friend=amigo)) |
            (Q(user=amigo) & Q(friend=request.user))
        ).delete()
        
        # Registrar atividade
        register_activity(
            user=request.user,
            action='delete',
            details=f'{request.user.username} removeu amizade com {amigo.username}'
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Amizade removida com sucesso.'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Erro ao excluir amizade: {str(e)}'
        })