import API from '../axiosInstance';
import {
  type CustomerCollection,
  type CustomerCollectionPayload,
  type IResponseData,
} from '../../types/app';

export const CustomerCollectionService = {
  getAll: async (params?: any): Promise<IResponseData<CustomerCollection[]>> => {
    const response = await API.get<IResponseData<CustomerCollection[]>>('/v1/customer-collections', { params });
    return response.data;
  },

  create: async (data: CustomerCollectionPayload): Promise<IResponseData<CustomerCollection>> => {
    const response = await API.post<IResponseData<CustomerCollection>>('/v1/customer-collections', data);
    return response.data;
  },
};
