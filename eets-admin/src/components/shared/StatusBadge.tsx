import React from 'react';

interface StatusBadgeProps {
  status: string | boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = typeof status === 'boolean'
    ? (status ? 'ACTIVE' : 'INACTIVE')
    : String(status).toUpperCase();

  let colorClasses = 'bg-gray-100 text-gray-800';

  switch (normalized) {
    // Order Statuses
    case 'PLACED':
    case 'PENDING':
      colorClasses = 'bg-amber-100 text-amber-800 border-amber-200';
      break;
    case 'ACCEPTED':
    case 'CONFIRMED':
      colorClasses = 'bg-sky-100 text-sky-800 border-sky-200';
      break;
    case 'PREPARING':
    case 'PACKED':
      colorClasses = 'bg-purple-100 text-purple-800 border-purple-200';
      break;
    case 'PICKED_UP':
    case 'ON_THE_WAY':
    case 'OUT_FOR_DELIVERY':
      colorClasses = 'bg-indigo-100 text-indigo-800 border-indigo-200';
      break;
    case 'READY_FOR_PICKUP':
    case 'DELIVERED':
    case 'ACTIVE':
    case 'VERIFIED':
    case 'TRUE':
      colorClasses = 'bg-emerald-100 text-emerald-800 border-emerald-200';
      break;
    case 'CANCELLED':
    case 'REFUNDED':
    case 'BANNED':
    case 'INACTIVE':
    case 'UNVERIFIED':
    case 'FALSE':
    case 'OPEN':
      colorClasses = 'bg-rose-100 text-rose-800 border-rose-200';
      break;
    case 'INVESTIGATED':
    case 'REVIEWED':
      colorClasses = 'bg-blue-100 text-blue-800 border-blue-200';
      break;
    case 'DISMISSED':
      colorClasses = 'bg-slate-100 text-slate-800 border-slate-200';
      break;
    default:
      colorClasses = 'bg-gray-100 text-gray-800 border-gray-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}>
      {normalized}
    </span>
  );
};
