import API from '../axiosInstance';
import { type IResponseData, type SalesOrderItem, type SalesOrderItemPayload } from '../../types/app';

export const SalesOrderItemService = {
  getAll: async (params?: any): Promise<IResponseData<SalesOrderItem[]>> => {
    const response = await API.get<IResponseData<SalesOrderItem[]>>('/v1/sales-order-items', { params });
    return response.data;
  },

  create: async (data: SalesOrderItemPayload): Promise<IResponseData<SalesOrderItem>> => {
    const response = await API.post<IResponseData<SalesOrderItem>>('/v1/sales-order-items', data);
    return response.data;
  },
};
