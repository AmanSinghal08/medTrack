import API from '../axiosInstance';
// Use 'type' keyword for verbatimModuleSyntax compliance
import { type Product, type IResponseData, type ProductPayload } from '../../types/app';

export const ProductService = {
  getAll: async (params?: any): Promise<IResponseData<Product[]>> => {
    const response = await API.get<IResponseData<Product[]>>('/v1/products', { params });
    return response.data;
  },

  getById: async (id: string): Promise<IResponseData<Product>> => {
    const response = await API.get<IResponseData<Product>>(`/v1/products/${id}`);
    return response.data;
  },
  
  create: async (data: ProductPayload): Promise<IResponseData<Product>> => {
    const response = await API.post<IResponseData<Product>>('/v1/products', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<ProductPayload>): Promise<IResponseData<Product>> => {
    const response = await API.put<IResponseData<Product>>(`/v1/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<IResponseData<null>> => {
    const response = await API.delete<IResponseData<null>>(`/v1/products/${id}`);
    return response.data;
  },
};