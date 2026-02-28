import API from '../axiosInstance';
import { type Dealer, type DealerPayload, type IResponseData } from '../../types/app';

export const DealerService = {
  getAll: async (params?: any): Promise<IResponseData<Dealer[]>> => {
    const response = await API.get<IResponseData<Dealer[]>>('/v1/dealers', { params });
    return response.data;
  },

  getById: async (id: string): Promise<IResponseData<Dealer>> => {
    const response = await API.get<IResponseData<Dealer>>(`/v1/dealers/${id}`);
    return response.data;
  },

  create: async (data: DealerPayload): Promise<IResponseData<Dealer>> => {
    const response = await API.post<IResponseData<Dealer>>('/v1/dealers', data);
    return response.data;
  },

  update: async (id: string, data: Partial<DealerPayload>): Promise<IResponseData<Dealer>> => {
    const response = await API.put<IResponseData<Dealer>>(`/v1/dealers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<IResponseData<null>> => {
    const response = await API.delete<IResponseData<null>>(`/v1/dealers/${id}`);
    return response.data;
  },
};
