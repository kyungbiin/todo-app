/**
 * Todo App V3 - Calendar & Korean
 */

// --- State Management ---
const state = {
    todos: JSON.parse(localStorage.getItem('todos')) || [],
    filter: 'all',
    sortBy: 'createdAt-desc',
    searchQuery: '',
    darkMode: localStorage.getItem('darkMode') === 'true',
    deletedTodo: null,
    undoTimeout: null,
    currentDate: new Date(), // For Calendar navigation
    selectedDate: new Date() // For selecting a specific day
};

// --- DOM Elements ---
const elements = {
    input: document.getElementById('todo-input'),
    addBtn: document.getElementById('add-btn'),
    list: document.getElementById('todo-list'),
    prioritySelect: document.getElementById('priority-select'),
    categorySelect: document.getElementById('category-select'),
    searchInput: document.getElementById('search-input'),
    sortSelect: document.getElementById('sort-select'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    themeToggle: document.getElementById('theme-toggle'),
    sunIcon: document.querySelector('.sun-icon'),
    moonIcon: document.querySelector('.moon-icon'),
    progressBar: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    dateDisplay: document.getElementById('date-display'),
    emptyState: document.getElementById('empty-state'),
    toast: document.getElementById('toast'),
    undoBtn: document.getElementById('undo-btn'),

    // Calendar Elements
    calendarDays: document.getElementById('calendar-days'),
    monthYear: document.getElementById('calendar-month-year'),
    prevMonthBtn: document.getElementById('prev-month'),
    nextMonthBtn: document.getElementById('next-month'),
    selectedDateTitle: document.getElementById('selected-date-title')
};

// --- Initialization ---
function init() {
    applyTheme();
    renderDateDisplay();
    renderCalendar();
    setupEventListeners();
    render();
}

// --- Event Listeners ---
function setupEventListeners() {
    elements.addBtn.addEventListener('click', handleAddTodo);
    elements.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAddTodo();
    });

    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        render();
    });

    elements.sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        render();
    });

    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.filter = btn.dataset.filter;
            render();
        });
    });

    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.undoBtn.addEventListener('click', handleUndo);

    // Calendar Navigation
    elements.prevMonthBtn.addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        renderCalendar();
    });

    elements.nextMonthBtn.addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        renderCalendar();
    });
}

// --- Calendar Logic ---

function renderCalendar() {
    elements.calendarDays.innerHTML = '';

    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();

    // Header text (e.g., 2024년 2월)
    elements.monthYear.textContent = `${year}년 ${month + 1}월`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = new Date(state.selectedDate);
    selected.setHours(0, 0, 0, 0);

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        elements.calendarDays.appendChild(emptyCell);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;

        const currentIterDate = new Date(year, month, day);
        const dateStr = formatDateKey(currentIterDate);

        // Highlight Today
        if (currentIterDate.getTime() === today.getTime()) {
            dayCell.classList.add('today');
        }

        // Highlight Selected
        if (currentIterDate.getTime() === selected.getTime()) {
            dayCell.classList.add('selected');
        }

        // Add dots for tasks
        if (hasTasksOnDate(dateStr)) {
            const dot = document.createElement('div');
            dot.className = 'calendar-dot';
            dayCell.appendChild(dot);
        }

        dayCell.addEventListener('click', () => {
            state.selectedDate = new Date(year, month, day);
            renderCalendar(); // Re-render to update highlights
            render(); // Re-render list for new date
        });

        elements.calendarDays.appendChild(dayCell);
    }
}

function formatDateKey(date) {
    // Return Format: YYYY-MM-DD
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function hasTasksOnDate(dateStr) {
    return state.todos.some(t => t.dueDate === dateStr && !t.completed);
}

// --- Core Logic ---

function handleAddTodo() {
    const text = elements.input.value.trim();
    if (!text) return;

    // Use selected date from calendar
    const dateStr = formatDateKey(state.selectedDate);
    console.log("Adding todo for:", dateStr);

    const newTodo = {
        id: Date.now().toString(),
        text: text,
        completed: false,
        priority: elements.prioritySelect.value,
        category: elements.categorySelect.value,
        dueDate: dateStr, // Assign to selected calendar date
        createdAt: Date.now()
    };

    state.todos.unshift(newTodo);
    saveState();
    resetInputs();
    render();
    renderCalendar(); // Update dots
}

function deleteTodo(id) {
    const todoIndex = state.todos.findIndex(t => t.id === id);
    if (todoIndex === -1) return;

    state.deletedTodo = {
        item: state.todos[todoIndex],
        index: todoIndex
    };

    state.todos.splice(todoIndex, 1);
    saveState();
    render();
    renderCalendar(); // Update dots
    showToast();
}

function handleUndo() {
    if (!state.deletedTodo) return;

    state.todos.splice(state.deletedTodo.index, 0, state.deletedTodo.item);
    state.deletedTodo = null;
    clearTimeout(state.undoTimeout);
    hideToast();
    saveState();
    render();
    renderCalendar();
}

function toggleTodo(id) {
    const todo = state.todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveState();
        render();
        renderCalendar(); // Update dots
    }
}

