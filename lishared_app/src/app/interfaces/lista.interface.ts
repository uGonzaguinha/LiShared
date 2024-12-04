export interface Lista {
  id: number;
  name: string;
  created_at: Date;
  itens?: Item[]; // Supondo que haja uma interface para itens
}

export interface Item {
  id: number;
  name: string;
  completed: boolean;
}