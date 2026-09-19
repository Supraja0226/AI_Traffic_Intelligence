const mongoose = require('mongoose');

let isConnected = false;
let usingFallback = false;

// Resilient In-Memory Collection Mock for environments without active MongoDB daemon
class MemoryCollection {
  constructor(name) {
    this.name = name;
    this.items = [];
  }

  _matches(item, filter = {}) {
    for (const [key, val] of Object.entries(filter)) {
      if (key === '_id') {
        if (String(item._id) !== String(val)) return false;
      } else if (typeof val === 'object' && val !== null) {
        if (val.$in && !val.$in.includes(item[key])) return false;
        if (val.$gte !== undefined && item[key] < val.$gte) return false;
        if (val.$lte !== undefined && item[key] > val.$lte) return false;
      } else if (item[key] !== val) {
        return false;
      }
    }
    return true;
  }

  async find(filter = {}) {
    const matched = this.items.filter(i => this._matches(i, filter));
    const cloned = JSON.parse(JSON.stringify(matched));
    return {
      sort: (sortCriteria) => ({
        limit: (limitCount) => cloned.slice(0, limitCount),
        lean: () => cloned,
        then: (resolve) => resolve(cloned)
      }),
      limit: (limitCount) => cloned.slice(0, limitCount),
      lean: () => cloned,
      then: (resolve) => resolve(cloned)
    };
  }

  async findOne(filter = {}) {
    const found = this.items.find(i => this._matches(i, filter));
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(data) {
    const isArray = Array.isArray(data);
    const records = isArray ? data : [data];
    const created = records.map(r => ({
      _id: r._id || `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...r
    }));
    this.items.push(...created);
    return isArray ? created : created[0];
  }

  async insertMany(records) {
    return this.create(records);
  }

  async updateOne(filter, update) {
    const index = this.items.findIndex(i => this._matches(i, filter));
    if (index !== -1) {
      const setVals = update.$set || update;
      this.items[index] = { ...this.items[index], ...setVals, updatedAt: new Date() };
      return { matchedCount: 1, modifiedCount: 1 };
    }
    return { matchedCount: 0, modifiedCount: 0 };
  }

  async deleteMany(filter = {}) {
    const initial = this.items.length;
    this.items = this.items.filter(i => !this._matches(i, filter));
    return { deletedCount: initial - this.items.length };
  }

  async countDocuments(filter = {}) {
    return this.items.filter(i => this._matches(i, filter)).length;
  }
}

const memoryStore = new Map();
function getMemoryModel(name) {
  if (!memoryStore.has(name)) {
    memoryStore.set(name, new MemoryCollection(name));
  }
  return memoryStore.get(name);
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/traffic_intel';
  try {
    // Attempt Mongoose connection with 2.5s timeout for fast fallback
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
      connectTimeoutMS: 2500
    });
    isConnected = true;
    usingFallback = false;
    console.log(`[Database] Connected to live MongoDB: ${uri}`);
  } catch (err) {
    console.warn(`[Database] Standalone MongoDB server not reachable at ${uri}.`);
    console.log(`[Database] Activating Resilient In-Memory High-Performance Storage Fallback.`);
    isConnected = true;
    usingFallback = true;
  }
};

module.exports = {
  connectDB,
  isUsingFallback: () => usingFallback,
  getMemoryModel
};
