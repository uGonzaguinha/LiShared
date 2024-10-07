from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages

def index(request):
    return render(request, 'index.html')

def cadastro(request):
    if request.method == 'POST':
        username = request.POST['username']
        email = request.POST['email']
        password = request.POST['password']
        confirm_password = request.POST['confirmPassword']
        
        if password != confirm_password:
            messages.error(request, 'As senhas não coincidem.')
            return render(request, 'cadastro.html', {'username': username, 'email': email})
        
        if User.objects.filter(username=username).exists():
            messages.error(request, 'Nome de usuário já existe.')
            return render(request, 'cadastro.html', {'username': username, 'email': email})
        
        if User.objects.filter(email=email).exists():
            messages.error(request, 'E-mail já cadastrado.')
            return render(request, 'cadastro.html', {'username': username, 'email': email})
        
        user = User.objects.create_user(username=username, email=email, password=password)
        user.save()
        messages.success(request, 'Cadastro realizado com sucesso!')
        return redirect('cadastro')
    
    return render(request, 'cadastro.html')