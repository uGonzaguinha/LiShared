from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('home/', views.home, name='home'),
    path('cadastro/', views.cadastro, name='cadastro'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('create_shopping_list/', views.create_shopping_list, name='create_shopping_list'),
    path('delete_shopping_list/<int:list_id>/', views.delete_shopping_list, name='delete_shopping_list'),
]