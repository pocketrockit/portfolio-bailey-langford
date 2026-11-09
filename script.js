// Contact form: builds a mailto link — nothing is sent or stored by this site.
document.getElementById('contact-form').addEventListener('submit', function (event) {
  event.preventDefault();
  var form = event.target;
  var name = form.name.value.trim();
  var email = form.email.value.trim();
  var type = form.type.value;
  var message = form.message.value.trim();
  var subject = encodeURIComponent('Portfolio enquiry — ' + type + ' — ' + name);
  var body = encodeURIComponent(
    'Name: ' + name + '\nEmail: ' + email + '\nType: ' + type + '\n\n' + message
  );
  window.location.href = 'mailto:pocketterockette@proton.me?subject=' + subject + '&body=' + body;
  document.getElementById('contact-status').textContent =
    'Opening your email app addressed to Bailey — please send it from there.';
});
