function DataTable(config) {
  const { tbody, table, parent } = makeHeadBodyTableParent(config);
  makeAndFillTable(config, tbody, table, parent);
  const addBtn = makeAndAddButton(parent);
  addBtn.addEventListener('click', event => {
    event.preventDefault();
    const form = showAddForm(config);
    form.addEventListener('submit', action => {
      action.preventDefault();
      const formData = new FormData(form);
      const dataToSend = {};
      let hasError = false;
      form.querySelectorAll('input, select').forEach(input => {
        hasError = checkError(formData, input, hasError, dataToSend);
      });
      if (hasError) return;
      postAndUpdateTable(config, dataToSend, form, parent);
    });
  });
}

const config2 = {
  parent: '#productsTable',
  columns: [
    {
      title: 'Назва',
      value: 'title',
      input: { type: 'text' }
    },
    {
      title: 'Ціна',
      value: (product) => `${product.price} ${product.currency}`,
      input: [
        { type: 'number', name: 'price', label: 'Ціна' },
        { type: 'select', name: 'currency', label: 'Валюта', options: ['$', '€', '₴'], required: false }
      ]
    },
    {
      title: 'Колір',
      value: (product) => getColorLabel(product.color),
      input: { type: 'color', name: 'color' }
    },
  ],
  apiUrl: "https://mock-api.shpp.me/rspichak/products"
};

DataTable(config2);

/**
 * Create div with special background color
 * @param {color} color 
 * @returns div
*/
function getColorLabel(color) {
  return `<div style="width: 60px; height: 40px; background-color: ${color}; border-radius: 5px;"></div>`;
}

/**
 * Create table header cells and fill column title
 * @param {config} config 
 * @returns DOM elements tbody, table, parent
*/
function makeHeadBodyTableParent(config) {
  const parent = document.querySelector(config.parent);
  const table = document.createElement('table');
  const headRow = document.createElement('tr');
  const numberRow = document.createElement('th');
  numberRow.innerHTML = '#';
  headRow.appendChild(numberRow);
  config.columns.map(column => {
    const headRowTitle = document.createElement('th');
    headRowTitle.innerHTML = column.title;
    headRow.appendChild(headRowTitle);
  });
  const tbody = document.createElement('tbody');
  tbody.appendChild(headRow);
  return { tbody, table, parent };
}

/**
 * Get data from server with config apiURL
 * @param {config} config 
 * @param {tbody} tbody 
 * @param {table} table 
 * @param {parent} parent 
*/
function makeAndFillTable(config, tbody, table, parent) {
  fetch(config.apiUrl)
  .then(response => {
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    return response.json();
  })
  .then(json => {
    fillTable(json, config, tbody, table, parent);
  })
  .catch(error => {
    console.error(`Error catch: ${error.message}`);
  });
}

/**
 * Fill the table
 * @param {json} json 
 * @param {config} config 
 * @param {tbody} tbody 
 * @param {table} table 
 * @param {parent} parent 
*/
function fillTable(json, config, tbody, table, parent) {
  for (const [key, value] of Object.entries(json.data)) {
    const row = document.createElement('tr');
    const rowNum = document.createElement('td');
    rowNum.innerHTML = key;
    row.appendChild(rowNum);
    config.columns.map(column => {
      const cell = document.createElement('td');
      if (typeof column.value === "function") {
        cell.innerHTML = column.value(value);
      } else {
        cell.innerHTML = value[column.value];
      }
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  parent.appendChild(table);
}

/**
 * Create button and add to screen
 * @param {parent} parent 
 * @returns button
*/
function makeAndAddButton(parent) {
  const btnAdd = document.createElement('button');
  btnAdd.innerHTML = "Click to add row";
  parent.prepend(btnAdd);
  return btnAdd;
}

/**
 * Create div to form and fill form
 * @param {config} config 
 * @returns Form to next action
*/
function showAddForm(config) {
  const formContainer = document.createElement('div');
  formContainer.classList.add('form-container');
  const form = document.createElement('form');
  config.columns.map(column => {
    const inputs = Array.isArray(column.input) ? column.input : [column.input];
    inputs.map(inputConfig => {
      fillForm(inputConfig, column, form);
    });
  });
  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.style.display = 'none';
  form.appendChild(submitButton);
  formContainer.appendChild(form);
  document.querySelector(config.parent).prepend(formContainer);
  return form;
}

/**
 * Fill form inputs
 * @param {inputConfig} inputConfig 
 * @param {column} column 
 * @param {form} form 
*/
function fillForm(inputConfig, column, form) {
  const label = document.createElement('label');
  const input = document.createElement(
    inputConfig.type === 'select' ? 'select' : 'input'
  );
  input.name = inputConfig.name || (typeof column.value === 'string' ? column.value : '');
  input.required = inputConfig.required !== false;
  label.innerHTML = inputConfig.label || column.title;
  if (inputConfig.placeholder) {
    input.placeholder = inputConfig.placeholder;
  }
  if (inputConfig.type !== 'select') {
    input.type = inputConfig.type;
  }
  if (inputConfig.options) {
    inputConfig.options.map(item => {
      const option = document.createElement('option');
      option.value = item;
      option.innerHTML = item;
      input.appendChild(option);
    });
  }
  label.appendChild(input);
  form.appendChild(label);
}

/**
 * Checking errors
 * @param {formData} formData 
 * @param {input} input 
 * @param {hasError} hasError 
 * @param {dataToSend} dataToSend 
 * @returns boolean
 */
function checkError(formData, input, hasError, dataToSend) {
  const value = formData.get(input.name)?.trim();
  const isRequired = input.required !== false;
  const isEmpty = !value;
  if (isRequired && isEmpty) {
    input.style.border = '2px solid red';
    hasError = true;
  } else {
    input.style.border = '';
    dataToSend[input.name] = input.type === 'number' ? Number(value) : value;
  }
  return hasError;
}

/**
 * Send post to backend and update table with new row
 * @param {config} config 
 * @param {dataToSend} dataToSend 
 * @param {form} form 
 * @param {parent} parent 
 */
function postAndUpdateTable(config, dataToSend, form, parent) {
  fetch(config.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dataToSend)
  })
  .then(response => {
    if (!response.ok) throw new Error(`Error when add: ${response.status}`);
    return response.json();
  })
  .then(() => {
    form.remove();
    parent.innerHTML = '';
    DataTable(config);
  })
  .catch(error => {
    alert(`Error when saving: ${error.message}`);
  });
}