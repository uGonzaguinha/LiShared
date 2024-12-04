export interface ShoppingList {
    id: number;
    name: string;
    owner: number;
    created_at: string;
    items: Item[];
  }
  
  export interface Item {
    id: number;
    name: string;
    quantity: number;
    is_purchased: boolean;
  }