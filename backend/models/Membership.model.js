import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  durationDays: {
    type: Number,
    required: true,
  },
  visits: {
    type: Number,
    required: true,
    default: 0,
  },
}, {
  timestamps: true,
});

const Membership = mongoose.model('Membership', membershipSchema);

export default Membership;