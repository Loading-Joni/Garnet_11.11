
(function () {
 // Заявка уходит на почту клиники через formsubmit.co. Адрес получателя меняется в этой строке.
 var FORM_ENDPOINT = 'https://formsubmit.co/ajax/AshermetEvgeniy@yandex.ru';
 var BTN = document.getElementById('request-submit'), OUTP = document.getElementById('request-feedback');
 if (!BTN || !OUTP) return;
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
    var _q = new URLSearchParams(location.search), _n = new Date(), _k = new Date(_n.getTime() + _n.getTimezoneOffset() * 60000 + 10800000);
  function _g(key) { var v = (_q.get(key) || '').slice(0, 120); if (v) payload.append(key, v); return v; }
  var _pg = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
  var _pl = ({ 'veneers': 'Виниры', 'implants': 'Имплантация', 'all-on-4': 'All-on-4', 'index': 'Главная' })[_pg] || _pg;
  var _dt = _k.getFullYear() + '-' + ('0' + (_k.getMonth() + 1)).slice(-2) + '-' + ('0' + _k.getDate()).slice(-2) + ' ' + ('0' + _k.getHours()).slice(-2) + ':' + ('0' + _k.getMinutes()).slice(-2) + ' МСК';
  payload.append('page', _pg);
  payload.append('datetime', _dt);
  if (document.referrer) payload.append('ref', document.referrer.slice(0, 200));
  var _us = _g('utm_source'), _um = _g('utm_medium'), _uc = _g('utm_campaign'), _ut = _g('utm_term'), _uo = _g('utm_content');
  var _src = [_us, _um, _uc || _ut || _uo].filter(function (x) { return x; }).join(' / ');
  payload.append('_subject', 'Заявка · ' + _pl + ' · ' + (_src || 'без метки') + ' · ' + (((nameField && nameField.value) || '').trim() || 'без имени'));
  payload.append('_template', 'table');
  BTN.disabled = true;
  OUTP.innerHTML = '<p>Отправляем заявку…</p>';
  var _bd = payload.toString(), _went = false;
  function _go() { if (_went) return; _went = true; location.replace('thanks.html'); }
  var _sent = false;
  try { _sent = !!navigator.sendBeacon && navigator.sendBeacon(FORM_ENDPOINT, new Blob([_bd], { type: 'application/x-www-form-urlencoded' })); } catch (e) { _sent = false; }
  if (_sent) { _go(); return; }
  fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', 'Accept': 'application/json' }, body: _bd }).catch(function () { return null; }).then(_go);
  setTimeout(_go, 4000);
 });
})();

