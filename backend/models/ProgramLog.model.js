import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sets: { type: Number, default: 0 },
    reps: { type: String, default: '' }, // може бути "8-12" або "1 хв"
    weight: { type: Number, default: 0 }, // опціонально
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const programLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    notes: { type: String, default: '' },
    exercises: { type: [exerciseSchema], default: [] },
  },
  { timestamps: true }
);

const ProgramLog = mongoose.model('ProgramLog', programLogSchema);
export default ProgramLog;