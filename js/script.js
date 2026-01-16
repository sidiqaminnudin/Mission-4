/* ========= CONFIG ========= */
const STORAGE_KEY = "todo_tasks_v1";

/* ========= ELEMENTS ========= */
const textarea = document.querySelector("textarea");
const addBtn = document.querySelector(".btn-primary");
const pillButtons = document.querySelectorAll(".pill");
const deadlineInput = document.querySelector('input[type="date"]');

const tabs = document.querySelectorAll(".tab");
const todoList = document.querySelector(".todo-list");
const doneList = document.querySelector(".done-list");
const emptyEl = document.querySelector(".empty");

/* ========= STATE ========= */
let selectedPriority = getInitialPriority(); // dari pill yang active
let tasks = loadTasks();
let activeTab = "todo"; // default

/* ========= INIT ========= */
render();
bindEvents();

/* ========= FUNCTIONS ========= */
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
  addBtn.addEventListener("click", () => {
    const text = textarea.value.trim();
    if (!text) return;

    const task = {
      id: Date.now(),
      text,
      priority: selectedPriority, // Low/Medium/High
      deadline: deadlineInput.value || "", // "YYYY-MM-DD" atau ""
      done: false,
      createdAt: new Date().toISOString()
    };

    tasks.push(task);
    saveTasks();

    // reset form
    textarea.value = "";
    deadlineInput.value = "";

    // setelah add, pastikan tab To Do aktif
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
}

function switchTab(tabName) {
  activeTab = tabName;

  tabs.forEach(t => t.classList.remove("active"));
  const activeBtn = [...tabs].find(t => t.dataset.tab === tabName);
  if (activeBtn) activeBtn.classList.add("active");

  // tampilkan list sesuai tab (tanpa inline style tambahan selain display)
  todoList.style.display = tabName === "todo" ? "flex" : "none";
  doneList.style.display = tabName === "done" ? "flex" : "none";
}

function render() {
  // bersihkan list
  todoList.innerHTML = "";
  doneList.innerHTML = "";

  const todoTasks = tasks.filter(t => !t.done);
  const doneTasks = tasks.filter(t => t.done);

  // empty state: hanya muncul saat tab todo aktif & todo kosong
  if (activeTab === "todo" && todoTasks.length === 0) {
    emptyEl.style.display = "block";
  } else {
    emptyEl.style.display = "none";
  }

  // render todo
  todoTasks.forEach(task => {
    todoList.appendChild(createTaskItem(task));
  });

  // render done
  doneTasks.forEach(task => {
    doneList.appendChild(createTaskItem(task));
  });
}

function createTaskItem(task) {
  const item = document.createElement("div");
  item.className = "task-item";

  const isOverdue = getIsOverdue(task);

  // meta line (badge + deadline + overdue)
  const deadlineHtml = task.deadline
    ? `<span class="deadline-text">${escapeHtml(task.deadline)}</span>`
    : "";

  const overdueHtml = isOverdue
    ? `<span class="overdue-text">OVERDUE</span>`
    : "";

  item.innerHTML = `
    <div class="task-left">
      <input type="checkbox" ${task.done ? "checked" : ""} />
      <div class="task-text ${task.done ? "done" : ""}">
        <p>${escapeHtml(task.text)}</p>
        <div class="task-meta">
          <span class="badge-priority ${task.priority.toLowerCase()}">${escapeHtml(task.priority)}</span>
          ${deadlineHtml}
          ${overdueHtml}
        </div>
      </div>
    </div>
    <button class="delete-btn" type="button" aria-label="Delete task">✕</button>
  `;

  // events: checkbox toggle
  const checkbox = item.querySelector('input[type="checkbox"]');
  checkbox.addEventListener("change", e => {
    task.done = e.target.checked;
    saveTasks();
    render();
  });

  // events: delete
  const deleteBtn = item.querySelector(".delete-btn");
  deleteBtn.addEventListener("click", () => {
    tasks = tasks.filter(t => t.id !== task.id);
    saveTasks();
    render();
  });

  return item;
}

/* ========= HELPERS ========= */
function getIsOverdue(task) {
  if (!task.deadline) return false;
  if (task.done) return false;

  // deadline dianggap sampai akhir hari
  const endOfDay = new Date(task.deadline + "T23:59:59");
  return endOfDay < new Date();
}

function getInitialPriority() {
  const active = document.querySelector(".pill.active");
  return active ? active.textContent.trim() : "Low";
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    // validasi ringan
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
