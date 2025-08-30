const bcrypt = require('bcryptjs');
const supabase = require('../services/supabase');

class User {
  static async find(query = {}) {
    return await supabase.find('users', query);
  }

  static async findOne(query) {
    return await supabase.findOne('users', query);
  }

  static async findById(id) {
    return await supabase.findOne('users', { id: id });
  }

  static async create(userData) {
    // Hash password before saving
    if (userData.password) {
      const salt = await bcrypt.genSalt(12);
      userData.password = await bcrypt.hash(userData.password, salt);
    }
    if (userData.password) {
      const salt = await bcrypt.genSalt(12);
      userData.password = await bcrypt.hash(userData.password, salt);
    }
    return await supabase.create('users', userData);
  }

  static async findByIdAndUpdate(id, updates) {
    // Hash password if being updated
    if (updates.password) {
      const salt = await bcrypt.genSalt(12);
      updates.password = await bcrypt.hash(updates.password, salt);
    }
    return await supabase.update('users', id, updates);
  }

  static async findByIdAndDelete(id) {
    return await supabase.delete('users', id);
  }

  static async countDocuments(query = {}) {
    return await supabase.count('users', query);
  }

  static async aggregate(pipeline) {
    return await supabase.aggregate('users', pipeline);
  }

  // Instance methods for password comparison
  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
}

// Schema definition for reference (not used in JSONBin)
const userSchema = {
  fullName: {
    type: 'String',
    required: true,
    maxlength: 100
  },
  email: {
    type: 'String',
    required: true,
    unique: true
  },
  password: {
    type: 'String',
    required: true,
    minlength: 6
  },
  role: {
    type: 'String',
    enum: ['super_admin', 'marketing', 'logistics', 'treasurer'],
    default: 'marketing'
  },
  avatar: {
    type: 'String',
    default: ''
  },
  phone: {
    type: 'String'
  },
  isActive: {
    type: 'Boolean',
    default: true
  },
  lastLogin: {
    type: 'Date'
  },
  createdBy: {
    type: 'String' // User ID reference
  },
  createdAt: {
    type: 'Date'
  },
  updatedAt: {
    type: 'Date'
  }
};

module.exports = User;
