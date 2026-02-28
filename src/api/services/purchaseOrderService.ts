import API from '../axiosInstance';
import { type IResponseData, type PurchaseOrder, type PurchaseOrderPayload } from '../../types/app';

export const PurchaseOrderService = {
  getAll: async (params?: any): Promise<IResponseData<PurchaseOrder[]>> => {
    const response = await API.get<IResponseData<PurchaseOrder[]>>('/v1/purchase-orders', { params });
    return response.data;
  },

  create: async (data: PurchaseOrderPayload): Promise<IResponseData<PurchaseOrder>> => {
    const response = await API.post<IResponseData<PurchaseOrder>>('/v1/purchase-orders', data);
    return response.data;
  },
};
