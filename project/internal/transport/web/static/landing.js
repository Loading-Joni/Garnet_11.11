(function () {
 'use strict';
 const money = n => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
 const esc = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const line = (name, value) => '<div class="result-line"><span>'+esc(name)+'</span><strong>'+esc(value)+'</strong></div>';
 function update(panel) {
  const result = panel.querySelector('.result');
  const choices = panel.querySelectorAll('.choices .choice');
  const selected = Array.from(choices).find(x => x.classList.contains('selected'));
  const unknown = selected && selected.textContent.includes('Не знаю');
  let count = selected ? parseInt(selected.textContent, 10) : 1;
  const items = [];
  let lines = '', amount = 0;
  if (panel.classList.contains('all-panel')) {
   count = selected && selected.textContent.includes('Обе') ? 2 : 1;
   const material = panel.querySelector('.material.picked');
   const name = material.querySelector('strong').textContent;
   const price = Number(material.querySelector('b').textContent.replace(/\D/g,'')) || 0;
   const unit = material.dataset.unit ? Number(material.dataset.unit) : count;
   amount = unit * price;
   lines = line(selected.textContent, count+' '+(count === 2 ? 'челюсти' : 'челюсть')) + line(name, money(amount));
   items.push(unit+' × '+name+' — '+money(price)+(material.dataset.unit ? ' за единицу' : ' за челюсть'));
   const temporary = Array.from(panel.querySelectorAll('.material')).indexOf(material) < 2;
   result.querySelector('.not-package').textContent = 'Это стоимость выбранного протеза. Не стоимость All-on-4 под ключ.';
   result.querySelector('.excluded ul').innerHTML = '<li>Имплантаты и их установка</li><li>Абатменты и дополнительные компоненты</li><li>'+(temporary ? 'Постоянный протез' : 'Временный протез')+'</li><li>Диагностика, удаление и подготовка тканей</li><li>Другие услуги, назначенные врачом</li>';
  } else if (panel.classList.contains('implant-panel')) {
   panel.querySelectorAll('.material.picked').forEach(material => {
    const name = material.querySelector('strong').textContent;
    const price = Number(material.querySelector('b').textContent.replace(/\D/g,'')) || 0;
    const unit = material.dataset.unit ? Number(material.dataset.unit) : count;
    if (!unknown) { amount += unit * price; lines += line(unit+' × '+name, money(unit * price)); items.push(unit+' × '+name+' — '+money(price)+' за единицу'); }
   });
   result.querySelector('h3').textContent = unknown ? 'Количество уточнит врач' : 'Восстановление: '+selected.textContent;
  } else {
   const price = m => Number(m.querySelector('b').textContent.replace(/\D/g,'')) || 0;
   const name = m => m.querySelector('strong').textContent;
   const unitOf = m => m.dataset.unit === 'tooth' ? count : 1;
   const main = panel.querySelector('.materials.main .material.picked');
   if (!unknown && main) {
    amount = count * price(main);
    items.push(count+' × '+name(main)+' — '+money(price(main))+' за единицу');
   }
   if (!unknown) panel.querySelectorAll('.materials.multi .material.picked').forEach(m => {
    const q = unitOf(m) * price(m);
    amount += q;
    lines += line(name(m)+(unitOf(m) > 1 ? ' × '+unitOf(m) : ''), money(q));
    items.push(name(m)+' — '+money(q)+(unitOf(m) > 1 ? ' ('+unitOf(m)+' × '+money(price(m))+')' : ''));
   });
  }
  result.querySelectorAll('.result-line').forEach(el => el.remove());
  result.querySelector('hr').insertAdjacentHTML('beforebegin', lines);
  result.querySelector('.amount').textContent = unknown ? 'После осмотра' : money(amount);
  result.querySelector('.included ul').innerHTML = unknown ? '<li>Выберите количество, чтобы увидеть сумму. Можно сначала обсудить его с врачом.</li>' : items.map(x => '<li>'+esc(x)+'</li>').join('');
  const field = document.getElementById('request-calculation');
  if (field) field.value = (panel.classList.contains('all-panel') ? 'All-on-4' : panel.classList.contains('implant-panel') ? 'Имплантация' : 'Виниры') + ': '+(unknown ? 'Нужна консультация' : items.join('; ')+'; сумма '+money(amount));
 }
 function selectMaterial(el) {
  const panel = el.closest('.calc-panel');
  if (el.parentElement.classList.contains('multi')) {
   el.classList.toggle('picked'); el.setAttribute('aria-pressed', String(el.classList.contains('picked'))); update(panel); return;
  }
  const group = panel.classList.contains('all-panel') ? panel : el.parentElement;
  group.querySelectorAll('.material').forEach(x => { x.classList.remove('picked'); x.setAttribute('aria-pressed','false'); });
  el.classList.add('picked'); el.setAttribute('aria-pressed','true'); update(panel);
 }
 function init() {
  if (!document.querySelector('.calc') || document.querySelector('.calc').dataset.ready) return;
  document.querySelector('.calc').dataset.ready = 'true';
  document.querySelectorAll('.material').forEach(el => {
   el.setAttribute('role','button'); el.tabIndex = 0; el.setAttribute('aria-pressed', String(el.classList.contains('picked')));
   const span = el.querySelector(':scope > span');
   if (span) span.textContent = span.textContent.replace('Выбран в расчёте · ', '');
  });
  document.querySelectorAll('.choice').forEach(el => { el.type='button'; el.setAttribute('aria-pressed',String(el.classList.contains('selected'))); });
  motion();
 }
 document.addEventListener('click', function (e) {
  const material = e.target.closest('.material');
  if (material) selectMaterial(material);
  const choice = e.target.closest('.choice');
  if (choice) {
   choice.parentElement.querySelectorAll('.choice').forEach(x => { x.classList.remove('selected'); x.setAttribute('aria-pressed','false'); });
   choice.classList.add('selected'); choice.setAttribute('aria-pressed','true'); update(choice.closest('.calc-panel'));
  }
  const service = e.target.closest('.service a');
  if (service) { const i = Array.from(document.querySelectorAll('.service a')).indexOf(service); const id = ['dir-all','dir-implant','dir-veneer'][i]; const radio = document.getElementById(id); if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change',{bubbles:true})); } }
  const request = e.target.closest('a[href="#request"]');
  if (request) { const radio = document.querySelector('.direction-radio:checked'); if (radio) update(document.querySelector('.'+({'dir-all':'all-panel','dir-implant':'implant-panel','dir-veneer':'veneer-panel'}[radio.id]))); }
 });
 document.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && e.target.matches('.material')) { e.preventDefault(); selectMaterial(e.target); } });
 document.addEventListener('change', e => { if (e.target.matches('.direction-radio')) update(document.querySelector('.'+({'dir-all':'all-panel','dir-implant':'implant-panel','dir-veneer':'veneer-panel'}[e.target.id]))); });
 function fmt(d) {
  let s = '+7'; if (d.length > 1) s += ' ('+d.slice(1,4); if(d.length>=4)s+=') '+d.slice(4,7); if(d.length>=7)s+='-'+d.slice(7,9); if(d.length>=9)s+='-'+d.slice(9,11); return s;
 }
 document.addEventListener('input', function(e) {
  const el = e.target; if(!el.matches('input[data-phone]'))return;
  let d=el.value.replace(/\D/g,''); if(e.inputType && e.inputType.indexOf('delete')===0 && d===(el.dataset.d||''))d=d.slice(0,-1);
  if(d[0]==='8')d='7'+d.slice(1); if(d && d[0]!=='7')d='7'+d; d=d.slice(0,11); el.dataset.d=d; el.value=d?fmt(d):'';
 });
 document.addEventListener('focusin', function(e) { if(e.target.matches('input[data-phone]')&&!e.target.value)e.target.value='+7 ('; });
 let scene = null, frame = false;
 const clamp = x => Math.max(0,Math.min(1,x));
 function paint() {
  frame = false; if(!scene || !scene.isConnected || matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const box = scene.getBoundingClientRect();
  const p = clamp((innerHeight * .82 - box.top) / (innerHeight * .72));
  const crown = scene.querySelector('.part-crown'), abutment = scene.querySelector('.part-abutment'), fixture = scene.querySelector('.part-fixture');
  const distance = fixture.offsetTop - crown.offsetTop;
  const cp = clamp(p*1.8), ap = clamp((p-.25)*1.8);
  crown.style.transform = 'translateY('+(1-cp)*distance*.72+'px)';
  abutment.style.transform = 'translateY('+(1-ap)*(fixture.offsetTop-abutment.offsetTop)*.7+'px)';
  scene.querySelector('.note-crown').style.opacity = String(clamp(cp*2));
  scene.querySelector('.note-abutment').style.opacity = String(clamp(ap*2));
  scene.querySelector('.note-fixture').style.opacity = String(clamp((p-.5)*3));
 }
 function motion() { scene = document.querySelector('.implant-scene'); paint(); }
 window.addEventListener('scroll', () => { if(!frame) { frame=true; requestAnimationFrame(paint); } },{passive:true});
 window.addEventListener('resize', paint);
 function cookieNotice() {
  const bar = document.querySelector('.cookie');
  if (!bar) return;
  const drop = () => { try { localStorage.setItem('cookie-consent', 'accepted'); } catch (e) {} bar.remove(); };
  let saved = null; try { saved = localStorage.getItem('cookie-consent'); } catch (e) {}
  if (saved === 'accepted') { bar.remove(); return; }
  bar.querySelector('.cookie-btn').addEventListener('click', drop);
  const raise = () => { const nav = document.querySelector('.mobile-bar'); const onNav = nav && getComputedStyle(nav).display !== 'none';
   bar.style.bottom = onNav ? 'calc(' + Math.round(nav.getBoundingClientRect().height) + 'px + env(safe-area-inset-bottom))' : '0'; };
  raise(); window.addEventListener('resize', raise);
 }
 cookieNotice();
 document.addEventListener('htmx:afterSettle', init);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init); else init();
})();
