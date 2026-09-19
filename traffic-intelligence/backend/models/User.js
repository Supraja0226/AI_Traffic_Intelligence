const { createDualModel } = require('./modelHelper');

const userSchema = {
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'analyst', 'operator', 'viewer'],
    default: 'viewer'
  },
  name: { type: String, default: 'Traffic Platform User' },
  organization: { type: String, default: 'Department of Transportation' }
};

module.exports = createDualModel('User', userSchema);
