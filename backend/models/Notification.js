const { createDualModel } = require('./modelHelper');

const notificationSchema = {
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['INFO', 'WARNING', 'ALERT', 'SUCCESS'], default: 'INFO' },
  read: { type: Boolean, default: false },
  targetRoles: { type: Array, default: ['admin', 'analyst', 'operator', 'viewer'] },
  link: { type: String }
};

module.exports = createDualModel('Notification', notificationSchema);
