from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
import uuid

class ShoppingList(models.Model):
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_lists')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class SharedList(models.Model):
    shopping_list = models.ForeignKey(ShoppingList, on_delete=models.CASCADE, related_name='shared_with')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_lists')
    can_edit = models.BooleanField(default=False)

    class Meta:
        unique_together = ('shopping_list', 'user')

    def __str__(self):
        return f"{self.shopping_list.name} shared with {self.user.username}"

class Item(models.Model):
    name = models.CharField(max_length=255)
    shopping_list = models.ForeignKey(ShoppingList, on_delete=models.CASCADE, related_name='items')
    quantity = models.PositiveIntegerField(default=1)
    is_purchased = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.quantity})"

class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ('add', 'Adicionar'),
        ('update', 'Atualizar'),
        ('delete', 'Deletar'),
        ('share', 'Compartilhou'),
        ('purchase', 'Comprou'),
        ('unpurchase', 'Desmarcou')
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField()
    shopping_list = models.ForeignKey('ShoppingList', on_delete=models.SET_NULL, null=True, blank=True)
    item = models.ForeignKey('Item', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.username} {self.get_action_display()} {self.details}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    def __str__(self):
        return self.user.username

class Friendship(models.Model):
    user = models.ForeignKey(User, related_name='friendships', on_delete=models.CASCADE)
    friend = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'friend')

    def __str__(self):
        return f"{self.user.username} is friends with {self.friend.username}"

class FriendRequest(models.Model):
    from_user = models.ForeignKey(User, related_name='friend_requests_sent', on_delete=models.CASCADE)
    to_user = models.ForeignKey(User, related_name='friend_requests_received', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('from_user', 'to_user')

    def __str__(self):
        return f"{self.from_user.username} sent a friend request to {self.to_user.username}"

class SharedListLink(models.Model):
    shopping_list = models.ForeignKey('ShoppingList', on_delete=models.CASCADE, related_name='share_links')
    share_id = models.UUIDField(default=uuid.uuid4, unique=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    can_edit = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Share link for {self.shopping_list.name}"

class SharedListAccess(models.Model):
    SHARE_TYPE_CHOICES = [
        ('all', 'Todos'),
        ('selected', 'Usuários Selecionados')
    ]

    shared_link = models.ForeignKey(SharedListLink, on_delete=models.CASCADE, related_name='access_permissions')
    share_type = models.CharField(max_length=10, choices=SHARE_TYPE_CHOICES, default='selected')
    allowed_users = models.ManyToManyField(User, blank=True, related_name='shared_list_accesses')

    def __str__(self):
        return f"Access control for {self.shared_link.shopping_list.name}"

    def can_access(self, user):
        return self.share_type == 'all' or user in self.allowed_users.all()

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Cria o perfil do usuário quando um novo usuário é criado"""
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Salva o perfil do usuário"""
    try:
        instance.userprofile.save()
    except UserProfile.DoesNotExist:
        UserProfile.objects.create(user=instance)