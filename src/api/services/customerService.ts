import API from '../axiosInstance';
import { type Customer, type CustomerPayload, type IResponseData } from '../../types/app';

export const CustomerService = {
  getAll: async (params?: any): Promise<IResponseData<Customer[]>> => {
    const response = await API.get<IResponseData<Customer[]>>('/v1/customers', { params });
    return response.data;
  },

  getById: async (id: string): Promise<IResponseData<Customer>> => {
    const response = await API.get<IResponseData<Customer>>(`/v1/customers/${id}`);
    return response.data;
  },

  create: async (data: CustomerPayload): Promise<IResponseData<Customer>> => {
    const response = await API.post<IResponseData<Customer>>('/v1/customers', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CustomerPayload>): Promise<IResponseData<Customer>> => {
    const response = await API.put<IResponseData<Customer>>(`/v1/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<IResponseData<null>> => {
    const response = await API.delete<IResponseData<null>>(`/v1/customers/${id}`);
    return response.data;
  },
};
