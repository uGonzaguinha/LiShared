import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { 
  IonContent, 
  IonIcon,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonButtons 
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-features',
  templateUrl: './features.page.html',
  styleUrls: ['./features.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonButtons,
    RouterLink
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class FeaturesPage {
  constructor() {
    addIcons({ arrowBackOutline });
  }
}
