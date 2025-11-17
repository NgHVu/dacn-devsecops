
export type Product = {
  id: number;          
  name: string;
  description: string;  
  price: number;        
  image: string;        
  stockQuantity: number;
  createdAt: string;   
  updatedAt: string;    
};

export type PageableResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;        
  number: number;      
  last: boolean;        
  first: boolean;       
  empty: boolean;       
};