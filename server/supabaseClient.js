require('dotenv').config();

const jsonbin = require('./services/jsonbin');

// JSONBin wrapper to provide Supabase-like interface
class JSONBinWrapper {
  from(collection) {
    return new TableWrapper(collection);
  }
}

class TableWrapper {
  constructor(collection) {
    this.collection = collection;
  }

  async select(columns) {
    return {
      eq: this.eq.bind(this),
      single: this.single.bind(this),
      limit: (limit) => ({
        single: () => this.single()
      })
    };
  }

  async eq(column, value) {
    this.query = { [column]: value };
    return {
      select: this.select.bind(this),
      single: this.single.bind(this),
      eq: this.eq.bind(this)
    };
  }

  async single() {
    try {
      const results = await jsonbin.find(this.collection, this.query, { limit: 1 });
      return {
        data: results.length > 0 ? results[0] : null,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: { message: error.message }
      };
    }
  }

  async insert(data) {
    try {
      const result = Array.isArray(data) ? await jsonbin.create(this.collection, data[0]) : await jsonbin.create(this.collection, data);
      return {
        data: [result],
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: { message: error.message }
      };
    }
  }

  async update(data) {
    try {
      const query = this.query || {};
      const itemId = query.id;
      const result = await jsonbin.update(this.collection, itemId, data);
      return {
        data: [result],
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: { message: error.message }
      };
    }
  }

  async delete() {
    try {
      const query = this.query || {};
      const itemId = query.id;
      const result = await jsonbin.delete(this.collection, itemId);
      return {
        data: [result],
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: { message: error.message }
      };
    }
  }
}

module.exports = new JSONBinWrapper();

module.exports = supabase;