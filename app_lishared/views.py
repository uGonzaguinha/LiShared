from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth import authenticate, login as auth_login, logout
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods

def index(request):
    context = {}
    if request.user.is_authenticated:
        context['logged_in_message'] = 'Você está logado!'
    return render(request, 'index.html', context)

@login_required
def home(request):
    return render(request, 'home.html')

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
                'redirect': '/home/'  # or whatever your home page URL is
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