import API from '../axiosInstance';
// Use 'type' keyword for verbatimModuleSyntax compliance
import { type Brand, type BrandPayload, type IResponseData } from '../../types/app';

export const BrandService = {
  getAll: async (params?: any): Promise<IResponseData<Brand[]>> => {
    const response = await API.get<IResponseData<Brand[]>>('/v1/brands', { params });
    return response.data;
  },

  getById: async (id: string): Promise<IResponseData<Brand>> => {
    const response = await API.get<IResponseData<Brand>>(`/v1/brands/${id}`);
    return response.data;
  },
  
  create: async (data: BrandPayload): Promise<IResponseData<Brand>> => {
    const response = await API.post<IResponseData<Brand>>('/v1/brands', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<BrandPayload>): Promise<IResponseData<Brand>> => {
    const response = await API.put<IResponseData<Brand>>(`/v1/brands/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<IResponseData<null>> => {
    const response = await API.delete<IResponseData<null>>(`/v1/brands/${id}`);
    return response.data;
  },
};
