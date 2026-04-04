// Mock Data & Config
const CATEGORY_MAP = {
    food: { name: '食費', emoji: '🍙' },
    daily: { name: '日用品', emoji: '🧴' },
    other: { name: 'その他', emoji: '💡' }
};

// Global State
let state = {
    currentTab: 'all',
    expenses: [],
    budgets: {}, // YYYY-MM keyed object
    currentMonth: new Date(2026, 3),
    editingId: null
};

function getYYYYMM(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

// --- Initialization ---
function init() {
    loadData();
    setupEventListeners();
    updateUI();

    // Set today's date in input form
    document.getElementById('expense-date').valueAsDate = new Date();
}

// --- Data Management ---
function loadData() {
    const saved = localStorage.getItem('howMuchLeftExpenses');
    const savedBudgets = localStorage.getItem('howMuchLeftBudgets');

    if (saved) {
        state.expenses = JSON.parse(saved);
    } else {
        state.expenses = [];
    }

    if (savedBudgets) {
        let parsed = JSON.parse(savedBudgets);
        if (parsed.all !== undefined) {
            // Migration
            state.budgets = { "2026-04": parsed };
        } else {
            state.budgets = parsed;
        }
    } else {
        state.budgets = {};
    }

    saveData();
}

function saveData() {
    localStorage.setItem('howMuchLeftExpenses', JSON.stringify(state.expenses));
    localStorage.setItem('howMuchLeftBudgets', JSON.stringify(state.budgets));
}

function addExpense(amount, category, date) {
    state.expenses.push({
        id: Date.now(),
        amount: parseInt(amount),
        category,
        date
    });
    saveData();
}

// --- Logic calculations ---
function getCalculatedData(tab) {
    const monthStr = getYYYYMM(state.currentMonth);
    const budgetObj = state.budgets[monthStr];

    if (!budgetObj || budgetObj.all === 0) {
        return { notSet: true };
    }

    const today = new Date(2026, 3, 16);
    const isCurrentMonthMock = (state.currentMonth.getFullYear() === 2026 && state.currentMonth.getMonth() === 3);

    let daysLeft = 0;
    if (isCurrentMonthMock) {
        const lastDay = new Date(2026, 4, 0);
        daysLeft = lastDay.getDate() - today.getDate();
    } else {
        const lastDay = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 0);
        daysLeft = lastDay.getDate(); // If future, show all days. If past, whatever.
    }

    let relevantExpenses = state.expenses.filter(e => e.date.startsWith(monthStr));
    if (tab !== 'all') {
        relevantExpenses = relevantExpenses.filter(e => e.category === tab);
    }

    const spent = relevantExpenses.reduce((sum, e) => sum + e.amount, 0);
    const budget = budgetObj[tab] || 0;
    const remaining = Math.max(0, budget - spent);

    const daily = daysLeft > 0 ? Math.max(0, Math.floor(remaining / daysLeft)) : 0;
    const weekly = daily * 7;

    const ratio = spent / (budget || 1);

    return {
        budget, spent, remaining, daysLeft, daily, weekly, ratio
    };
}

// --- UI Updates ---
function updateUI() {
    const monthStr = getYYYYMM(state.currentMonth);
    const data = getCalculatedData(state.currentTab);

    document.getElementById('current-month').innerText = `${state.currentMonth.getFullYear()}年${state.currentMonth.getMonth() + 1}月`;

    const noPrompt = document.getElementById('no-budget-prompt');
    const sums = document.getElementById('summary-area');
    const pacs = document.getElementById('pacing-area');
    const cats = document.getElementById('category-area');

    if (data.notSet) {
        if (noPrompt) noPrompt.style.display = 'block';
        if (sums) sums.style.display = 'none';
        if (pacs) pacs.style.display = 'none';
        if (cats) cats.style.display = 'none';
        renderHistory();
        return;
    }

    if (noPrompt) noPrompt.style.display = 'none';
    if (sums) sums.style.display = 'block';
    if (pacs) pacs.style.display = 'block';

    const fmt = (num) => new Intl.NumberFormat('ja-JP').format(num);
    const setTxt = (id, val) => document.getElementById(id).innerText = val;

    setTxt('disp-budget', '¥' + fmt(data.budget));
    setTxt('disp-spent', '¥' + fmt(data.spent));
    setTxt('disp-remaining', '¥' + fmt(data.remaining));
    setTxt('disp-days-left', data.daysLeft + '日');
    setTxt('disp-daily', '¥' + fmt(data.daily));
    setTxt('disp-weekly', '¥' + fmt(data.weekly));

    const bar = document.getElementById('main-progress');
    const pct = Math.min(100, (data.spent / Math.max(1, data.budget)) * 100);
    bar.style.width = pct + '%';

    const msgBox = document.getElementById('status-msg');
    msgBox.className = 'status-msg';
    bar.style.backgroundColor = 'var(--accent)';

    let statusText = "";
    if (data.ratio < 0.5) {
        msgBox.classList.add('status-success');
        bar.style.backgroundColor = 'var(--success)';
        statusText = '👍 順調です';
    } else if (data.ratio < 0.8) {
        msgBox.classList.add('status-warning');
        bar.style.backgroundColor = 'var(--warning)';
        statusText = '⚠️ 注意ペース';
    } else {
        msgBox.classList.add('status-danger');
        bar.style.backgroundColor = 'var(--danger)';
        statusText = '🚨 使いすぎ危険！';
    }

    const catName = state.currentTab === 'all' ? '全体' : CATEGORY_MAP[state.currentTab].name;
    msgBox.innerText = `${catName}は${statusText} (目安¥${fmt(data.daily)}/日)`;

    renderCategoryList();
    renderHistory();
}

