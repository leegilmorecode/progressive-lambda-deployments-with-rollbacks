export type CreateAppointment = {
  id?: string;
  created?: string;
  clientName: string;
  appointmentDate: string;
  serviceType: 'haircut' | 'coloring' | 'styling' | 'treatment';
  stylist?: string;
  notes?: string;
  duration?: number;
  version?: number;
};
