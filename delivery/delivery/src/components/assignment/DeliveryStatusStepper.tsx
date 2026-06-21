import React from 'react';
import { MapPin, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { AssignmentStatus } from '../../types/driver.types';

interface DeliveryStatusStepperProps {
  status: AssignmentStatus;
}

export const DeliveryStatusStepper: React.FC<DeliveryStatusStepperProps> = ({ status }) => {
  const steps = [
    { label: 'Assigned', icon: MapPin },
    { label: 'Picked Up', icon: ShoppingBag },
    { label: 'Delivered', icon: CheckCircle2 },
  ];

  const getCurrentStepIndex = () => {
    if (status === 'DELIVERED') return 2;
    if (status === 'PICKED_UP') return 1;
    return 0; // ASSIGNED, ACCEPTED, REJECTED, CANCELLED default to 0
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="w-full flex items-center justify-between px-2 py-4 bg-gray-50 rounded-xl">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isCompleted = idx < currentIndex;
        const isActive = idx === currentIndex;
        
        return (
          <React.Fragment key={step.label}>
            {/* Step bubble */}
            <div className="flex flex-col items-center flex-1 relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                    : isActive
                    ? 'bg-primary border-primary text-white shadow-sm ring-4 ring-primary-light'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[10px] mt-1.5 font-bold tracking-wide ${
                  isActive ? 'text-primary' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting line */}
            {idx < steps.length - 1 && (
              <div className="w-12 h-0.5 bg-gray-200 -mt-5 relative">
                <div
                  className="absolute left-0 top-0 h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: idx < currentIndex ? '100%' : '0%' }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default DeliveryStatusStepper;
