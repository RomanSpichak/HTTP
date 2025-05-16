function DataTable(config) {
    const parent = document.querySelector(config.parent);
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    const numberTh = document.createElement('th');
    numberTh.textContent = '#';
    headRow.appendChild(numberTh);

    config.columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column.title;
        headRow.appendChild(th);
    });
    const action = document.createElement('th');
    action.textContent = "Дія";
    headRow.appendChild(action)
    table.appendChild(thead);
    thead.appendChild(headRow);

    const tbody = document.createElement('tbody');

    fetch(config.apiUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error code: ${response.status}`);
        }
        return response.json();
    })
    .then(json => {
        for (const [key, value] of Object.entries(json.data)) {
            const row = document.createElement('tr');
            const rowNum = document.createElement('td');
            rowNum.textContent = key;
            row.appendChild(rowNum);

            config.columns.forEach(column => {
                const td = document.createElement('td');
                let content;
                if (typeof column.value === "function") {
                    content = column.value(value);
                } else {
                    content = value[column.value];
                }
                td.innerHTML = content;
                row.appendChild(td);
            })
            const buttonTd = document.createElement('td');
            const button = document.createElement('button');
            button.dataset.id = key;
            button.textContent = "Delete";
            button.style.backgroundColor = "red";
            button.className = "delete-btn";
            button.addEventListener("click", event => {
                const id = event.target.dataset.id;
                fetch(`${config.apiUrl}/${id}`, { method: "DELETE"})
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error deleting: ${response.status}`);
                    }
                    event.target.closest("tr").remove();
                })
                .catch(error => {
                    console.error("Error", error.message);
                });
            });
            buttonTd.appendChild(button);
            row.appendChild(buttonTd);
            tbody.appendChild(row);
        }
        table.appendChild(tbody);
        parent.appendChild(table);
    })
    .catch(error => {
        console.error(`Catch error: ${error.message}`);
    });
}

function getAge(input) {
    const birthday = new Date(input);
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const month = today.getMonth() - birthday.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birthday.getDate())) {
        age--;
    }
    return age;
}

const config1 = {
  parent: '#usersTable',
  columns: [
    {title: 'Ім’я', value: 'name'},
    {title: 'Прізвище', value: 'surname'},
    {title: 'Вік', value: (user) => getAge(user.birthday)}, 
    {title: 'Фото', value: (user) => `<img src="${user.avatar}" alt="${user.name} ${user.surname}"/>`}
  ],
  apiUrl: "https://mock-api.shpp.me/rspichak/users"
};

DataTable(config1);

function getColorLabel(color) {
  return `<div style="width: 30px; height: 20px; background-color: ${color}; border: 1px solid #000;"></div>`;
}

const config2 = {
  parent: '#productsTable',
  columns: [
    {title: 'Назва', value: 'title'},
    {title: 'Ціна', value: (product) => `${product.price} ${product.currency}`},
    {title: 'Колір', value: (product) => getColorLabel(product.color)} 
  ],
  apiUrl: "https://mock-api.shpp.me/rspichak/products"
};

DataTable(config2);
