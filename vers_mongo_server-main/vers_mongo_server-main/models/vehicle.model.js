const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const vehicleSchema = new Schema(
  {
    last_four_digit_rc: {
      type: String,
      trim: true,
      uppercase: true,
    },
    last_four_digit_chassis: {
      type: String,
      trim: true,
      uppercase: true,
    },
    contract_no: {
      type: String,
      trim: true,
      uppercase: true,
    },
    financer: {
      type: String,
      trim: true,
      uppercase: true,
    },
    rc_no: {
      type: String,
      trim: true,
      uppercase: true,
    },
    chassis_no: {
      type: String,
      trim: true,
      uppercase: true,
    },
    engine_no: {
      type: String,
      trim: true,
      uppercase: true,
    },
    mek_and_model: {
      type: String,
      trim: true,
      uppercase: true,
    },
    area: {
      type: String,
      trim: true,
      uppercase: true,
    },
    region: {
      type: String,
      trim: true,
      uppercase: true,
    },
    branch: {
      type: String,
      trim: true,
      uppercase: true,
    },
    customer_name: {
      type: String,
      trim: true,
      uppercase: true,
    },
    ex_name: {
      type: String,
      trim: true,
      uppercase: true,
    },
    level1: {
      type: String,
      trim: true,
      uppercase: true,
    },
    level2: {
      type: String,
      trim: true,
      uppercase: true,
    },
    level3: {
      type: String,
      trim: true,
      uppercase: true,
    },
    level4: {
      type: String,
      trim: true,
      uppercase: true,
    },
    level1con: {
      type: String,
      trim: true,
      uppercase: true,
    },
    level2con: {
      type: String,
      trim: true,
      uppercase: true,
    },
    level3con: {
      type: String,
      trim: true,
      uppercase: true,
    },
    level4con: {
      type: String,
      trim: true,
      uppercase: true,
    },
    od: {
      type: String,
      trim: true,
      uppercase: true,
    },
    gv: {
      type: String,
      trim: true,
      uppercase: true,
    },
    ses9: {
      type: String,
      trim: true,
      uppercase: true,
    },
    ses17: {
      type: String,
      trim: true,
      uppercase: true,
    },
    tbr: {
      type: String,
      trim: true,
      uppercase: true,
    },
    poss: {
      type: String,
      trim: true,
      uppercase: true,
    },
    bkt: {
      type: String,
      trim: true,
      uppercase: true,
    },
    branch_id: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      index: true
    },
  },
  {
    timestamps: true,
    collection: "vehicles",
  }
);

// Search indexing
vehicleSchema.index({ last_four_digit_rc: 1 });
vehicleSchema.index({ last_four_digit_chassis: 1 });

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

module.exports = Vehicle;
