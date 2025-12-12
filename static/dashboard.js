// API Base URL
const API_BASE = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') && window.location.port !== '8000'
    ? 'http://127.0.0.1:8000'
    : '';

// Global State
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();
let expenseChart = null;
let categoryChart = null;
let budgetPieChart = null;
let dailySpendingChart = null;

// Auth Check
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/';
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupMonthSelectors();
    setupTransactionModal();
    loadHomeData();
});

// Navigation
function setupNavigation() {
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Update Active Link
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show Section
            const sectionId = link.getAttribute('data-section') + 'Section';
            document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
            document.getElementById(sectionId).style.display = 'block';

            // Load Data
            if (link.getAttribute('data-section') === 'history') loadHistory();
            if (link.getAttribute('data-section') === 'budget') loadBudgetData();
        });
    });
}

function setupMonthSelectors() {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const selector = document.getElementById('monthSelector');
    const budgetSelector = document.getElementById('budgetMonthSelector');

    months.forEach((m, i) => {
        const option = new Option(m, i + 1);
        selector.add(option.cloneNode(true));
        budgetSelector.add(option);
    });

    selector.value = currentMonth;
    budgetSelector.value = currentMonth;

    selector.addEventListener('change', (e) => {
        currentMonth = parseInt(e.target.value);
        budgetSelector.value = currentMonth;
        loadHomeData();
    });

    budgetSelector.addEventListener('change', (e) => {
        currentMonth = parseInt(e.target.value);
        selector.value = currentMonth;
        loadBudgetData();
    });
}

// Home Data
async function loadHomeData() {
    try {
        console.log("Loading Home Data...");
        // Summary
        const summaryRes = await fetch(`${API_BASE}/api/summary?month=${currentMonth}&year=${currentYear}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!summaryRes.ok) {
            if (summaryRes.status === 401) {
                alert("Session expired. Please login again.");
                logout();
                return;
            }
            const err = await summaryRes.json();
            throw new Error(err.detail || 'Failed to fetch summary');
        }

        const summary = await summaryRes.json();

        document.getElementById('totalIncome').textContent = `₹${summary.income.toFixed(2)}`;
        document.getElementById('totalExpenses').textContent = `₹${summary.expenses.toFixed(2)}`;
        document.getElementById('balance').textContent = `₹${summary.balance.toFixed(2)}`;

        // Charts
        // 1. Yearly Expenses (Multi-Month Bar Chart)
        const yearlyRes = await fetch(`${API_BASE}/api/yearly-expenses?year=${currentYear}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (yearlyRes.ok) {
            const yearlyData = await yearlyRes.json();
            renderExpenseChart(yearlyData);
        }

        // 2. Category Distribution
        const catRes = await fetch(`${API_BASE}/api/category-expenses?month=${currentMonth}&year=${currentYear}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (catRes.ok) {
            const catData = await catRes.json();
            renderCategoryChart(catData);
        }

        // 3. Yearly Trend
        loadYearlyTrendData();

    } catch (error) {
        console.error('Error loading home data:', error);
        alert(`Error loading dashboard data: ${error.message}\n\nPlease check if the backend server is running and database is reset.`);
    }
}

// Charts
function renderExpenseChart(data) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (expenseChart) expenseChart.destroy();

    expenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.month),
            datasets: [{
                label: 'Monthly Expenses',
                data: data.map(d => d.amount),
                backgroundColor: '#2160FF',
                borderRadius: 4,
                hoverBackgroundColor: '#3B62FF'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Expenses: ₹${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#fff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#fff' },
                    grid: { display: false }
                }
            }
        }
    });
}

function renderCategoryChart(data) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    if (categoryChart) categoryChart.destroy();

    const colorMap = {
        'Travel': '#1976D2',
        'Food': '#00ACC1',
        'Bills': '#5C6BC0',
        'Miscellaneous': '#90A4AE'
    };

    const colors = data.map(d => colorMap[d.category] || '#2160FF'); // Default to Neon Blue if unknown

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.category),
            datasets: [{
                data: data.map(d => d.amount),
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right', labels: { color: '#fff' } }
            }
        }
    });
}

// Transactions
function setupTransactionModal() {
    const modal = document.getElementById('newTransactionModal');
    modal.addEventListener('show.bs.modal', (e) => {
        const type = e.relatedTarget.getAttribute('data-type');
        document.getElementById('transactionType').value = type;
        document.getElementById('transactionModalTitle').textContent = `New ${type}`;

        // Default date logic
        const dateInput = document.getElementById('transactionDate');
        const today = new Date();
        if (currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear()) {
            dateInput.valueAsDate = today;
        } else {
            dateInput.value = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
        }

        // Toggle Category Field
        const categoryGroup = document.getElementById('categoryGroup');
        if (type === 'Income') {
            categoryGroup.style.display = 'none';
        } else {
            categoryGroup.style.display = 'block';
        }
    });

    document.getElementById('transactionForm').addEventListener('submit', saveTransaction);
}

async function saveTransaction(e) {
    e.preventDefault();

    const dateVal = document.getElementById('transactionDate').value;

    const type = document.getElementById('transactionType').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);

    const data = {
        date: dateVal,
        name: type === 'Income' ? 'Income' : document.getElementById('transactionDescription').value,
        description: document.getElementById('transactionDescription').value,
        category: type === 'Income' ? 'Income' : document.getElementById('transactionCategory').value,
        salary: type === 'Income' ? amount : 0,
        expenses: type === 'Expense' ? amount : 0
    };

    try {
        const res = await fetch(`${API_BASE}/ledger/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('newTransactionModal')).hide();
            e.target.reset();
            loadHomeData();
            loadHistory(); // Refresh history if open
        } else if (res.status === 401) {
            alert("Session expired. Please login again.");
            logout();
        }
    } catch (error) {
        console.error('Error saving transaction:', error);
    }
}

