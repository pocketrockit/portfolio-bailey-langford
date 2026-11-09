// Houston Bistro — menu data, filtering, and a booking form saved to localStorage.
var MENU = [
  { name: 'Gulf Shrimp Cocktail', desc: 'Chilled Gulf shrimp, cocktail sauce, lemon.', price: 14, cat: 'starters' },
  { name: 'Fried Green Tomatoes', desc: 'Cornmeal-crusted, remoulade, pickled okra.', price: 11, cat: 'starters' },
  { name: 'Queso & Chips', desc: 'House queso, roasted poblanos, warm tortilla chips.', price: 9, cat: 'starters' },
  { name: 'Chicken Fried Steak', desc: 'Cream gravy, mashed potatoes, green beans.', price: 19, cat: 'mains' },
  { name: 'Blackened Gulf Redfish', desc: 'Dirty rice, grilled vegetables, lemon butter.', price: 26, cat: 'mains' },
  { name: 'Smoked Brisket Plate', desc: '12-hour smoked brisket, slaw, pickles, Texas toast.', price: 22, cat: 'mains' },
  { name: 'Veggie Enchiladas', desc: 'Roasted vegetables, green chile sauce, rice and beans.', price: 16, cat: 'mains' },
  { name: 'Pecan Pie', desc: 'Warm pecan pie, vanilla ice cream.', price: 8, cat: 'desserts' },
  { name: 'Tres Leches Cake', desc: 'Sponge cake soaked in three milks, cinnamon.', price: 9, cat: 'desserts' }
];

function renderMenu(filter) {
  var grid = document.getElementById('menu-grid');
  grid.innerHTML = '';
  MENU.filter(function (item) { return filter === 'all' || item.cat === filter; })
    .forEach(function (item) {
      var div = document.createElement('div');
      div.className = 'menu-item';
      div.innerHTML = '<h3><span></span><span class="price">$' + item.price + '</span></h3><p></p>';
      div.querySelector('h3 span').textContent = item.name;
      div.querySelector('p').textContent = item.desc;
      grid.appendChild(div);
    });
}
renderMenu('all');

document.querySelectorAll('.filter-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    renderMenu(btn.dataset.filter);
  });
});

// Bookings stored in localStorage (demo — a real site would POST to a server).
var KEY = 'houston-bistro-bookings';
function loadBookings() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
function saveBookings(list) { localStorage.setItem(KEY, JSON.stringify(list)); }

function renderBookings() {
  var list = document.getElementById('my-bookings');
  var bookings = loadBookings();
  list.innerHTML = '';
  if (!bookings.length) {
    var li = document.createElement('li');
    li.textContent = 'No bookings yet on this device.';
    list.appendChild(li);
    return;
  }
  bookings.forEach(function (b, i) {
    var li = document.createElement('li');
    var span = document.createElement('span');
    span.textContent = b.date + ' at ' + b.time + ' — ' + b.name + ', party of ' + b.party;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Cancel';
    btn.addEventListener('click', function () {
      var all = loadBookings();
      all.splice(i, 1);
      saveBookings(all);
      renderBookings();
    });
    li.appendChild(span);
    li.appendChild(btn);
    list.appendChild(li);
  });
}
renderBookings();

var dateInput = document.getElementById('booking-date');
dateInput.min = new Date().toISOString().split('T')[0];

document.getElementById('booking-form').addEventListener('submit', function (event) {
  event.preventDefault();
  var form = event.target;
  var booking = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    date: form.date.value,
    time: form.time.value,
    party: form.party.value,
    notes: form.notes.value.trim()
  };
  var bookings = loadBookings();
  bookings.push(booking);
  saveBookings(bookings);
  renderBookings();
  document.getElementById('booking-status').textContent =
    'Thanks, ' + booking.name + '! Your table for ' + booking.party + ' on ' + booking.date +
    ' at ' + booking.time + ' is requested. We will confirm by email.';
  form.reset();
});
