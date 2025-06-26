import { api } from '@/lib/api';
import { TandemSlot, TandemBooking, CreateTandemBookingRequest } from '@/types';

export const tandemService = {
  // Get slot availability
  getSlotAvailability: async (startDate: string, endDate: string): Promise<TandemSlot[]> => {
    const response = await api.get('/tandems/slots/availability', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  // Get current user's bookings
  getMyBookings: async (): Promise<TandemBooking[]> => {
    const response = await api.get('/tandems/bookings/me');
    return response.data;
  },

  // Create tandem booking
  createBooking: async (bookingData: CreateTandemBookingRequest): Promise<TandemBooking> => {
    const response = await api.post('/tandems/bookings', bookingData);
    return response.data;
  },

  // Update tandem booking
  updateBooking: async (bookingId: number, bookingData: Partial<TandemBooking>): Promise<TandemBooking> => {
    const response = await api.put(`/tandems/bookings/${bookingId}`, bookingData);
    return response.data;
  },

  // Cancel tandem booking
  cancelBooking: async (bookingId: number): Promise<void> => {
    await api.delete(`/tandems/bookings/${bookingId}`);
  },
};
