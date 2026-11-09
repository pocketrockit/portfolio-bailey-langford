// Booking dashboard demo — sample data, localStorage persistence, search/filter,
// status changes, add/cancel, and live stats. No backend: a real build would use
// a REST API (Express + PostgreSQL/MongoDB) behind the same UI.
var KEY = 'booking-dashboard-appointments';
var SEED = [
  { id: 1, date: '2026-11-09', time: '09:00', customer: 'Maria Santos', service: 'Haircut', price: 35, status: 'completed' },
  { id: 2, date: '2026-11-09', time: '10:30', customer: 'James Carter', service: 'Color', price: 85, status: 'confirmed' },
  { id: 3, date: '2026-11-09', time: '13:00', customer: 'Priya Patel', service: 'Manicure', price: 30, status: 'confirmed' },
  { id: 4, date: '2026-11-10', time: '11:00', customer: 'Angela Brooks', service: 'Massage (60 min)', price: 70, status: 'pending' },
  { id: 5, date: '2026-11-10', time: '15:30', customer: 'David Nguyen', service: 'Haircut', price: 35, status: 'pending' },
  { id: 6, date: '2026-11-11', time: '09:30', customer: 'Sofia Ramirez', service: 'Consultation', price: 0, status: 'confirmed' },
  { id: 7, date: '2026-11-11', time: '14:00', customer: 'Tom Okafor', service: 'Massage (60 min)', price: 70, status: 'cancelled' }
];
var TODAY = '2026-11-09';

function load() {
  try {
    var saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch (e) { /* fall through to seed */ }
  return SEED.map(function (a) { return Object.assign({}, a); });
}
function save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }
var appointments = load();
var nextId = Math.max.apply(null, appointments.map(function (a) { return a.id; })) + 1;

function money(n) { return '$' + n.toFixed(0); }

function render() {
  var query = document.getElementById('search').value.trim().toLowerCase();
  var statusFilter = document.getElementById('status-filter').value;
  var tbody = document.getElementById('appointments-body');
  tbody.innerHTML = '';
  var shown = 0;
  appointments.slice().sort(function (a, b) {
    return (a.date + a.time).localeCompare(b.date + b.time);
  }).forEach(function (appt) {
    if (statusFilter !== 'all' && appt.status !== statusFilter) return;
    if (query && (appt.customer.toLowerCase().indexOf(query) === -1 &&
        appt.service.toLowerCase().indexOf(query) === -1)) return;
    shown++;
    var tr = document.createElement('tr');
    var cells = [
      ['Date', appt.date], ['Time', appt.time], ['Customer', appt.customer],
      ['Service', appt.service], ['Price', money(appt.price)]
    ];
    cells.forEach(function (c) {
      var td = document.createElement('td');
      td.setAttribute('data-label', c[0]);
      td.textContent = c[1];
      tr.appendChild(td);
    });
    var statusTd = document.createElement('td');
    statusTd.setAttribute('data-label', 'Status');
    var badge = document.createElement('span');
    badge.className = 'status status-' + appt.status;
    badge.textContent = appt.status;
    statusTd.appendChild(badge);
    tr.appendChild(statusTd);
    var actionTd = document.createElement('td');
    actionTd.setAttribute('data-label', 'Actions');
    if (appt.status === 'pending' || appt.status === 'confirmed') {
      var doneBtn = document.createElement('button');
      doneBtn.className = 'row-btn'; doneBtn.type = 'button'; doneBtn.textContent = 'Complete';
      doneBtn.addEventListener('click', function () { appt.status = 'completed'; save(appointments); render(); });
      var cancelBtn = document.createElement('button');
      cancelBtn.className = 'row-btn'; cancelBtn.type = 'button'; cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', function () { appt.status = 'cancelled'; save(appointments); render(); });
      actionTd.appendChild(doneBtn); actionTd.appendChild(cancelBtn);
    } else {
      actionTd.textContent = '—';
    }
    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  });
  document.getElementById('no-results').hidden = shown !== 0;

  var today = appointments.filter(function (a) { return a.date === TODAY && a.status !== 'cancelled'; });
  var upcoming = appointments.filter(function (a) { return a.date >= TODAY && a.status !== 'cancelled' && a.status !== 'completed'; });
  var revenue = upcoming.reduce(function (sum, a) { return sum + a.price; }, 0);
  var customers = {};
  appointments.forEach(function (a) { customers[a.customer] = (customers[a.customer] || 0) + 1; });
  document.getElementById('stat-today').textContent = today.length;
  document.getElementById('stat-upcoming').textContent = upcoming.length;
  document.getElementById('stat-customers').textContent = Object.keys(customers).length;
  document.getElementById('stat-revenue').textContent = money(revenue);

  var list = document.getElementById('customer-list');
  list.innerHTML = '';
  Object.keys(customers).sort().forEach(function (name) {
    var li = document.createElement('li');
    li.textContent = name + ' — ' + customers[name] + ' appointment' + (customers[name] > 1 ? 's' : '');
    list.appendChild(li);
  });
}

document.getElementById('search').addEventListener('input', render);
document.getElementById('status-filter').addEventListener('change', render);
document.getElementById('reset-demo').addEventListener('click', function () {
  localStorage.removeItem(KEY);
  appointments = load();
  nextId = Math.max.apply(null, appointments.map(function (a) { return a.id; })) + 1;
  render();
});

document.getElementById('add-form').addEventListener('submit', function (event) {
  event.preventDefault();
  var form = event.target;
  var serviceParts = form.service.value.split(' — $');
  appointments.push({
    id: nextId++,
    date: form.date.value,
    time: form.time.value,
    customer: form.customer.value.trim(),
    service: serviceParts[0],
    price: parseFloat(serviceParts[1]) || 0,
    status: 'pending'
  });
  save(appointments);
  render();
  document.getElementById('form-status').textContent = 'Appointment added as pending.';
  form.reset();
});

render();