async function loadHistory() {
    try {
        console.log("Loading History...");
        const res = await fetch(`${API_BASE}/ledger/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            if (res.status === 401) {
                alert("Session expired. Please login again.");
                logout();
                return;
            }
            console.error("Failed to load history:", res.status);
            return;
        }

        const data = await res.json();
        const tbody = document.getElementById('transactionsTable');
        tbody.innerHTML = '';

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No transactions found.</td></tr>';
            return;
        }

        // Sort by date desc
        data.sort((a, b) => new Date(b.date) - new Date(a.date));

        data.forEach(t => {
            const isIncome = t.salary > 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${t.date}</td>
                <td class="${isIncome ? 'text-success' : 'text-danger'}">
                    ${isIncome ? '+' : '-'}₹${(isIncome ? t.salary : t.expenses).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td><span class="${isIncome ? 'text-white' : 'text-white'}">${t.category}</span></td>
                <td>${t.description || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="editTransaction(${t.id})" style="min-width: 60px;">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction(${t.id})" style="min-width: 60px;">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

async function deleteTransaction(id) {
    if (!confirm('Are you sure?')) return;

    try {
        const res = await fetch(`${API_BASE}/ledger/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            loadHomeData();
            loadHistory();
        }
    } catch (error) {
        console.error('Error deleting:', error);
    }
}

