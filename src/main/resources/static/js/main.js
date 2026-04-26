const API_BASE = '/api/customers';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount || 0);
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const escapeHtml = (value) => {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
};

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    const form = document.querySelector(`#${modalId} form`);
    if (form) form.reset();
}

async function fetchJson(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }
    if (response.status === 204) {
        return null;
    }
    return response.json();
}

async function loadCustomers() {
    const grid = document.getElementById('customersGrid');
    if (!grid) return;

    try {
        const customers = await fetchJson(API_BASE);

        document.getElementById('totalCustomersStat').textContent = customers.length;
        document.getElementById('totalBalanceStat').textContent = formatCurrency(
            customers.reduce((total, customer) => total + (customer.currentBalance || 0), 0)
        );

        grid.innerHTML = '';

        if (customers.length === 0) {
            grid.innerHTML = '<p class="empty-state">No customers yet. Add your first account to begin.</p>';
            return;
        }

        customers.forEach(customer => {
            const balanceClass = customer.currentBalance >= 0 ? 'balance-positive' : 'balance-negative';
            const card = document.createElement('a');
            card.href = `customer.html?id=${customer.id}`;
            card.className = 'customer-card';
            card.innerHTML = `
                <h3>${escapeHtml(customer.name)}</h3>
                <p class="text-muted">Phone: ${escapeHtml(customer.phone)}</p>
                <p class="text-muted">Address: ${escapeHtml(customer.address)}</p>
                <div class="customer-balance ${balanceClass}">
                    ${formatCurrency(customer.currentBalance)}
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading customers:', error);
        grid.innerHTML = '<p class="empty-state error">Unable to load customers.</p>';
    }
}

async function handleAddCustomer(event) {
    event.preventDefault();

    const data = {
        name: document.getElementById('customerName').value.trim(),
        phone: document.getElementById('customerPhone').value.trim(),
        address: document.getElementById('customerAddress').value.trim(),
        currentBalance: parseFloat(document.getElementById('customerBalance').value) || 0
    };

    try {
        await fetchJson(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeModal('addCustomerModal');
        loadCustomers();
    } catch (error) {
        console.error('Error adding customer:', error);
        alert('Failed to add customer');
    }
}

const getCustomerId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
};

let activeCustomer = null;

async function loadCustomerDetails() {
    const id = getCustomerId();
    if (!id || !document.getElementById('detailName')) return;

    try {
        const data = await fetchJson(`${API_BASE}/${id}`);
        activeCustomer = data.customer;
        const transactions = data.transactions;

        document.getElementById('detailName').textContent = activeCustomer.name;
        document.getElementById('detailPhone').textContent = `Phone: ${activeCustomer.phone || ''}`;
        document.getElementById('detailAddress').textContent = `Address: ${activeCustomer.address || ''}`;

        const balanceEl = document.getElementById('detailBalance');
        balanceEl.textContent = formatCurrency(activeCustomer.currentBalance);
        balanceEl.className = 'balance-amount ' + (activeCustomer.currentBalance >= 0 ? 'balance-positive' : 'balance-negative');

        const tbody = document.getElementById('transactionsTableBody');
        tbody.innerHTML = '';

        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-cell">No transactions found.</td></tr>';
            return;
        }

        transactions.forEach(tx => {
            const tr = document.createElement('tr');
            const isDeposit = tx.type === 'DEPOSIT';
            const typeBadge = `<span class="${isDeposit ? 'badge-deposit' : 'badge-purchase'}">${tx.type}</span>`;
            const prefix = isDeposit ? '+' : '-';
            const amountClass = isDeposit ? 'balance-positive' : 'balance-negative';

            tr.innerHTML = `
                <td>${formatDate(tx.timestamp)}</td>
                <td>${typeBadge}</td>
                <td>${escapeHtml(tx.description)}</td>
                <td class="amount-col ${amountClass}">${prefix}${formatCurrency(tx.amount)}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading details:', error);
        document.querySelector('.main-content').innerHTML = '<h2>Customer not found.</h2>';
    }
}

function openEditCustomerModal() {
    if (!activeCustomer) return;

    document.getElementById('editCustomerName').value = activeCustomer.name || '';
    document.getElementById('editCustomerPhone').value = activeCustomer.phone || '';
    document.getElementById('editCustomerAddress').value = activeCustomer.address || '';
    document.getElementById('editCustomerBalance').value = activeCustomer.currentBalance || 0;
    openModal('editCustomerModal');
}

async function handleEditCustomer(event) {
    event.preventDefault();
    const id = getCustomerId();
    if (!id) return;

    const data = {
        name: document.getElementById('editCustomerName').value.trim(),
        phone: document.getElementById('editCustomerPhone').value.trim(),
        address: document.getElementById('editCustomerAddress').value.trim(),
        currentBalance: parseFloat(document.getElementById('editCustomerBalance').value) || 0
    };

    try {
        await fetchJson(`${API_BASE}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeModal('editCustomerModal');
        loadCustomerDetails();
    } catch (error) {
        console.error('Error updating customer:', error);
        alert('Failed to update customer');
    }
}

async function handleDeleteCustomer() {
    const id = getCustomerId();
    if (!id || !activeCustomer) return;

    const confirmed = confirm(`Delete ${activeCustomer.name} and all transactions? This cannot be undone.`);
    if (!confirmed) return;

    try {
        await fetchJson(`${API_BASE}/${id}`, { method: 'DELETE' });
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Failed to delete customer');
    }
}

async function handleAddTransaction(event, type) {
    event.preventDefault();
    const id = getCustomerId();
    if (!id) return;

    const amountId = type === 'DEPOSIT' ? 'depositAmount' : 'purchaseAmount';
    const descId = type === 'DEPOSIT' ? 'depositDescription' : 'purchaseDescription';
    const modalId = type === 'DEPOSIT' ? 'addDepositModal' : 'addPurchaseModal';

    const data = {
        type,
        amount: parseFloat(document.getElementById(amountId).value),
        description: document.getElementById(descId).value.trim()
    };

    try {
        await fetchJson(`${API_BASE}/${id}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeModal(modalId);
        loadCustomerDetails();
    } catch (error) {
        console.error('Error adding transaction:', error);
        alert('Failed to add transaction');
    }
}
