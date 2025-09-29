const mongoose = require('mongoose');
const { Schema } = mongoose;  // ✅ Needed for ConversionSchema

// Define the WabaUser Schema
const wabaUserSchema = new Schema({
  // The user's phone number, which will be unique in the database
  mobile: {
    type: String,
    required: true,
    unique: true
  },
  // The full name of the user from their WhatsApp profile
  fullName: {
    type: String,
    required: true
  },
  // The WhatsApp ID, which is a unique identifier from the webhook payload
  wa_id: {
    type: String,
    required: false
  },
  // A timestamp for when the contact was first added
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Define the Conversion Schema
const ConversionSchema = new Schema(
  {
    offer_id: {
      type: Number,
      required: true,
      index: true,
    },
    pid: {
      type: Number,
      required: true,
    },
    click_id: {
      type: String,
      required: true,
      index: true,
    },
    sub1: {
      type: String,
      required: true,
      index: true,
    },
    offerName: String,
    affliateName: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    goal: {
      type: Number,
      enum: [1, 2, 3],
    },
    status: {
      type: String,
      enum: ["Completed", "Pending"],
      default: "Pending",
    },
    brand: String,
    utm_source: String,
    source_info: {
      campaignId: String,
      zoneId: String,
      lang: String,
    },
    api: {
      status: Boolean,
      url: String,
      response: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Create and export the models
const WabaUser = mongoose.model('WabaUser', wabaUserSchema);
const Conversions = mongoose.model('Conversions', ConversionSchema);

module.exports = { WabaUser, Conversions };
