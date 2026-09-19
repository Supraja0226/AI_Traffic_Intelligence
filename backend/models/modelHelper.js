const mongoose = require('mongoose');
const { isUsingFallback, getMemoryModel } = require('../config/db');

function createDualModel(name, schemaDefinition) {
  const schema = new mongoose.Schema(schemaDefinition, { timestamps: true });
  let mongooseModel;
  try {
    mongooseModel = mongoose.model(name, schema);
  } catch (e) {
    mongooseModel = mongoose.models[name];
  }

  // Proxy object that transparently routes calls to live Mongoose or in-memory fallback
  return new Proxy({}, {
    get(target, prop) {
      if (isUsingFallback()) {
        const memModel = getMemoryModel(name);
        if (typeof memModel[prop] === 'function') {
          return memModel[prop].bind(memModel);
        }
        return memModel[prop];
      }
      return mongooseModel[prop];
    }
  });
}

module.exports = { createDualModel };
