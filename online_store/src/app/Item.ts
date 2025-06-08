export interface Item {
  _id?: any;
  imageFileId: string;
  item_name: string;
  price: number;
  description: string;
  admin_name: string;
  salesHistory: SaleRecord[];
  hashtags: string[];
  type: string;
  comments: {
    username: string;
    content: string;
    isAdmin: boolean;
    starRating?: number;
  }[];
  promotion_level: string;
  discount?: {
    type?: string;
    newPrice?: number;
    startDate?: string;
    endDate?: string;
    bogoId?: string;
  };
}

export interface SaleRecord {
  date: string;
  quantity: number;
}