function updateTodoText(id, newText) {
    const todo = state.todos.find(t => t.id === id);
    if (todo && newText.trim()) {
        todo.text = newText.trim();
        saveState();
    } else {
        render();
    }
}

// --- Rendering ---

function render() {
    // Update Title
    const month = state.selectedDate.getMonth() + 1;
    const day = state.selectedDate.getDate();
    elements.selectedDateTitle.textContent = `${month}월 ${day}일의 일정`;

    const selectedDateStr = formatDateKey(state.selectedDate);

    // 1. Filter
    let filteredTodos = state.todos.filter(todo => {
        // Date Filter (Crucial for Calendar App)
        if (todo.dueDate !== selectedDateStr) return false;

        // Status Filter
        if (state.filter === 'active' && todo.completed) return false;
        if (state.filter === 'completed' && !todo.completed) return false;

        // Search Filter
        if (state.searchQuery && !todo.text.toLowerCase().includes(state.searchQuery)) return false;

        return true;
    });

    // 2. Sort
    filteredTodos.sort((a, b) => {
        switch (state.sortBy) {
            case 'createdAt-desc': return b.createdAt - a.createdAt;
            case 'createdAt-asc': return a.createdAt - b.createdAt;
            case 'priority-desc':
                const pMap = { high: 3, medium: 2, low: 1 };
                return pMap[b.priority] - pMap[a.priority];
            default: return 0;
        }
    });

    // 3. Render List
    elements.list.innerHTML = '';

    if (filteredTodos.length === 0) {
        elements.emptyState.classList.remove('hidden');
    } else {
        elements.emptyState.classList.add('hidden');
        filteredTodos.forEach(todo => {
            const el = createTodoElement(todo);
            elements.list.appendChild(el);
        });
    }

    // 4. Update Stats (Global or Daily? Daily for calendar view)
    updateProgress(filteredTodos);
}

function createTodoElement(todo) {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    const content = document.createElement('div');
    content.className = 'todo-content';

    const textSpan = document.createElement('span');
    textSpan.className = 'todo-text';
    textSpan.textContent = todo.text;
    textSpan.contentEditable = true;
    textSpan.addEventListener('blur', (e) => updateTodoText(todo.id, e.target.textContent));
    textSpan.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
        }
    });

    const meta = document.createElement('div');
    meta.className = 'todo-meta';

    // Translating Priorities for display
    const prioMap = { low: '낮음', medium: '보통', high: '높음' };
    const pBadge = document.createElement('span');
    pBadge.className = `badge badge-${todo.priority}`;
    pBadge.textContent = prioMap[todo.priority];

    // Translating Categories for display
    const catMap = { personal: '개인', work: '업무', study: '공부', etc: '기타' };
    const cBadge = document.createElement('span');
    cBadge.className = `badge badge-category`;
    cBadge.textContent = catMap[todo.category] || todo.category;

    meta.appendChild(pBadge);
    meta.appendChild(cBadge);

    content.appendChild(textSpan);
    content.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-btn';
    deleteBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
    deleteBtn.ariaLabel = '삭제';
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(content);
    li.appendChild(actions);

    return li;
}

// --- Helpers ---

function updateProgress(currentList) {
    const total = currentList.length;
    const completed = currentList.filter(t => t.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    elements.progressText.textContent = `${completed}/${total}`;
    elements.progressBar.style.width = `${percentage}%`;
}

function showToast() {
    elements.toast.classList.remove('hidden');

    if (state.undoTimeout) clearTimeout(state.undoTimeout);

    state.undoTimeout = setTimeout(() => {
        hideToast();
        state.deletedTodo = null;
    }, 5000);
}

function hideToast() {
    elements.toast.classList.add('hidden');
}

function resetInputs() {
    elements.input.value = '';
    elements.input.focus();
}

function saveState() {
    localStorage.setItem('todos', JSON.stringify(state.todos));
}

function renderDateDisplay() {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    elements.dateDisplay.textContent = new Date().toLocaleDateString('ko-KR', options);
}

function toggleTheme() {
    state.darkMode = !state.darkMode;
    applyTheme();
    localStorage.setItem('darkMode', state.darkMode);
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');

    if (state.darkMode) {
        elements.sunIcon.classList.add('hidden');
        elements.moonIcon.classList.remove('hidden');
    } else {
        elements.sunIcon.classList.remove('hidden');
        elements.moonIcon.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', init);
