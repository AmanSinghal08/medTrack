import API from '../axiosInstance';
import { type DealerPayment, type DealerPaymentPayload, type IResponseData } from '../../types/app';

export const DealerPaymentService = {
  getAll: async (params?: any): Promise<IResponseData<DealerPayment[]>> => {
    const response = await API.get<IResponseData<DealerPayment[]>>('/v1/dealer-payments', { params });
    return response.data;
  },

  create: async (data: DealerPaymentPayload): Promise<IResponseData<DealerPayment>> => {
    const response = await API.post<IResponseData<DealerPayment>>('/v1/dealer-payments', data);
    return response.data;
  },
};
