import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, 
         IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, 
         IonCardContent, IonList, IonItem, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { checkmarkCircle, shareSocial, lockClosed } from 'ionicons/icons';

@Component({
  selector: 'app-welcome',
  template: `
    <ion-content [fullscreen]="true" class="welcome-content">
      <div class="auth-buttons">
        <ion-button fill="clear" routerLink="/login">Login</ion-button>
        <ion-button fill="clear" routerLink="/signup">Cadastrar-se</ion-button>
      </div>

      <div class="welcome-container">
        <div class="logo-section">
          <h1>LiShared</h1>
        </div>

        <div class="content-section">
          <h2>Simplifique suas compras</h2>
          <p>
            Organize e compartilhe suas listas de compras de forma inteligente com amigos e família.
          </p>
          <ion-button expand="block" routerLink="/features" class="learn-more-btn">
            Saiba mais
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [IonContent, IonButton, RouterLink]
})
export class WelcomePage {
  constructor() {
    addIcons({
      checkmarkCircle,
      shareSocial,
      lockClosed
    });
  }
}