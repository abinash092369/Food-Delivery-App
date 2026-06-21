import { create } from 'zustand';
import { DeliveryAssignment } from '../types/driver.types';

export interface AssignmentState {
  currentAssignment: DeliveryAssignment | null;
  isOnline: boolean;
  setCurrentAssignment: (assignment: DeliveryAssignment | null) => void;
  setIsOnline: (isOnline: boolean) => void;
}

export const useAssignmentStore = create<AssignmentState>((set) => ({
  currentAssignment: null,
  isOnline: false,
  setCurrentAssignment: (currentAssignment) => set({ currentAssignment }),
  setIsOnline: (isOnline) => set({ isOnline }),
}));
