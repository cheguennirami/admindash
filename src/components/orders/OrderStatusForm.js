import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  MapPin,
  Send,
  Eye,
  AlertCircle
} from 'lucide-react';
import { orderOps } from '../../services/jsonbin-new';

const OrderStatusForm = ({ selectedOrder, onStatusUpdated, error }) => {
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    newStatus: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    if (!selectedOrder) {
      setStatusUpdateForm({ newStatus: '', location: '', notes: '' });
    }
  }, [selectedOrder]);

  const getStatusColor = (status) => {
    const colors = {
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'bought': 'bg-blue-100 text-blue-800',
      'delivered_to_client': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'delivered_to_france': 'bg-purple-100 text-purple-800',
      'delivered_to_tunisia': 'bg-teal-100 text-teal-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const updateOrderStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !statusUpdateForm.newStatus) return;

    try {
      await orderOps.updateOrder(selectedOrder._id, {
        status: statusUpdateForm.newStatus,
        trackingUpdates: [
          ...(selectedOrder.trackingUpdates || []),
          {
            status: statusUpdateForm.newStatus,
            timestamp: new Date().toISOString(),
            location: statusUpdateForm.location || 'Unknown',
            description: statusUpdateForm.notes || `Order status updated to ${statusUpdateForm.newStatus}`,
            operator: 'Logistics Team'
          }
        ]
      });
      setStatusUpdateForm({ newStatus: '', location: '', notes: '' });
      onStatusUpdated(); // Notify parent to reload data
      console.log('✅ Order status updated:', selectedOrder._id, statusUpdateForm.newStatus);
    } catch (err) {
      console.error('❌ Failed to update order status:', err);
      // Error handling will be done by the parent component via the 'error' prop
    }
  };

  if (!selectedOrder) {
    return (
      <div className="text-center text-gray-500 py-8">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Select an order to follow its status</p>
      </div>
    );
  }

  return (
    <>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Eye className="h-5 w-5 text-blue-500 mr-2" />
        Follow Order Status
      </h3>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Selected Order Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-900">{selectedOrder.clientName}</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
            {selectedOrder.status.replace('_', ' ')}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          Order: {selectedOrder.orderId || selectedOrder._id}
        </div>
      </div>

      {/* Status Update Form */}
      <form onSubmit={updateOrderStatus} className="mb-4">
        <div className="space-y-3">
          <div>
            <label htmlFor="newStatus" className="block text-sm font-medium text-gray-700 mb-1">
              New Status *
            </label>
            <select
              id="newStatus"
              value={statusUpdateForm.newStatus}
              onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, newStatus: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Status</option>
              <option value="in_progress">In Progress</option>
              <option value="bought">Bought</option>
              <option value="delivered_to_france">Delivered to France</option>
              <option value="delivered_to_tunisia">Delivered to Tunisia</option>
              <option value="delivered_to_client">Delivered to Client</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                value={statusUpdateForm.location}
                onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, location: e.target.value })}
                placeholder="e.g., Paris Warehouse"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <input
                type="text"
                id="notes"
                value={statusUpdateForm.notes}
                onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, notes: e.target.value })}
                placeholder="Additional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
          >
            <Send className="h-4 w-4 mr-2" />
            Update Order Status
          </button>
        </div>
      </form>

      {/* Tracking History */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <Eye className="h-4 w-4 mr-2" />
          Tracking History ({selectedOrder.trackingUpdates?.length || 0})
        </h4>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {selectedOrder.trackingUpdates?.length > 0 ? (
            selectedOrder.trackingUpdates.map((update, index) => (
              <div key={update._id || index} className="p-2 bg-gray-50 rounded border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-blue-600">{update.status.replace('_', ' ')}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(update.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-800">{update.description}</p>
                {update.location && (
                  <div className="flex items-center mt-1">
                    <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500">{update.location}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500 text-center py-4">
              No tracking updates yet
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrderStatusForm;