// src/app/components/create-list-modal.component.ts
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
  IonIcon 
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-create-list-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Nova Lista</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-item>
        <ion-label position="floating">Nome da Lista</ion-label>
        <ion-input [(ngModel)]="listName" type="text"></ion-input>
      </ion-item>
      <ion-button expand="block" (click)="createList()" [disabled]="!listName" class="ion-margin-top">
        Criar Lista
      </ion-button>
    </ion-content>
  `,
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
    IonIcon
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