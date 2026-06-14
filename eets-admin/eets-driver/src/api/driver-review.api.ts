import axiosInstance from './axios';
import { ApiResponse } from './driver-auth.api';
import { DriverReview } from '../types/driver.types';
import { PageResponse } from './driver.api';

export const driverReviewApi = {
  getReviewsByDriver: async (driverId: number, page: number = 0, size: number = 20) => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<DriverReview>>>(
      `/api/driver-reviews/driver/${driverId}`,
      { params: { page, size } }
    );
    return response.data;
  },
};
export default driverReviewApi;
