import API from '../axiosInstance';
import { type InventoryBatch, type InventoryBatchPayload, type IResponseData } from '../../types/app';

export const InventoryService = {
  getAll: async (params?: any): Promise<IResponseData<InventoryBatch[]>> => {
    const response = await API.get<IResponseData<InventoryBatch[]>>('/v1/inventory', { params });
    return response.data;
  },

  getById: async (id: string): Promise<IResponseData<InventoryBatch>> => {
    const response = await API.get<IResponseData<InventoryBatch>>(`/v1/inventory/${id}`);
    return response.data;
  },

  create: async (data: InventoryBatchPayload): Promise<IResponseData<InventoryBatch>> => {
    const response = await API.post<IResponseData<InventoryBatch>>('/v1/inventory', data);
    return response.data;
  },

  update: async (id: string, data: Partial<InventoryBatchPayload>): Promise<IResponseData<InventoryBatch>> => {
    const response = await API.put<IResponseData<InventoryBatch>>(`/v1/inventory/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<IResponseData<null>> => {
    const response = await API.delete<IResponseData<null>>(`/v1/inventory/${id}`);
    return response.data;
  },
};
