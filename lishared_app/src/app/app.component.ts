import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonListHeader, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet, IonHeader, IonToolbar, IonTitle, IonButton, IonButtons, IonMenuButton } from '@ionic/angular/standalone';
import { MatIconModule } from '@angular/material/icon'; // Importação correta do MatIconModule
import { AuthService } from './services/auth.service';
import { ModalController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    CommonModule,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonListHeader,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    MatIconModule, // Adicione o MatIconModule aqui
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonButtons,
    IonMenuButton
  ],
})
export class AppComponent {
  public appPages = [
    { title: 'Home', url: '/home', icon: 'home' },
    { title: 'Minhas Listas', url: '/minhas_listas', icon: 'list' },
    { title: 'Amigos', url: '/amigos', icon: 'people' }, // Nova opção
    { title: 'Perfil', url: '/perfil', icon: 'person' },
    { title: 'Sair', url: '#', icon: 'log-out', action: 'logout' } // Adicionando opção de Sair
  ];
  isLoggedIn = false; // Controla acesso ao menu

  constructor(private authService: AuthService, private router: Router) {}

  handleMenuClick(page: any): void {
    if (page.action === 'logout') {
      this.logout();
    }
  }

  async logout(): Promise<void> {
    this.authService.logout();
    await this.router.navigate(['/welcome']);
  }

  canShowMenu(): boolean {
    return this.authService.isAuthenticated();
  }
}
