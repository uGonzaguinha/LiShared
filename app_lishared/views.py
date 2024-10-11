from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth import authenticate, login as auth_login, logout
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from .models import ShoppingList, SharedList, Item, ActivityLog
import json

def index(request):
    context = {}
    if request.user.is_authenticated:
        context['logged_in_message'] = 'Você está logado!'
    return render(request, 'index.html', context)

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

    context = {
        'recent_lists': recent_lists,
        'recent_activities': recent_activities,
    }
    return render(request, 'home.html', context)

def cadastro(request):
    if request.method == 'POST':
        username = request.POST['username']
        email = request.POST['email']
        password = request.POST['password']
        confirm_password = request.POST['confirmPassword']

        errors = {}

        if password != confirm_password:
            errors['password'] = 'As senhas não coincidem.'

        if User.objects.filter(username=username).exists():
            errors['username'] = 'Nome de usuário já existe.'

        if User.objects.filter(email=email).exists():
            errors['email'] = 'E-mail já cadastrado.'

        if errors:
            return JsonResponse({'success': False, 'errors': errors})

        user = User.objects.create_user(username=username, email=email, password=password)
        user.save()

        return JsonResponse({'success': True})

    return render(request, 'cadastro.html')

def login(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']

        user = authenticate(request, username=username, password=password)

        if user is not None:
            auth_login(request, user)
            return JsonResponse({
                'success': True,
                'message': 'Login bem-sucedido!',
                'redirect': '/home/'
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Usuário ou senha inválidos.'
            })

    return render(request, 'login.html')

@require_http_methods(["GET"])
def logout_view(request):
    if request.user.is_authenticated:
        logout(request)
    return redirect('index')

@login_required
@require_http_methods(["POST"])
def create_shopping_list(request):
    data = json.loads(request.body)
    name = data.get('name')
    if name:
        shopping_list = ShoppingList.objects.create(name=name, owner=request.user)
        return JsonResponse({
            'success': True,
            'id': shopping_list.id,
            'name': shopping_list.name
        })
    return JsonResponse({
        'success': False,
        'message': 'Nome da lista é obrigatório.'
    })

@login_required
def add_item_to_list(request, list_id):
    if request.method == 'POST':
        shopping_list = ShoppingList.objects.get(id=list_id)
        if shopping_list.owner == request.user or shopping_list.shared_with.filter(user=request.user, can_edit=True).exists():
            name = request.POST.get('name')
            quantity = request.POST.get('quantity', 1)
            item = Item.objects.create(shopping_list=shopping_list, name=name, quantity=quantity)
            ActivityLog.objects.create(user=request.user, shopping_list=shopping_list, action='update', item=item, details=f"Added {name}")
            return JsonResponse({'success': True, 'id': item.id, 'name': item.name, 'quantity': item.quantity})
    return JsonResponse({'success': False, 'message': 'Invalid request'})

@login_required
@require_http_methods(["DELETE"])
def delete_shopping_list(request, list_id):
    shopping_list = get_object_or_404(ShoppingList, id=list_id, owner=request.user)
    shopping_list.delete()
    return JsonResponse({'success': True, 'message': 'Lista excluída com sucesso.'})

@login_required
def share_list(request, list_id):
    if request.method == 'POST':
        shopping_list = ShoppingList.objects.get(id=list_id)
        if shopping_list.owner == request.user:
            username = request.POST.get('username')
            can_edit = request.POST.get('can_edit') == 'true'
            try:
                user_to_share = User.objects.get(username=username)
                SharedList.objects.create(shopping_list=shopping_list, user=user_to_share, can_edit=can_edit)
                ActivityLog.objects.create(user=request.user, shopping_list=shopping_list, action='share', details=f"Shared with {username}")
                return JsonResponse({'success': True, 'message': f'List shared with {username}'})
            except User.DoesNotExist:
                return JsonResponse({'success': False, 'message': 'User not found'})
    return JsonResponse({'success': False, 'message': 'Invalid request'})