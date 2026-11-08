'use strict';

const STORAGE_KEY = 'mini-client-manager-clients-v1';
const starterClients = [
  { id: 1, name: 'Мария Николова', company: 'Bright Studio', email: 'maria@brightstudio.example', status: 'Активен' },
  { id: 2, name: 'Иван Петров', company: 'Nova Creative', email: 'ivan@novacreative.example', status: 'Активен' },
  { id: 3, name: 'Елена Георгиева', company: 'Green Leaf Co.', email: 'elena@greenleaf.example', status: 'Изчаква' },
  { id: 4, name: 'Георги Димитров', company: 'Pixel Works', email: 'georgi@pixelworks.example', status: 'Активен' },
  { id: 5, name: 'Николай Иванов', company: 'Urban Nest', email: 'nikolay@urbannest.example', status: 'Активен' }
];

const tableBody = document.querySelector('#client-table');
const modalBackdrop = document.querySelector('#modal-backdrop');
const form = document.querySelector('#client-form');
const searchInput = document.querySelector('#search-input');
let clients = loadClients();
let toastTimer;

function loadClients() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [...starterClients];
  } catch (error) {
    console.warn('Неуспешно зареждане на локалните данни:', error);
    return [...starterClients];
  }
}

function saveClients() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  } catch (error) {
    console.error('Неуспешно запазване на клиентите:', error);
    showToast('Данните не можаха да бъдат запазени.');
  }
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('bg-BG');
}

function renderClients() {
  const query = searchInput.value.trim().toLocaleLowerCase('bg-BG');
  const filtered = clients.filter(client =>
    [client.name, client.company, client.email].some(value => value.toLocaleLowerCase('bg-BG').includes(query))
  );

  tableBody.replaceChildren();
  filtered.forEach((client, index) => {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    const identity = document.createElement('div');
    identity.className = 'client-cell';
    const avatar = document.createElement('span');
    avatar.className = `client-avatar tone-${index % 5}`;
    avatar.textContent = initials(client.name);
    const name = document.createElement('span');
    name.textContent = client.name;
    identity.append(avatar, name);
    nameCell.append(identity);

    const companyCell = document.createElement('td');
    companyCell.textContent = client.company;
    const emailCell = document.createElement('td');
    emailCell.className = 'email-cell';
    emailCell.textContent = client.email;
    const statusCell = document.createElement('td');
    const status = document.createElement('span');
    status.className = `status ${client.status === 'Активен' ? 'active' : 'pending'}`;
    status.textContent = client.status;
    statusCell.append(status);
    const actionsCell = document.createElement('td');
    actionsCell.className = 'row-actions';
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-button';
    deleteButton.textContent = '⌫';
    deleteButton.setAttribute('aria-label', `Изтрий ${client.name}`);
    deleteButton.title = 'Изтрий клиента';
    deleteButton.addEventListener('click', () => deleteClient(client.id));
    actionsCell.append(deleteButton);
    row.append(nameCell, companyCell, emailCell, statusCell, actionsCell);
    tableBody.append(row);
  });

  document.querySelector('#empty-state').hidden = filtered.length !== 0;
  document.querySelector('#total-clients').textContent = clients.length;
  document.querySelector('#active-clients').textContent = clients.filter(client => client.status === 'Активен').length;
  document.querySelector('#nav-count').textContent = clients.length;
  document.querySelector('#results-label').textContent = `Показани ${filtered.length} от ${clients.length} клиента`;
}

function openModal() {
  modalBackdrop.hidden = false;
  document.querySelector('#client-name').focus();
}

function closeModal() {
  modalBackdrop.hidden = true;
  form.reset();
  document.querySelector('#form-error').textContent = '';
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function addClient(event) {
  event.preventDefault();
  const formData = new FormData(form);
  const name = String(formData.get('name')).trim();
  const company = String(formData.get('company')).trim();
  const email = String(formData.get('email')).trim().toLowerCase();
  const errorBox = document.querySelector('#form-error');
  if (!name || !company || !email) {
    errorBox.textContent = 'Моля, попълни всички полета.';
    return;
  }
  if (clients.some(client => client.email.toLowerCase() === email)) {
    errorBox.textContent = 'Вече има клиент с този имейл адрес.';
    return;
  }
  clients.unshift({ id: Date.now(), name, company, email, status: 'Активен' });
  saveClients();
  searchInput.value = '';
  renderClients();
  closeModal();
  showToast('Клиентът беше добавен успешно.');
}

function deleteClient(id) {
  const client = clients.find(item => item.id === id);
  if (!client) return;
  if (!window.confirm(`Сигурен ли си, че искаш да изтриеш ${client.name}?`)) return;
  clients = clients.filter(item => item.id !== id);
  saveClients();
  renderClients();
  showToast('Клиентът беше изтрит.');
}

document.querySelector('#open-modal').addEventListener('click', openModal);
document.querySelector('#close-modal').addEventListener('click', closeModal);
document.querySelector('#cancel-modal').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', event => { if (event.target === modalBackdrop) closeModal(); });
form.addEventListener('submit', addClient);
searchInput.addEventListener('input', renderClients);
document.querySelector('#clear-search').addEventListener('click', () => { searchInput.value = ''; renderClients(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modalBackdrop.hidden) closeModal(); });
document.querySelector('#today-label').textContent = new Intl.DateTimeFormat('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
renderClients();
