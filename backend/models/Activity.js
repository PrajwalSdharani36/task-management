import mongoose from 'mongoose';

export const ACTIVITY_TYPES = Object.freeze(['created', 'status', 'assigned', 'priority', 'due_date', 'edited', 'comment']);

const activitySchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    from: { type: String },
    to: { type: String },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment must be at most 1000 characters'],
      required: [
        function needsText() {
          return this.type === 'comment';
        },
        'Comment cannot be empty',
      ],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

activitySchema.index({ task: 1, createdAt: 1 });

export default mongoose.model('Activity', activitySchema);
