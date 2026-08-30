export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  level: number;
  parent_id?: string | null;
  path?: string;
  sort_order?: number;
  is_active: boolean;
  product_count?: number;
  children?: Category[];
}

export interface CategoryFormData {
  name: string;
  slug: string;
  image: string;
  sort_order: number;
  is_active: boolean;
  parent_id: string | null;
}

export interface CategoryTreeResponse {
  categories: Category[];
}
