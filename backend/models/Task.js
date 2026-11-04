import mongoose from 'mongoose';
import { TASK_PRIORITY, TASK_STATUS } from '../config/roles.js';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title must be at most 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description must be at most 2000 characters'],
      default: '',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must be assigned to a user'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    priority: {
      type: String,
      enum: { values: TASK_PRIORITY, message: 'Priority must be low, medium or high' },
      default: 'medium',
    },
    status: {
      type: String,
      enum: { values: TASK_STATUS, message: 'Status must be todo, in_progress or completed' },
      default: 'todo',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        delete ret.id;
        return ret;
      },
    },
  }
);

taskSchema.virtual('isOverdue').get(function isOverdue() {
  return this.status !== 'completed' && this.dueDate < new Date();
});

const refId = (value) => (value?._id ?? value)?.toString();

function snapshot(doc) {
  return {
    status: doc.status,
    priority: doc.priority,
    assignedTo: refId(doc.assignedTo),
    dueDate: doc.dueDate?.toISOString().slice(0, 10),
    title: doc.title,
    description: doc.description,
  };
}

taskSchema.post('init', function rememberOriginal() {
  this.$locals.original = snapshot(this);
});

taskSchema.pre('save', function collectChanges() {
  if (!this.$locals.actor) return;

  if (this.isNew) {
    this.$locals.events = [{ type: 'created' }];
    return;
  }

  const before = this.$locals.original ?? {};
  const after = snapshot(this);
  const events = [];

  if (after.status !== before.status) events.push({ type: 'status', from: before.status, to: after.status });
  if (after.assignedTo !== before.assignedTo) {
    events.push({ type: 'assigned', fromUser: before.assignedTo, toUser: after.assignedTo });
  }
  if (after.priority !== before.priority) events.push({ type: 'priority', from: before.priority, to: after.priority });
  if (after.dueDate !== before.dueDate) events.push({ type: 'due_date', from: before.dueDate, to: after.dueDate });
  if (after.title !== before.title || after.description !== before.description) events.push({ type: 'edited' });

  this.$locals.events = events;
});

taskSchema.post('save', async function recordActivity() {
  const events = this.$locals.events;
  if (!events?.length) return;

  await mongoose.model('Activity').insertMany(
    events.map((event) => ({ ...event, task: this._id, actor: this.$locals.actor }))
  );

  this.$locals.events = [];
  this.$locals.original = snapshot(this);
});

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });

export default mongoose.model('Task', taskSchema);
