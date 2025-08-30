const supabase = require('../services/supabase');

class Payment {
  static async find(query = {}) {
    return await supabase.find('payments', query);
  }

  static async findOne(query) {
    return await supabase.findOne('payments', query);
  }

  static async findById(id) {
    return await supabase.findOne('payments', { id: id });
  }

  static async create(paymentData) {
    return await supabase.create('payments', paymentData);
  }

  static async findByIdAndUpdate(id, updates) {
    return await supabase.update('payments', id, updates);
  }

  static async findByIdAndDelete(id) {
    return await supabase.delete('payments', id);
  }

  static async countDocuments(query = {}) {
    return await supabase.count('payments', query);
  }

  static async aggregate(pipeline) {
    return await supabase.aggregate('payments', pipeline);
  }

  static async findWithPagination(query = {}, options = {}) {
    return await supabase.findWithPagination('payments', query, options);
  }
}

module.exports = Payment;