function renderCategoryList() {
    const container = document.getElementById('category-list');
    const area = document.getElementById('category-area');

    if (state.currentTab !== 'all') {
        area.style.display = 'none';
        return;
    }

    area.style.display = 'block';
    let html = '';

    ['food', 'daily', 'other'].forEach(cat => {
        const d = getCalculatedData(cat);
        const ratio = d.ratio;

        let colorObj = { c: 'var(--success)', bg: 'var(--success-bg)' };
        if (ratio >= 0.8) colorObj = { c: 'var(--danger)', bg: 'var(--danger-bg)' };
        else if (ratio >= 0.5) colorObj = { c: 'var(--warning)', bg: 'var(--warning-bg)' };

        const pct = Math.min(100, ratio * 100);

        html += `
        <div class="cat-item">
            <div class="cat-header">
                <span class="cat-name">${CATEGORY_MAP[cat].emoji} ${CATEGORY_MAP[cat].name}</span>
                <span class="cat-amounts"><strong>¥${new Intl.NumberFormat('ja-JP').format(d.spent)}</strong> / ¥${new Intl.NumberFormat('ja-JP').format(d.budget)}</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${pct}%; background-color: ${colorObj.c};"></div>
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

function renderHistory() {
    const list = document.getElementById('history-list');
    let html = '';

    // Filter history to current month
    const monthStr = getYYYYMM(state.currentMonth);
    const relevantExpenses = state.expenses.filter(e => e.date.startsWith(monthStr));
    const sorted = [...relevantExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sorted.length === 0) {
        html = `
        <div style="text-align:center; padding: 40px 20px; color: var(--text-sub);">
            <p style="margin-bottom: 16px;">まだ支出がありません</p>
            <button class="primary-btn" onclick="document.querySelector('[data-target=\\'view-input\\']').click()" style="width:auto; padding: 10px 20px;">支出を入力する</button>
        </div>`;
    } else {
        sorted.forEach(e => {
            html += `
            <div class="history-item fade-in" style="cursor: pointer;" onclick="openEdit(${e.id})">
                <div class="hi-cat">${CATEGORY_MAP[e.category]?.emoji || '❔'}</div>
                <div class="hi-details">
                    <div>${CATEGORY_MAP[e.category]?.name || '不明'}</div>
                    <div class="hi-date">${e.date}</div>
                </div>
                <div class="hi-amount">
                    ¥${new Intl.NumberFormat('ja-JP').format(e.amount)}
                </div>
                <button class="icon-btn delete-btn" onclick="deleteExpense(event, ${e.id})" style="color:var(--danger); width:32px; height:32px; margin-left: 8px;">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>`;
        });
    }

    list.innerHTML = html;
}

// Inline handlers
window.deleteExpense = function (e, id) {
    if (e) e.stopPropagation();
    if (confirm('この支出を削除しますか？')) {
        state.expenses = state.expenses.filter(exp => exp.id !== id);
        saveData();
        updateUI();
        showToast('削除しました');
    }
};

window.openEdit = function (id) {
    const exp = state.expenses.find(e => e.id === id);
    if (!exp) return;
    state.editingId = id;
    document.getElementById('expense-amount').value = exp.amount;
    document.querySelector(`input[name="expense_cat"][value="${exp.category}"]`).checked = true;
    document.getElementById('expense-date').value = exp.date;

    document.querySelector('#view-input h1').innerText = '支出を編集';
    switchView('view-input');
};

// --- Interactions ---
function setupEventListeners() {
    // Tabs
    document.querySelectorAll('.tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            state.currentTab = e.target.dataset.tab;

            // Re-trigger animations
            const cards = document.querySelectorAll('#summary-area, #pacing-area, #category-area');
            cards.forEach(c => {
                c.style.animation = 'none';
                c.offsetHeight; /* trigger reflow */
                c.style.animation = null;
            });

            updateUI();
        });
    });

    // Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = btn.closest('.nav-item').dataset.target;
            switchView(target);

            document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
            if (!btn.closest('.nav-item').classList.contains('fab')) {
                btn.closest('.nav-item').classList.add('active');
            }
        });
    });

    // Cancel Input
    document.getElementById('close-input-btn').addEventListener('click', () => {
        state.editingId = null;
        document.querySelector('#view-input h1').innerText = '支出を入力';
        document.getElementById('expense-amount').value = '';
        document.getElementById('expense-date').valueAsDate = new Date();
        switchView('view-dashboard');
        document.querySelector('[data-target="view-dashboard"]').classList.add('active');
    });

    // Save Expense
    document.getElementById('save-expense-btn').addEventListener('click', () => {
        const amtInput = document.getElementById('expense-amount');
        const catInput = document.querySelector('input[name="expense_cat"]:checked');
        const dateInput = document.getElementById('expense-date');

        if (!amtInput.value || isNaN(amtInput.value)) return;

        if (state.editingId) {
            const index = state.expenses.findIndex(e => e.id === state.editingId);
            if (index !== -1) {
                state.expenses[index].amount = parseInt(amtInput.value);
                state.expenses[index].category = catInput.value;
                state.expenses[index].date = dateInput.value;
            }
            state.editingId = null;
            showToast('更新しました');
            saveData();
        } else {
            addExpense(amtInput.value, catInput.value, dateInput.value);
            showToast('保存しました');
        }

        // Reset input
        amtInput.value = '';
        document.getElementById('expense-date').valueAsDate = new Date();
        document.querySelector('#view-input h1').innerText = '支出を入力';

        switchView('view-dashboard');
        document.querySelector('[data-target="view-dashboard"]').classList.add('active');
        updateUI();
    });

    // No budget prompt
    const goToSetBtn = document.getElementById('go-to-settings-btn');
    if (goToSetBtn) {
        goToSetBtn.addEventListener('click', () => {
            document.getElementById('settings-btn').click();
        });
    }

    // Month navigation
    document.getElementById('prev-month-btn').addEventListener('click', () => {
        state.currentMonth.setMonth(state.currentMonth.getMonth() - 1);
        updateUI();
    });

    document.getElementById('next-month-btn').addEventListener('click', () => {
        state.currentMonth.setMonth(state.currentMonth.getMonth() + 1);
        updateUI();
    });

    // Settings / Budget buttons
    document.getElementById('settings-btn').addEventListener('click', () => {
        const dStr = getYYYYMM(state.currentMonth);
        const sel = document.getElementById('budget-month-select');

        let optionExists = Array.from(sel.options).some(opt => opt.value === dStr);
        if (!optionExists) {
            const opt = document.createElement('option');
            opt.value = dStr;
            opt.text = `${state.currentMonth.getFullYear()}年${state.currentMonth.getMonth() + 1}月`;
            sel.add(opt);
        }
        sel.value = dStr;

        const budgetObj = state.budgets[sel.value] || { all: 0, food: 0, daily: 0, other: 0 };
        document.getElementById('budget-all').value = budgetObj.all || '';
        document.getElementById('budget-food').value = budgetObj.food || '';
        document.getElementById('budget-daily').value = budgetObj.daily || '';
        document.getElementById('budget-other').value = budgetObj.other || '';
        switchView('view-budget');
    });

    document.getElementById('budget-month-select').addEventListener('change', (e) => {
        const budgetObj = state.budgets[e.target.value] || { all: 0, food: 0, daily: 0, other: 0 };
        document.getElementById('budget-all').value = budgetObj.all || '';
        document.getElementById('budget-food').value = budgetObj.food || '';
        document.getElementById('budget-daily').value = budgetObj.daily || '';
        document.getElementById('budget-other').value = budgetObj.other || '';
    });

    document.getElementById('close-budget-btn').addEventListener('click', () => {
        switchView('view-dashboard');
    });

    document.getElementById('save-budget-btn').addEventListener('click', () => {
        const val = (id) => parseInt(document.getElementById(id).value) || 0;
        const selMonth = document.getElementById('budget-month-select').value;
        state.budgets[selMonth] = {
            all: val('budget-all'),
            food: val('budget-food'),
            daily: val('budget-daily'),
            other: val('budget-other')
        };
        saveData();
        showToast();

        const parts = selMonth.split('-');
        state.currentMonth = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);

        switchView('view-dashboard');
        updateUI();
    });
}

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function showToast(message = '保存しました') {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// Start app
window.addEventListener('DOMContentLoaded', init);
