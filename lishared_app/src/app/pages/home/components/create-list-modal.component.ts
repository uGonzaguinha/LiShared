import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonButtons,
  IonIcon,
  IonBackButton
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-create-list-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home" (click)="dismiss()"></ion-back-button>
        </ion-buttons>
        <ion-title>Nova Lista</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="create-list-container">
        <ion-item class="custom-input">
          <ion-label position="floating">Nome da Lista</ion-label>
          <ion-input 
            [(ngModel)]="listName" 
            type="text"
            placeholder="Digite o nome da lista"
            class="styled-input">
          </ion-input>
        </ion-item>
        
        <ion-button 
          expand="block" 
          (click)="createList()" 
          [disabled]="!listName"
          class="create-button ion-margin-top">
          Criar Lista
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .create-list-container {
      max-width: 600px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .custom-input {
      --background: transparent;
      --border-radius: 12px;
      --highlight-height: 2px;
      --padding-start: 16px;
      --padding-end: 16px;
      margin: 1rem 0;
      border: 1px solid var(--ion-color-medium-shade);
      border-radius: 12px;
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--ion-color-primary);
      }

      &.item-has-focus {
        border-color: var(--ion-color-primary);
        box-shadow: 0 0 0 2px rgba(0, 86, 179, 0.1);
      }

      ion-label {
        color: var(--ion-color-primary);
        font-weight: 500;
        margin-bottom: 8px;
      }

      ion-input {
        --padding-top: 16px;
        --padding-bottom: 16px;
        --placeholder-color: var(--ion-color-medium);
        --placeholder-opacity: 0.7;
        font-size: 1rem;

        &::part(native) {
          padding: 12px 0;
          transition: all 0.3s ease;
        }

        &:focus::part(native) {
          background: rgba(0, 86, 179, 0.03);
        }
      }
    }

    .native-input {
      margin: 8px 0;
      padding: 12px 16px !important;
      background: transparent;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .native-wrapper {
      padding: 0 !important;
      margin: 8px 0;
    }

    ion-item.item-has-focus {
      --highlight-background: var(--ion-color-primary);
    }

    .create-button {
      --background: #0056b3;
      --border-radius: 24px;
      --box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      --padding-top: 1rem;
      --padding-bottom: 1rem;
      font-weight: 500;
      text-transform: none;
      letter-spacing: 0.5px;
      margin-top: 2rem;

      &:active {
        --background: #4CAF50;
      }
    }

    ion-toolbar {
      --background: var(--ion-color-primary);
      --color: white;

      ion-back-button, ion-button {
        --color: white;
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonButtons,
    IonIcon,
    IonBackButton
  ]
})
export class CreateListModalComponent {
  listName: string = '';

  constructor(private modalCtrl: ModalController) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }

  createList() {
    if (this.listName.trim()) {
      this.modalCtrl.dismiss({
        created: true,
        name: this.listName
      });
    }
  }
}