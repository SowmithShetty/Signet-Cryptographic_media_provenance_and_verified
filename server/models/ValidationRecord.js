import mongoose from 'mongoose';

const { Schema } = mongoose;

const provenanceActionSchema = new Schema({
  actionName: { type: String, required: true },
  software: { type: String, default: 'Unknown' },
  softwareVersion: { type: String, default: '' },
  timestamp: { type: String, default: '' },
  operator: { type: String, default: 'Unknown' },
  signatureValid: { type: Boolean, default: false },
  hashAlgorithm: { type: String, default: 'SHA-256' },
  hash: { type: String, default: '' },
}, { _id: false });

const validationRecordSchema = new Schema({
  // File metadata
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },

  // C2PA manifest data
  hasManifest: { type: Boolean, default: false },
  activeManifest: { type: Schema.Types.Mixed, default: null },
  manifestCount: { type: Number, default: 0 },
  validationStatus: [Schema.Types.Mixed],
  signatureValid: { type: Boolean, default: false },

  // Parsed provenance chain for timeline visualization
  provenanceChain: [provenanceActionSchema],

  // Claim generator info
  claimGenerator: { type: String, default: '' },

  // Error info (for files that failed parsing)
  error: { type: String, default: null },

  // Meta
  analyzedAt: { type: Date, default: Date.now },
});

// Index for quick lookups
validationRecordSchema.index({ analyzedAt: -1 });
validationRecordSchema.index({ fileName: 1 });

const ValidationRecord = mongoose.model('ValidationRecord', validationRecordSchema);

export default ValidationRecord;
