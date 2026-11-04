import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Activity from '../models/Activity.js';

const DEFAULT_PASSWORD = 'Password@123';

const users = [
  { key: 'admin', name: 'Asha Admin', email: 'admin@team6.dev', role: 'admin' },
  { key: 'manager', name: 'Manoj Manager', email: 'manager@team6.dev', role: 'manager' },
  { key: 'manager2', name: 'Meera Manager', email: 'manager2@team6.dev', role: 'manager' },
  { key: 'prajwal', name: 'Prajwal S Dharani', email: 'prajwal@team6.dev', role: 'employee' },
  { key: 'navya', name: 'Chaganti Navya Sri', email: 'navya@team6.dev', role: 'employee' },
  { key: 'sasidhar', name: 'Puvvada Sasidhar', email: 'sasidhar@team6.dev', role: 'employee' },
  { key: 'khadar', name: 'Shaik Khadar Ahamad', email: 'khadar@team6.dev', role: 'employee' },
];

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const tasks = [
  { title: 'Build dashboard and task pages', description: 'Create the Dashboard, My Tasks and Task Details views with reusable TaskCard and TaskForm components.', assignedTo: 'prajwal', createdBy: 'manager', priority: 'high', status: 'in_progress', dueDate: daysFromNow(2) },
  { title: 'Design dashboard wireframe', description: 'Sketch the dashboard layout with summary cards and recent tasks.', assignedTo: 'prajwal', createdBy: 'manager', priority: 'medium', status: 'completed', dueDate: daysFromNow(-3) },
  { title: 'Set up Pinia stores and route guards', description: 'Create authStore and taskStore, and protect routes with meta.requiresAuth and meta.roles.', assignedTo: 'navya', createdBy: 'manager', priority: 'high', status: 'in_progress', dueDate: daysFromNow(3) },
  { title: 'Fix login redirect after refresh', description: 'Users should return to the page they were on after logging in again.', assignedTo: 'navya', createdBy: 'manager2', priority: 'medium', status: 'todo', dueDate: daysFromNow(-1) },
  { title: 'Implement JWT auth middleware', description: 'protect and authorize middleware with clear 401 and 403 responses.', assignedTo: 'sasidhar', createdBy: 'manager', priority: 'high', status: 'completed', dueDate: daysFromNow(-5) },
  { title: 'Write API documentation', description: 'Document every endpoint with request and response examples.', assignedTo: 'sasidhar', createdBy: 'manager2', priority: 'medium', status: 'todo', dueDate: daysFromNow(5) },
  { title: 'Design User and Task schemas', description: 'Mongoose models with validation, enums, references and timestamps.', assignedTo: 'khadar', createdBy: 'manager', priority: 'high', status: 'completed', dueDate: daysFromNow(-4) },
  { title: 'Set up MongoDB indexes and seed data', description: 'Add indexes for assignedTo, status and dueDate, and realistic demo data.', assignedTo: 'khadar', createdBy: 'manager2', priority: 'low', status: 'todo', dueDate: daysFromNow(7) },
  { title: 'Review pull requests', description: 'Review open PRs on the develop branch before the weekly merge.', assignedTo: 'manager', createdBy: 'admin', priority: 'high', status: 'todo', dueDate: daysFromNow(1) },
  { title: 'Test role-based access end to end', description: 'Try admin-only APIs as an employee and confirm 403 responses.', assignedTo: 'prajwal', createdBy: 'manager2', priority: 'medium', status: 'todo', dueDate: daysFromNow(4) },
];

const comments = [
  { task: 'Build dashboard and task pages', author: 'manager', text: 'Please reuse TaskCard on the dashboard as well, so both pages look the same.' },
  { task: 'Build dashboard and task pages', author: 'prajwal', text: 'Done — the dashboard now uses the compact version of TaskCard.' },
  { task: 'Fix login redirect after refresh', author: 'manager2', text: 'This is overdue now. Any blockers?' },
  { task: 'Fix login redirect after refresh', author: 'navya', text: 'The redirect query was lost after logout. Fix is ready for review.' },
  { task: 'Implement JWT auth middleware', author: 'sasidhar', text: 'protect and authorize are merged. Expired tokens now return 401 with a clear message.' },
];

const hoursAfter = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);

function buildActivity(taskDocs, created) {
  const entries = [];
  taskDocs.forEach((task) => {
    const start = task.createdAt;
    entries.push({ task: task._id, actor: task.createdBy, type: 'created', createdAt: start });
    if (task.status !== 'todo') {
      entries.push({ task: task._id, actor: task.assignedTo, type: 'status', from: 'todo', to: 'in_progress', createdAt: hoursAfter(start, 20) });
    }
    if (task.status === 'completed') {
      entries.push({ task: task._id, actor: task.assignedTo, type: 'status', from: 'in_progress', to: 'completed', createdAt: hoursAfter(start, 50) });
    }
  });

  comments.forEach((c, i) => {
    const task = taskDocs.find((t) => t.title === c.task);
    entries.push({ task: task._id, actor: created[c.author]._id, type: 'comment', text: c.text, createdAt: hoursAfter(task.createdAt, 26 + i * 3) });
  });

  return entries;
}

async function seed() {
  await connectDB();

  await Activity.deleteMany({});
  await Task.deleteMany({});
  await User.deleteMany({});

  const created = {};
  for (const { key, ...data } of users) {
    created[key] = await User.create({ ...data, password: DEFAULT_PASSWORD });
  }

  const taskDocs = await Task.insertMany(
    tasks.map((t, i) => ({
      ...t,
      assignedTo: created[t.assignedTo]._id,
      createdBy: created[t.createdBy]._id,
      createdAt: daysFromNow(-(7 - (i % 4))),
    }))
  );

  const activity = await Activity.insertMany(buildActivity(taskDocs, created));

  const roleCount = (role) => users.filter((u) => u.role === role).length;
  console.log(`Seeded ${users.length} users (${roleCount('admin')} admin, ${roleCount('manager')} managers, ${roleCount('employee')} employees), ${tasks.length} tasks and ${activity.length} activity entries.`);
  console.log(`All accounts use the password: ${DEFAULT_PASSWORD}`);
  users.forEach((u) => console.log(`  ${u.role.padEnd(8)} ${u.email}`));
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
