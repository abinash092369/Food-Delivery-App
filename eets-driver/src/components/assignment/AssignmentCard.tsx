import React from 'react';
import { MapPin, Navigation, IndianRupee } from 'lucide-react';
import { DeliveryAssignment } from '../../types/driver.types';

interface AssignmentCardProps {
  assignment: DeliveryAssignment;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment }) => {
  return (
    <div className="w-full bg-white rounded-2xl border border-gray-150 p-5 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
            Order Number
          </span>
          <span className="text-base font-bold text-gray-800">
            #{assignment.orderNumber || assignment.orderId}
          </span>
        </div>
        <div className="bg-primary-light text-primary px-3 py-1.5 rounded-full flex items-center">
          <IndianRupee className="w-4 h-4 mr-0.5" />
          <span className="text-sm font-extrabold">{Number(assignment.earnings || assignment.earningsAmount || 0).toFixed(0)}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              Delivery Status
            </span>
            <span className="text-xs text-gray-700 font-semibold block uppercase">
              {assignment.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Navigation className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              Route Info
            </span>
            <span className="text-xs text-gray-700 font-semibold block">
              {Number(assignment.distanceKm || assignment.routeDistanceKm || 0).toFixed(1)} km ({assignment.estimatedDurationMin ?? 0} mins)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentCard;