// Profile
async function showProfile() {
    try {
        const res = await fetch(`${API_BASE}/api/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await res.json();
        document.getElementById('profileUsername').textContent = user.username;
        document.getElementById('profileEmail').textContent = user.email;
        new bootstrap.Modal(document.getElementById('profileModal')).show();
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
}

// Budget
async function loadBudgetData() {
    console.log("Loading Budget Data...");
    try {
        // 1. Get Budget Settings
        const budgetRes = await fetch(`${API_BASE}/api/budget?month=${currentMonth}&year=${currentYear}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        let budgetAmount = 0;
        if (budgetRes.ok) {
            const budgetData = await budgetRes.json();
            if (budgetData) {
                budgetAmount = budgetData.amount;
                document.getElementById('budgetAmount').value = budgetAmount;
            } else {
                document.getElementById('budgetAmount').value = '';
            }
        } else if (budgetRes.status === 401) {
            alert("Session expired. Please login again.");
            logout();
            return;
        }

        // 2. Get Summary for calculations
        const summaryRes = await fetch(`${API_BASE}/api/summary?month=${currentMonth}&year=${currentYear}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        let summary = { expenses: 0, income: 0, balance: 0 };
        if (summaryRes.ok) {
            summary = await summaryRes.json();
        } else if (summaryRes.status === 401) {
            alert("Session expired. Please login again.");
            logout();
            return;
        }

        // 3. Calculate Status
        const totalExpenses = summary.expenses;
        const remaining = budgetAmount - totalExpenses;
        const progress = budgetAmount > 0 ? (totalExpenses / budgetAmount) * 100 : 0;

        document.getElementById('budgetIncome').textContent = `₹${summary.income.toFixed(2)}`;
        document.getElementById('currentBudget').textContent = `₹${budgetAmount.toFixed(2)}`;
        document.getElementById('remainingBudget').textContent = `₹${remaining.toFixed(2)}`;
        document.getElementById('remainingBudget').className = `h5 ${remaining >= 0 ? 'text-teal' : 'text-danger'}`;

        const progressBar = document.getElementById('budgetProgress');
        progressBar.style.width = `${Math.min(progress, 100)}%`;
        progressBar.className = `progress-bar ${progress > 100 ? 'bg-danger' : 'bg-teal'}`;

        // 4. Render Budget Pie Chart
        renderBudgetPieChart(totalExpenses, Math.max(remaining, 0));

        // 5. Daily Spending Chart
        const dailyRes = await fetch(`${API_BASE}/api/daily-spending?month=${currentMonth}&year=${currentYear}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (dailyRes.ok) {
            const dailyData = await dailyRes.json();
            renderDailySpendingChart(dailyData);
        } else if (dailyRes.status === 401) {
            // Already handled above likely, but good to be safe
            return;
        }

    } catch (error) {
        console.error('Error loading budget data:', error);
    }
}

async function saveBudget() {
    const amount = parseFloat(document.getElementById('budgetAmount').value);
    if (isNaN(amount) || amount < 0) {
        alert('Please enter a valid budget amount');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/budget`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                month: currentMonth,
                year: currentYear,
                amount: amount
            })
        });

        if (res.ok) {
            alert('Budget saved successfully!');
            loadBudgetData();
        }
    } catch (error) {
        console.error('Error saving budget:', error);
    }
}

function renderBudgetPieChart(spent, remaining) {
    const ctx = document.getElementById('budgetPieChart').getContext('2d');
    if (budgetPieChart) budgetPieChart.destroy();

    budgetPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Spent', 'Remaining'],
            datasets: [{
                data: [spent, remaining],
                backgroundColor: ['#E74C3C', '#2160FF'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#fff' } }
            }
        }
    });
}

function renderDailySpendingChart(data) {
    const ctx = document.getElementById('dailySpendingChart').getContext('2d');
    if (dailySpendingChart) dailySpendingChart.destroy();

    // Helper for ordinal suffixes (1st, 2nd, 3rd)
    const getOrdinal = (n) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    dailySpendingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => getOrdinal(new Date(d.date).getDate())),
            datasets: [{
                label: 'Daily Spending',
                data: data.map(d => d.amount),
                backgroundColor: '#2160FF',
                borderRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#fff' } },
                x: { ticks: { color: '#fff' } }
            }
        }
    });
}

async function loadYearlyTrendData() {
    try {
        const res = await fetch(`${API_BASE}/api/yearly-spending-trend`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            renderYearlyTrendChart(data);
        }
    } catch (error) {
        console.error('Error loading yearly trend:', error);
    }
}

// Yearly Trend Chart
let yearlyTrendChart = null;

function renderYearlyTrendChart(data) {
    const canvas = document.getElementById('yearlyTrendChart');
    const container = canvas.parentElement;

    // Check for existing "no data" message and remove it
    const existingMsg = container.querySelector('.no-data-message');
    if (existingMsg) existingMsg.remove();

    if (!data || data.length === 0) {
        canvas.style.display = 'none';
        const msg = document.createElement('div');
        msg.className = 'no-data-message d-flex justify-content-center align-items-center h-100 text-muted';
        msg.innerText = 'No yearly data available yet.';
        container.appendChild(msg);
        return;
    }

    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');

    if (yearlyTrendChart) {
        yearlyTrendChart.destroy();
    }

    yearlyTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.year),
            datasets: [{
                label: 'Total Expenses',
                data: data.map(d => d.amount),
                borderColor: '#2160FF',
                backgroundColor: 'rgba(33, 96, 255, 0.1)',
                borderWidth: 3,
                tension: 0.4, // Smooth curve
                fill: true,
                pointStyle: 'circle',
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: '#2160FF',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#2160FF',
                    bodyColor: '#fff',
                    padding: 10,
                    callbacks: {
                        label: function (context) {
                            return ` Total Expenses: ₹${context.raw.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        callback: function (value) {
                            return '₹' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        borderDash: [5, 5]
                    },
                    border: { display: false }
                },
                x: {
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                    grid: { display: false },
                    border: { display: false }
                }
            }
        }
    });
}

// CSV (Placeholder)
function exportCSV() {
    alert('Export feature coming soon!');
}

function importCSV() {
    alert('Import feature coming soon!');
}

// Expose global functions
window.logout = logout;
window.showProfile = showProfile;
window.deleteTransaction = deleteTransaction;
window.saveBudget = saveBudget;
window.exportCSV = exportCSV;
window.importCSV = importCSV;
