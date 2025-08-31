import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ShoppingCart, CheckCircle, Clock } from 'lucide-react';

const RecentActivity = ({ activities = [] }) => {
  const getActivityIcon = (activity) => {
    if (activity.confirmation === 'confirmed') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (activity.status === 'in_progress') {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    }
    return <ShoppingCart className="h-5 w-5 text-blue-500" />;
  };

  const getActivityDescription = (activity) => {
    const createdBy = activity.createdBy?.fullName || 'Unknown User';
    const role = activity.createdBy?.role?.replace('_', ' ') || '';
    
    if (activity.confirmation === 'confirmed') {
      return `${createdBy} confirmed order ${activity.orderId}`;
    }
    if (activity.status === 'delivered_to_client') {
      return `Order ${activity.orderId} delivered to ${activity.fullName}`;
    }
    return `${createdBy} (${role}) created new client ${activity.fullName}`;
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <ShoppingCart className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-gray-500">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity._id} className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getActivityIcon(activity)}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              {getActivityDescription(activity)}
            </p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              activity.confirmation === 'confirmed' 
                ? 'bg-green-100 text-green-800'
                : activity.confirmation === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {activity.confirmation}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivity;
