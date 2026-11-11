(function () {
  // Расчёт по умолчанию должен уйти в заявку, даже если посетитель не тронул калькулятор.
  function run() {
    var choice = document.querySelector('.calc-panel .choice.selected');
    if (!choice) return;
    choice.type = 'button';
    choice.click();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
