import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    dateTime: { type: Date, required: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const Schedule = mongoose.model('Schedule', scheduleSchema);
export default Schedule;