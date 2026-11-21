const BASE = process.env.API_URL || 'http://localhost:5000/api';
const PASSWORD = 'Password@123';

let passed = 0;
let failed = 0;

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

function check(name, actual, expected) {
  const ok = actual === expected;
  ok ? passed++ : failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  (expected ${expected}, got ${actual})`);
}

async function login(email) {
  const { body } = await call('POST', '/auth/login', { body: { email, password: PASSWORD } });
  if (!body.success) throw new Error(`Login failed for ${email}. Did you run "npm run seed"?`);
  return { token: body.data.token, user: body.data.user };
}

async function run() {
  const admin = await login('asha@team6.dev');
  const manager = await login('manoj@team6.dev');
  const prajwal = await login('prajwal@team6.dev');
  const navya = await login('navya@team6.dev');

  check('Wrong password is rejected', (await call('POST', '/auth/login', { body: { email: 'prajwal@team6.dev', password: 'nope' } })).status, 401);
  await login('prajwal@team6.dev');

  const lockEmail = `locktest${Date.now()}@team6.dev`;
  for (let i = 0; i < 5; i++) await call('POST', '/auth/login', { body: { email: lockEmail, password: 'wrong' } });
  check('Login locked after 5 failed attempts', (await call('POST', '/auth/login', { body: { email: lockEmail, password: 'wrong' } })).status, 429);
  check('No token on protected API', (await call('GET', '/tasks')).status, 401);
  check('Garbage token on protected API', (await call('GET', '/tasks', { token: 'abc.def.ghi' })).status, 401);

  const created = await call('POST', '/tasks', {
    token: manager.token,
    body: { title: 'Smoke test task', assignedTo: prajwal.user._id, priority: 'high', dueDate: new Date(Date.now() + 864e5) },
  });
  check('Manager creates a task', created.status, 201);
  const taskId = created.body.data.task._id;

  check('Employee cannot create tasks', (await call('POST', '/tasks', { token: prajwal.token, body: { title: 'x' } })).status, 403);

  const prajwalTasks = await call('GET', '/tasks?limit=100', { token: prajwal.token });
  const onlyOwn = prajwalTasks.body.data.tasks.every((t) => t.assignedTo._id === prajwal.user._id);
  check('Employee sees only assigned tasks', onlyOwn, true);

  check('Assignee can view the task', (await call('GET', `/tasks/${taskId}`, { token: prajwal.token })).status, 200);
  check('Other employee cannot view it by ID', (await call('GET', `/tasks/${taskId}`, { token: navya.token })).status, 404);
  check('Assignee updates status', (await call('PATCH', `/tasks/${taskId}`, { token: prajwal.token, body: { status: 'in_progress' } })).status, 200);
  check('Assignee cannot change the title', (await call('PATCH', `/tasks/${taskId}`, { token: prajwal.token, body: { title: 'Hacked' } })).status, 403);
  check('Invalid status is rejected', (await call('PATCH', `/tasks/${taskId}`, { token: prajwal.token, body: { status: 'done' } })).status, 400);
  check('Manager updates own task', (await call('PATCH', `/tasks/${taskId}`, { token: manager.token, body: { priority: 'low' } })).status, 200);
  const comment = await call('POST', `/tasks/${taskId}/comments`, { token: prajwal.token, body: { text: 'Started on this' } });
  check('Assignee can comment', comment.status, 201);
  check('Other employee cannot comment', (await call('POST', `/tasks/${taskId}/comments`, { token: navya.token, body: { text: 'hi' } })).status, 404);
  const history = await call('GET', `/tasks/${taskId}/activity`, { token: manager.token });
  const types = history.body.data.activity.map((a) => a.type);
  check('History recorded create, status change and comment', ['created', 'status', 'priority', 'comment'].every((t) => types.includes(t)), true);
  const commentId = comment.body.data.comment._id;
  check('Manager cannot delete someone else\'s comment', (await call('DELETE', `/tasks/${taskId}/comments/${commentId}`, { token: manager.token })).status, 403);
  check('Author deletes own comment', (await call('DELETE', `/tasks/${taskId}/comments/${commentId}`, { token: prajwal.token })).status, 200);

  check('Employee cannot delete', (await call('DELETE', `/tasks/${taskId}`, { token: prajwal.token })).status, 403);
  check('Employee cannot list users', (await call('GET', '/users', { token: prajwal.token })).status, 403);
  check('Manager cannot change roles', (await call('PATCH', `/users/${prajwal.user._id}`, { token: manager.token, body: { role: 'admin' } })).status, 403);
  check('Unknown task ID returns 404', (await call('GET', '/tasks/64b7f0000000000000000000', { token: admin.token })).status, 404);
  check('Malformed task ID returns 404', (await call('GET', '/tasks/not-an-id', { token: admin.token })).status, 404);

  const outsider = await call('POST', '/auth/register', {
    body: { name: 'Outside User', email: `outsider${Date.now()}@gmail.com`, password: 'secret12' },
  });
  check('Registration outside @team6.dev is rejected', outsider.status, 400);

  const reg = await call('POST', '/auth/register', {
    body: { name: 'Sneaky User', email: `sneaky${Date.now()}@team6.dev`, password: 'secret12', role: 'admin' },
  });
  check('Self-registration ignores role=admin', reg.body.data?.user?.role, 'employee');
  if (reg.body.data?.user) await call('DELETE', `/users/${reg.body.data.user._id}`, { token: admin.token });

  check('Manager deletes own task', (await call('DELETE', `/tasks/${taskId}`, { token: manager.token })).status, 200);
  check('Deleted task is gone', (await call('GET', `/tasks/${taskId}`, { token: admin.token })).status, 404);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exitCode = failed ? 1 : 0;
}

run().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
