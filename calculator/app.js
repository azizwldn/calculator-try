const display = document.getElementById('result');
const exprEl  = document.getElementById('expression');

let current    = '0';
let expression = '';
let operator   = null;
let operand    = null;
let justEvaled = false;

function updateDisplay(value, expr = '') {
  display.textContent = value;
  exprEl.textContent  = expr;
  display.classList.toggle('error', value === 'Error');
}

function applyOperator(a, op, b) {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? null : a / b;
    case '%': return a % b;
  }
}

function formatNumber(n) {
  const str = String(n);
  if (str.length > 12) return parseFloat(n.toPrecision(10)).toString();
  return str;
}

document.querySelector('.buttons').addEventListener('click', e => {
  const btn = e.target.closest('.btn');
  if (!btn) return;

  const action = btn.dataset.action;
  const value  = btn.dataset.value;

  switch (action) {
    case 'number': {
      if (justEvaled) { current = value; justEvaled = false; }
      else current = current === '0' ? value : current + value;
      updateDisplay(current, expression + current);
      break;
    }

    case 'decimal': {
      if (justEvaled) { current = '0.'; justEvaled = false; }
      else if (!current.includes('.')) current += '.';
      updateDisplay(current, expression + current);
      break;
    }

    case 'operator': {
      const num = parseFloat(current);
      if (operator && !justEvaled) {
        const result = applyOperator(operand, operator, num);
        if (result === null) { updateDisplay('Error', ''); reset(); return; }
        operand  = result;
        current  = formatNumber(result);
      } else {
        operand = num;
      }
      operator   = value;
      expression = formatNumber(operand) + ' ' + operator + ' ';
      justEvaled = false;
      updateDisplay(formatNumber(operand), expression);
      current = '0';
      break;
    }

    case 'equals': {
      if (!operator) break;
      const b      = parseFloat(current);
      const result = applyOperator(operand, operator, b);
      const expr   = formatNumber(operand) + ' ' + operator + ' ' + formatNumber(b) + ' =';
      if (result === null) { updateDisplay('Error', expr); reset(); return; }
      current    = formatNumber(result);
      expression = expr;
      operator   = null;
      operand    = null;
      justEvaled = true;
      updateDisplay(current, expression);
      break;
    }

    case 'sign': {
      if (current === '0') break;
      current = current.startsWith('-') ? current.slice(1) : '-' + current;
      updateDisplay(current, operator ? expression + current : '');
      break;
    }

    case 'clear': {
      reset();
      break;
    }
  }
});

function reset() {
  current    = '0';
  expression = '';
  operator   = null;
  operand    = null;
  justEvaled = false;
  updateDisplay('0', '');
}

// Keyboard support
document.addEventListener('keydown', e => {
  const map = {
    '0':'0','1':'1','2':'2','3':'3','4':'4',
    '5':'5','6':'6','7':'7','8':'8','9':'9',
    '+':'+', '-':'−', '*':'×', '/':'÷', '%':'%',
    'Enter':'=', '=':'=', '.':'.', 'Backspace':'back', 'Escape':'clear'
  };
  const key = map[e.key];
  if (!key) return;
  e.preventDefault();

  if (key === 'back') {
    if (justEvaled || current === '0') return;
    current = current.length === 1 ? '0' : current.slice(0, -1);
    updateDisplay(current, operator ? expression + current : '');
    return;
  }

  const fakeBtn = document.querySelector(
    key === '='
      ? '[data-action="equals"]'
      : key === 'clear'
      ? '[data-action="clear"]'
      : key === '.'
      ? '[data-action="decimal"]'
      : ['+','−','×','÷','%'].includes(key)
      ? `[data-value="${key}"]`
      : `[data-value="${key}"]`
  );
  fakeBtn?.click();
});
