"use strict";

const currentDisplay = document.querySelector("#current-display");
const previousOperation = document.querySelector("#previous-operation");
const keypad = document.querySelector(".keypad");

let currentInput = "0";
let firstOperand = null;
let operator = null;
let shouldResetDisplay = false;
let hasError = false;
let completedExpression = "";

const operatorSymbols = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷"
};

function formatNumber(value) {
  // Evita mostrar errores como 0.30000000000000004 tras operaciones decimales.
  const cleanedValue = Number(value.toPrecision(12));
  return new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 10,
    useGrouping: false
  }).format(cleanedValue);
}

function render() {
  currentDisplay.textContent = currentInput;
  currentDisplay.classList.toggle("is-message", hasError || currentInput.length > 12);

  if (operator !== null && firstOperand !== null) {
    previousOperation.textContent = `${formatNumber(firstOperand)} ${operatorSymbols[operator]}`;
  } else {
    previousOperation.textContent = completedExpression;
  }

  document.querySelectorAll("[data-operator]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.operator === operator);
  });
}

function resetAfterError() {
  if (!hasError) return;
  currentInput = "0";
  firstOperand = null;
  operator = null;
  shouldResetDisplay = false;
  hasError = false;
}

function inputNumber(number) {
  resetAfterError();

  if (shouldResetDisplay) {
    if (operator === null) completedExpression = "";
    currentInput = number;
    shouldResetDisplay = false;
  } else if (currentInput === "0") {
    currentInput = number;
  } else if (currentInput.length < 16) {
    currentInput += number;
  }

  render();
}

function inputDecimal() {
  resetAfterError();

  if (shouldResetDisplay) {
    if (operator === null) completedExpression = "";
    currentInput = "0.";
    shouldResetDisplay = false;
  } else if (!currentInput.includes(".")) {
    currentInput += ".";
  }

  render();
}

function calculate(a, b, selectedOperator) {
  switch (selectedOperator) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? null : a / b;
    default: return b;
  }
}

function showDivisionError() {
  currentInput = "No se puede dividir por cero";
  firstOperand = null;
  operator = null;
  shouldResetDisplay = true;
  hasError = true;
  render();
}

function chooseOperator(nextOperator) {
  resetAfterError();
  if (operator === null) completedExpression = "";

  const inputValue = Number(currentInput);

  if (operator !== null && !shouldResetDisplay) {
    const result = calculate(firstOperand, inputValue, operator);
    if (result === null) {
      showDivisionError();
      return;
    }
    currentInput = String(result);
    firstOperand = result;
  } else {
    firstOperand = inputValue;
  }

  operator = nextOperator;
  shouldResetDisplay = true;
  render();
}

function getResult() {
  if (operator === null || firstOperand === null || hasError) return;

  const secondOperand = Number(currentInput);
  const result = calculate(firstOperand, secondOperand, operator);

  if (result === null) {
    showDivisionError();
    return;
  }

  completedExpression = `${formatNumber(firstOperand)} ${operatorSymbols[operator]} ${formatNumber(secondOperand)} =`;
  currentInput = String(Number(result.toPrecision(12)));
  operator = null;
  firstOperand = null;
  shouldResetDisplay = true;
  render();
}

function clearAll() {
  currentInput = "0";
  firstOperand = null;
  operator = null;
  shouldResetDisplay = false;
  hasError = false;
  completedExpression = "";
  render();
}

function backspace() {
  if (hasError) {
    clearAll();
    return;
  }
  if (shouldResetDisplay) return;

  currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : "0";
  if (currentInput === "-" || currentInput === "") currentInput = "0";
  render();
}

function toggleSign() {
  resetAfterError();
  if (shouldResetDisplay && operator === null) completedExpression = "";
  if (currentInput === "0") return;
  currentInput = currentInput.startsWith("-") ? currentInput.slice(1) : `-${currentInput}`;
  render();
}

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.number !== undefined) {
    inputNumber(button.dataset.number);
    return;
  }

  if (button.dataset.operator) {
    chooseOperator(button.dataset.operator);
    return;
  }

  switch (button.dataset.action) {
    case "decimal": inputDecimal(); break;
    case "equals": getResult(); break;
    case "clear": clearAll(); break;
    case "backspace": backspace(); break;
    case "sign": toggleSign(); break;
  }
});

// Permite operar con 0–9, +, -, *, /, punto, Enter, Escape y Retroceso.
document.addEventListener("keydown", (event) => {
  if (/^[0-9]$/.test(event.key)) {
    inputNumber(event.key);
  } else if (event.key === "." || event.key === ",") {
    inputDecimal();
  } else if (["+", "-", "*", "/"].includes(event.key)) {
    event.preventDefault();
    chooseOperator(event.key);
  } else if (event.key === "Enter" || event.key === "=") {
    event.preventDefault();
    getResult();
  } else if (event.key === "Escape") {
    clearAll();
  } else if (event.key === "Backspace") {
    backspace();
  }
});

render();
