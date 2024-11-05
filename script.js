// Constants
const CONSTANTS = {
  MAX_TAX_ROWS: 20,
  DEBOUNCE_DELAY: 300
};

// State management
const state = {
  taxRowCount: 1,
  calculations: {
    baseFareDiff: 0,
    overallTaxDiff: 0,
    totalFareDiff: 0
  }
};

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

function formatCurrency(value) {
  return parseFloat(value).toFixed(2);
}

function safeCalculation(calculation) {
  try {
    return calculation();
  } catch (error) {
    console.error('Calculation error:', error);
    return 0;
  }
}

// Calculation functions
function calculateBaseFareDifference() {
  return safeCalculation(() => {
    const baseOldFare = parseFloat(document.getElementById("baseOldFare").value) || 0;
    const baseNewFare = parseFloat(document.getElementById("baseNewFare").value) || 0;
    const baseFareDiff = baseNewFare - baseOldFare;
    
    document.getElementById("totalBaseFare").textContent = formatCurrency(baseFareDiff);
    return baseFareDiff;
  });
}

function calculateTaxDifferences() {
  return safeCalculation(() => {
    let overallTaxDiff = 0;

    for (let i = 1; i <= state.taxRowCount; i++) {
      const oldFare = parseFloat(document.getElementById(`oldFare${i}`).value) || 0;
      const newFare = parseFloat(document.getElementById(`newFare${i}`).value) || 0;
      const difference = newFare - oldFare;

      document.getElementById(`taxDiff${i}`).textContent = formatCurrency(difference);

      if (difference >= 0) {
        overallTaxDiff += difference;
      }
    }

    document.getElementById("taxDifference").textContent = formatCurrency(overallTaxDiff);
    return overallTaxDiff;
  });
}

function calculateTotalFareDifference(baseFareDiff, taxDiff) {
  const flexibility = document.getElementById('flexibilitySelect').value;
  let totalFareDiff = baseFareDiff + taxDiff;

  if (flexibility === 'No') {
    const airlinePenalty = parseFloat(document.getElementById('airlinePenalty').value) || 0;
    const serviceFee = parseFloat(document.getElementById('serviceFee').value) || 0;
    totalFareDiff += airlinePenalty + serviceFee;
  }

  return totalFareDiff;
}

// Update functions
const updateSummary = debounce(() => {
  const baseFareDiff = calculateBaseFareDifference();
  const taxDiff = calculateTaxDifferences();
  const totalFareDiff = calculateTotalFareDifference(baseFareDiff, taxDiff);

  // Update state
  state.calculations = {
    baseFareDiff,
    overallTaxDiff: taxDiff,
    totalFareDiff
  };

  // Update DOM
  document.getElementById("totalFareDiff").textContent = formatCurrency(totalFareDiff);
}, CONSTANTS.DEBOUNCE_DELAY);

// Flexibility change handler
function handleFlexibilityChange() {
  const flexibility = document.getElementById('flexibilitySelect').value;
  const airlinePenaltyRow = document.getElementById('airlinePenaltyRow');
  const serviceFeeRow = document.getElementById('serviceFeeRow');

  if (flexibility === 'No') {
    airlinePenaltyRow.style.display = '';
    serviceFeeRow.style.display = '';
  } else {
    airlinePenaltyRow.style.display = 'none';
    serviceFeeRow.style.display = 'none';
  }

  updateSummary(); // Update summary to reflect changes
}

// Row management functions
function addTaxRow() {
  if (state.taxRowCount >= CONSTANTS.MAX_TAX_ROWS) {
    document.getElementById('maxTaxAlert').style.display = 'block';
    return;
  }

  state.taxRowCount++;
  const tbody = document.getElementById("taxTableBody");
  const fragment = document.createDocumentFragment();

  const newRow = document.createElement("tr");
  newRow.id = `taxRow${state.taxRowCount}`;
  newRow.innerHTML = `
    <td><input type="text" id="taxType${state.taxRowCount}" maxlength="2" class="tax-type"></td>
    <td><input type="number" id="oldFare${state.taxRowCount}" value="0" min="0" step="0.01"></td>
    <td><input type="number" id="newFare${state.taxRowCount}" value="0" min="0" step="0.01"></td>
    <td id="taxDiff${state.taxRowCount}" class="currency">0</td>
    <td><button class="remove-tax-button" onclick="removeTaxRow(${state.taxRowCount})">Remove</button></td>
  `;

  fragment.appendChild(newRow);
  tbody.appendChild(fragment);

  // Setup new row event listeners
  document.getElementById(`oldFare${state.taxRowCount}`).addEventListener("input", updateSummary);
  document.getElementById(`newFare${state.taxRowCount}`).addEventListener("input", updateSummary);

  updateSummary();
}

function removeTaxRow(rowNumber) {
  const row = document.getElementById(`taxRow${rowNumber}`);
  if (row) {
    row.remove();
    state.taxRowCount--;
    updateSummary();
  }
}

// Clear fields function
function clearFields() {
  // Reset base fare inputs
  document.getElementById("baseOldFare").value = "0";
  document.getElementById("baseNewFare").value = "0";

  // Reset penalty and service fee inputs
  document.getElementById("airlinePenalty").value = "0";
  document.getElementById("serviceFee").value = "0";

  // Reset flexibility selection
  document.getElementById("flexibilitySelect").value = "Select";
  handleFlexibilityChange(); // Adjust visibility of penalty and service fee fields based on flexibility

  // Reset initial tax row
  document.getElementById("taxType1").value = "";
  document.getElementById("oldFare1").value = "0";
  document.getElementById("newFare1").value = "0";
  document.getElementById("taxDiff1").textContent = "0";

  // Remove all additional tax rows beyond the initial row
  const tbody = document.getElementById("taxTableBody");
  while (tbody.children.length > 1) {
    tbody.removeChild(tbody.lastChild);
  }

  // Reset tax row count to initial state
  state.taxRowCount = 1;

  // Hide any max tax alert if it was previously shown
  document.getElementById('maxTaxAlert').style.display = 'none';

  // Reset summary calculations to zero
  document.getElementById("totalBaseFare").textContent = "0";
  document.getElementById("taxDifference").textContent = "0";
  document.getElementById("totalFareDiff").textContent = "0";

  // Update the state and UI to reflect these changes
  updateSummary();
}

// Event listeners setup
document.addEventListener("DOMContentLoaded", () => {
  // Hide "Airlines Penalty" and "Our Service Fee" rows by default
  document.getElementById('airlinePenaltyRow').style.display = 'none';
  document.getElementById('serviceFeeRow').style.display = 'none';

  // Base fare inputs
  document.getElementById("baseOldFare").addEventListener("input", updateSummary);
  document.getElementById("baseNewFare").addEventListener("input", updateSummary);

  // Airline Penalty and Service Fee inputs
  document.getElementById("airlinePenalty").addEventListener("input", updateSummary);
  document.getElementById("serviceFee").addEventListener("input", updateSummary);

  // Initial tax row
  document.getElementById(`oldFare1`).addEventListener("input", updateSummary);
  document.getElementById(`newFare1`).addEventListener("input", updateSummary);

  // Flexibility select
  document.getElementById("flexibilitySelect").addEventListener("change", () => {
    handleFlexibilityChange();
    updateSummary();
  });

  // Add tax button
  document.getElementById("addTaxButton").addEventListener("click", addTaxRow);

  // Clear Fields button
  document.querySelector(".clear-fields-button").addEventListener("click", clearFields);

  // Initial calculation
  updateSummary();
});
