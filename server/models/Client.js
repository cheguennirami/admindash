const supabase = require('../services/supabase');

class Client {
  static async find(query = {}) {
    return await supabase.find('clients', query);
  }

  static async findOne(query) {
    return await supabase.findOne('clients', query);
  }

  static async findById(id) {
    return await supabase.findOne('clients', { id: id });
  }

  static async create(clientData) {
    return await supabase.create('clients', clientData);
  }

  static async findByIdAndUpdate(id, updates) {
    return await supabase.update('clients', id, updates);
  }

  static async findByIdAndDelete(id) {
    return await supabase.delete('clients', id);
  }

  static async countDocuments(query = {}) {
    return await supabase.count('clients', query);
  }

  static async aggregate(pipeline) {
    return await supabase.aggregate('clients', pipeline);
  }

  static async findWithPagination(query = {}, options = {}) {
    return await supabase.findWithPagination('clients', query, options);
  }
}

module.exports = Client;