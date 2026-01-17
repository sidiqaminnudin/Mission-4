/* ========= CONFIG ========= */
const STORAGE_KEY = "todo_tasks_v2";

/* ========= ELEMENTS ========= */
const textarea = document.querySelector("textarea");
const addBtn = document.querySelector(".btn-primary");
const pillButtons = document.querySelectorAll(".pill");
const deadlineInput = document.querySelector('input[type="date"]');

const dateEl = document.querySelector(".current-date");
const timeEl = document.querySelector(".current-time");

const tabs = document.querySelectorAll(".tab");
const todoList = document.querySelector(".todo-list");
const doneList = document.querySelector(".done-list");
const emptyEl = document.querySelector(".empty");
const deleteAllBtn = document.querySelector(".btn-delete-all");

/* ========= STATE ========= */
let selectedPriority = getInitialPriority();
let tasks = loadTasks();
let activeTab = "todo";

/* ========= INIT ========= */
initDateTime();
bindEvents();
switchTab("todo");
render();

/* ========= DATE/TIME ========= */
function initDateTime() {
  updateDateTime();
  setInterval(updateDateTime, 1000);
}

function updateDateTime() {
  if (!dateEl || !timeEl) return;

  const now = new Date();
  dateEl.textContent = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  timeEl.textContent = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

/* ========= EVENTS ========= */
function bindEvents() {
  // Priority pills
  pillButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      pillButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedPriority = btn.textContent.trim(); // Low/Medium/High
    });
  });

  // Add task
  addBtn?.addEventListener("click", () => {
    const text = textarea.value.trim();
    if (!text) return;

    const now = new Date();
    const startDate = toYMD(now);
    const dueDate = deadlineInput.value ? deadlineInput.value : startDate;

    const task = {
      id: Date.now(),
      text,
      priority: selectedPriority,
      startISO: now.toISOString(), // untuk data lengkap (opsional)
      startDate,                   // YYYY-MM-DD (lokal)
      dueDate,                     // YYYY-MM-DD (lokal)
      done: false
    };

    tasks.push(task);
    saveTasks();

    textarea.value = "";
    deadlineInput.value = "";

    switchTab("todo");
    render();
  });

  // Tabs
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab; // "todo" / "done"
      switchTab(target);
      render();
    });
  });

  // Delete all
  deleteAllBtn?.addEventListener("click", () => {
    if (tasks.length === 0) return;

    const ok = confirm("Delete all tasks?");
    if (!ok) return;

    tasks = [];
    saveTasks();
    render();
  });
}

/* ========= TAB SWITCH ========= */
function switchTab(tabName) {
  activeTab = tabName;

  tabs.forEach(t => t.classList.remove("active"));
  const activeBtn = [...tabs].find(t => t.dataset.tab === tabName);
  if (activeBtn) activeBtn.classList.add("active");

  // show/hide lists
  if (todoList) todoList.style.display = tabName === "todo" ? "flex" : "none";
  if (doneList) doneList.style.display = tabName === "done" ? "flex" : "none";
}

/* ========= RENDER ========= */
function render() {
  if (!todoList || !doneList) return;

  todoList.innerHTML = "";
  doneList.innerHTML = "";

  const todoTasks = tasks.filter(t => !t.done);
  const doneTasks = tasks.filter(t => t.done);

  // empty state only for todo tab
  if (emptyEl) {
    emptyEl.style.display = activeTab === "todo" && todoTasks.length === 0 ? "block" : "none";
  }

  todoTasks.forEach(task => todoList.appendChild(createTaskItem(task)));
  doneTasks.forEach(task => doneList.appendChild(createTaskItem(task)));
}

function createTaskItem(task) {
  const item = document.createElement("div");
  item.className = "task-item";

  const overdue = isOverdue(task);

  item.innerHTML = `
    <div class="task-left">
      <input type="checkbox" ${task.done ? "checked" : ""} />
      <div class="task-text ${task.done ? "done" : ""}">
        <p>${escapeHtml(task.text)}</p>

        <div class="task-meta">
          <span class="badge-priority ${task.priority.toLowerCase()}">${escapeHtml(task.priority)}</span>
          <span class="time-start">Start: ${formatDateYMD(task.startDate)}</span>
          <span class="time-deadline">Due: ${formatDateYMD(task.dueDate)}</span>
          ${overdue ? `<span class="overdue-text">OVERDUE</span>` : ""}
        </div>
      </div>
    </div>

    <button class="delete-btn" type="button" aria-label="Delete task">✕</button>
  `;

  // checkbox
  const checkbox = item.querySelector('input[type="checkbox"]');
  checkbox.addEventListener("change", e => {
    task.done = e.target.checked;
    saveTasks();
    render();
  });

  // delete single
  const delBtn = item.querySelector(".delete-btn");
  delBtn.addEventListener("click", () => {
    tasks = tasks.filter(t => t.id !== task.id);
    saveTasks();
    render();
  });

  return item;
}

/* ========= DATE HELPERS (timezone-safe) ========= */
function toYMD(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocalDate(ymd, endOfDay = false) {
  const [y, m, d] = String(ymd).split("-").map(Number);
  if (!y || !m || !d) return new Date(NaN);
  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
}

function formatDateYMD(ymd) {
  const dt = parseLocalDate(ymd, false);
  return dt.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function isOverdue(task) {
  if (!task?.dueDate) return false;
  if (task.done) return false;

  const dueEnd = parseLocalDate(task.dueDate, true);
  if (Number.isNaN(dueEnd.getTime())) return false;

  return dueEnd < new Date();
}

/* ========= STORAGE ========= */
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/* ========= OTHER HELPERS ========= */
function getInitialPriority() {
  const active = document.querySelector(".pill.active");
  return active ? active.textContent.trim() : "Low";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
