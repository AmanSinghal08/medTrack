import API from '../axiosInstance';
import { type IResponseData, type SalesOrder, type SalesOrderPayload } from '../../types/app';

export const SalesOrderService = {
  getAll: async (params?: any): Promise<IResponseData<SalesOrder[]>> => {
    const response = await API.get<IResponseData<SalesOrder[]>>('/v1/sales-orders', { params });
    return response.data;
  },

  create: async (data: SalesOrderPayload): Promise<IResponseData<SalesOrder>> => {
    const response = await API.post<IResponseData<SalesOrder>>('/v1/sales-orders', data);
    return response.data;
  },
};
