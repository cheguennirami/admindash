import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ShoppingCart, CheckCircle, Clock } from 'lucide-react';

const RecentActivity = ({ activities = [], user }) => {
  const getActivityIcon = (activity) => {
    if (activity.type === 'income' || activity.type === 'expense') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (activity.status === 'in_progress') {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    }
    return <ShoppingCart className="h-5 w-5 text-blue-500" />;
  };

  const getActivityDescription = (activity) => {
    if (activity.type === 'income') {
      return `Income of ${activity.amount} TND added for ${activity.description}`;
    }
    if (activity.type === 'expense') {
      return `Expense of ${activity.amount} TND added for ${activity.description}`;
    }
    return 'Unknown activity';
  };

  const filteredActivities = user?.role === 'treasurer'
    ? activities.filter(activity => activity.type === 'income' || activity.type === 'expense')
    : activities;

  if (filteredActivities.length === 0) {
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
      {filteredActivities.map((activity, index) => (
        <div key={activity._id || index} className="flex items-start space-x-3">
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
        </div>
      ))}
    </div>
  );
};

export default RecentActivity;
