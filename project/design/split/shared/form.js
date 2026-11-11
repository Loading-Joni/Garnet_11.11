
(function () {
 // Заявка уходит на почту клиники через formsubmit.co. Адрес получателя меняется в этой строке.
 var FORM_ENDPOINT = 'https://formsubmit.co/ajax/garnetgithub@gmail.com';
 var BTN = document.getElementById('request-submit'), OUTP = document.getElementById('request-feedback');
 if (!BTN || !OUTP) return;
 function failed() {
  BTN.disabled = false;
  OUTP.innerHTML = '<p>Заявка не отправилась. Позвоните <a href="tel:+79182227336">+7 918 222-73-36</a> или воспользуйтесь кнопкой «Написать в MAX» рядом.</p>';
 }
 BTN.addEventListener('click', function () {
  var form = document.getElementById('request');
  var nameField = form.querySelector('input[name="name"]');
  var phone = form.querySelector('input[data-phone]');
  var consent = form.querySelector('input[type=checkbox]');
  var calculation = document.getElementById('request-calculation');
  var digits = (phone && phone.value || '').replace(/\D/g, '');
  if (digits.length !== 11 || (digits[0] !== '7' && digits[0] !== '8')) {
   OUTP.innerHTML = '<p>Проверьте номер телефона: нужен российский номер из 11 цифр.</p>';
   return;
  }
  if (!consent || !consent.checked) {
   OUTP.innerHTML = '<p>Для отправки необходимо согласие на обработку персональных данных.</p>';
   return;
  }
  var payload = new URLSearchParams();
  payload.append('name', ((nameField && nameField.value) || '').trim());
  payload.append('phone', phone.value.trim());
  payload.append('consent', 'yes');
  if (calculation && calculation.value) payload.append('calculation', calculation.value);
  payload.append('_subject', 'Новая заявка с сайта стоматологии «Гарнет»');
  payload.append('_template', 'table');
  BTN.disabled = true;
  OUTP.innerHTML = '<p>Отправляем заявку…</p>';
  fetch(FORM_ENDPOINT, {
   method: 'POST',
   headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', 'Accept': 'application/json' },
   body: payload.toString()
  }).then(function (res) {
   return res.json().catch(function () { return { success: 'false' }; });
  }).then(function (data) {
   if (String(data.success) === 'true') { location.href = 'thanks.html'; return; }
   failed();
  }).catch(failed);
 });
})();

