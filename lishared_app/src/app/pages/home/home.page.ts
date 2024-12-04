import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
  IonContent, 
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonButtons,
  IonMenuButton,
  IonModal,
  ModalController,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ListaService } from '../../services/lista.service';
import { Lista } from '../../interfaces/lista.interface';
import { CreateListModalComponent } from './components/create-list-modal.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent, 
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonButtons,
    IonMenuButton,
    IonModal
  ]
})
export class HomePage implements OnInit {
  currentSegment = 'lists';
  recent_lists: Lista[] = [];
  recentActivities: any[] = [];

  constructor(
    private listaService: ListaService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarListas();
    this.carregarAtividadesRecentes();
  }

  carregarListas() {
    this.listaService.getListas().subscribe({
      next: (listas) => {
        this.recent_lists = listas;
      },
      error: (error) => {
        console.error('Erro ao carregar listas:', error);
        this.showToast('Erro ao carregar listas', 'danger');
      }
    });
  }

  async openCreateListModal() {
    const modal = await this.modalController.create({
      component: CreateListModalComponent
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.name) {
      this.listaService.createLista(data.name).subscribe({
        next: () => {
          this.carregarListas();
          this.showToast('Lista criada com sucesso!', 'success');
        },
        error: (error) => {
          console.error('Erro ao criar lista:', error);
          this.showToast('Erro ao criar lista', 'danger');
        }
      });
    }
  }

  async editarLista(id: number) {
    // Implementar edição
    this.router.navigate(['/editar-lista', id]);
  }

  async visualizarLista(id: number) {
    this.router.navigate(['/visualizar-lista', id]);
  }

  async compartilharLista(id: number) {
    const alert = await this.alertController.create({
      header: 'Compartilhar Lista',
      message: 'Deseja compartilhar esta lista?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Compartilhar',
          handler: () => {
            this.listaService.compartilharLista(id).subscribe({
              next: (response) => {
                this.showToast('Lista compartilhada com sucesso!', 'success');
              },
              error: (error) => {
                console.error('Erro ao compartilhar lista:', error);
                this.showToast('Erro ao compartilhar lista', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  segmentChanged(ev: any) {
    this.currentSegment = ev.detail.value;
    if (this.currentSegment === 'activities') {
      this.carregarAtividadesRecentes();
    }
  }

  carregarAtividadesRecentes() {
    // Implementar carregamento das atividades
    this.listaService.getRecentActivities().subscribe({
      next: (activities) => {
        this.recentActivities = activities;
      },
      error: (error) => {
        console.error('Erro ao carregar atividades:', error);
      }
    });
  }

  openSearch() {
    // Implementar busca
    console.log('Implementar busca');
  }

  getActivityIcon(action: string): string {
    const icons: {[key: string]: string} = {
      'add': 'add-circle-outline',
      'update': 'create-outline',
      'delete': 'trash-outline',
      'share': 'share-social-outline'
    };
    return icons[action] || 'ellipse-outline';
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color
    });
    toast.present();
  }
}
