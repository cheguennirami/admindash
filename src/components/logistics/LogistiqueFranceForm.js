import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  MapPin,
  Send,
  Eye,
  AlertCircle
} from 'lucide-react';
import { orderOps } from '../../services/jsonbin-new';

const LogistiqueFranceForm = ({ selectedOrder, onCommunicationSent, onStatusUpdated, error }) => {
  const [communicationForm, setCommunicationForm] = useState({
    message: '',
    location: '',
    notes: ''
  });
  const [statusUpdates, setStatusUpdates] = useState({});

  useEffect(() => {
    if (!selectedOrder) {
      setCommunicationForm({ message: '', location: '', notes: '' });
      setStatusUpdates({});
    }
  }, [selectedOrder]);

  const getStatusColor = (status) => {
    const colors = {
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'bought': 'bg-blue-100 text-blue-800',
      'delivered_to_client': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const sendCommunication = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !communicationForm.message) return;

    try {
      await orderOps.addCommunication(selectedOrder._id, {
        message: communicationForm.message,
        location: communicationForm.location,
        notes: communicationForm.notes
      });
      setCommunicationForm({ message: '', location: '', notes: '' });
      onCommunicationSent(); // Notify parent to reload data
      console.log('✅ Communication sent to France for order:', selectedOrder._id);
    } catch (err) {
      console.error('❌ Failed to send communication:', err);
      // Error handling will be done by the parent component via the 'error' prop
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderOps.updateOrderStatusFromFrance(orderId, newStatus, statusUpdates[orderId]?.location, statusUpdates[orderId]?.notes);
      setStatusUpdates({ ...statusUpdates, [orderId]: {} });
      onStatusUpdated(); // Notify parent to reload data
      console.log('✅ Order status updated:', orderId, newStatus);
    } catch (err) {
      console.error('❌ Failed to update order status:', err);
      // Error handling will be done by the parent component via the 'error' prop
    }
  };

  if (!selectedOrder) {
    return (
      <div className="text-center text-gray-500 py-8">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Select an order to communicate with France</p>
      </div>
    );
  }

  return (
    <>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <MessageSquare className="h-5 w-5 text-blue-500 mr-2" />
        Communicate with France
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

      {/* Communication Form */}
      <form onSubmit={sendCommunication} className="mb-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <textarea
              value={communicationForm.message}
              onChange={(e) => setCommunicationForm({ ...communicationForm, message: e.target.value })}
              placeholder="Enter your message to France logistics..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={communicationForm.location}
                onChange={(e) => setCommunicationForm({ ...communicationForm, location: e.target.value })}
                placeholder="e.g., Paris Warehouse"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <input
                type="text"
                value={communicationForm.notes}
                onChange={(e) => setCommunicationForm({ ...communicationForm, notes: e.target.value })}
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
            Send to France Logistics
          </button>
        </div>
      </form>

      {/* Status Update */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Update Order Status</h4>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => updateOrderStatus(selectedOrder._id, 'bought')}
            className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200"
          >
            Mark as Bought
          </button>
          <button
            onClick={() => updateOrderStatus(selectedOrder._id, 'in_progress')}
            className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-200"
          >
            In Progress
          </button>
          <button
            onClick={() => updateOrderStatus(selectedOrder._id, 'delivered_to_client')}
            className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium hover:bg-green-200"
          >
            Delivered
          </button>
          <button
            onClick={() => updateOrderStatus(selectedOrder._id, 'cancelled')}
            className="px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200"
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Communications History */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <Eye className="h-4 w-4 mr-2" />
          Communication History ({selectedOrder.communications?.length || 0})
        </h4>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {selectedOrder.communications?.length > 0 ? (
            selectedOrder.communications.map((comm, index) => (
              <div key={comm._id || index} className="p-2 bg-gray-50 rounded border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-blue-600">{comm.from || 'France'}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(comm.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-800">{comm.message}</p>
                {comm.location && (
                  <div className="flex items-center mt-1">
                    <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500">{comm.location}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500 text-center py-4">
              No communications yet
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LogistiqueFranceForm;