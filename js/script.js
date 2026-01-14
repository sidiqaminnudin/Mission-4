const STORAGE_KEY = "todo_tasks_v1";

const textarea = document.querySelector("textarea");
const addBtn = document.querySelector(".btn-primary");
const priorityBtns = document.querySelectorAll(".pill");
const todoList = document.querySelector(".todo-list");
const doneList = document.querySelector(".done-list");
const tabs = document.querySelectorAll(".tab");
const deadlineInput = document.querySelector('input[type="date"]');

let tasks = loadTasks();
let selectedPriority = "Medium";

// render pertama kali (biar langsung muncul yang tersimpan)
render();

/* ===== STORAGE ===== */
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/* ===== PRIORITY SELECT ===== */
priorityBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    priorityBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedPriority = btn.textContent;
  });
});

/* ===== ADD TASK ===== */
addBtn.addEventListener("click", () => {
  const text = textarea.value.trim();
  if (!text) return;

  const task = {
    id: Date.now(),
    text,
    priority: selectedPriority,
    deadline: deadlineInput.value, // "YYYY-MM-DD" atau ""
    createdAt: new Date().toISOString(),
    done: false
  };

  tasks.push(task);

  // reset input
  textarea.value = "";
  deadlineInput.value = "";

  saveTasks();
  render();
});

/* ===== RENDER ===== */
function render() {
  todoList.innerHTML = "";
  doneList.innerHTML = "";

  const todoTasks = tasks.filter(t => !t.done);

  if (todoTasks.length === 0) {
    todoList.innerHTML = `<div class="empty"><p>No tasks yet</p></div>`;
  }

  tasks.forEach(task => {
    const item = document.createElement("div");
    item.className = "task-item";

    const overdue =
      task.deadline &&
      !task.done &&
      new Date(task.deadline + "T23:59:59") < new Date();

    item.innerHTML = `
      <label>
        <input type="checkbox" ${task.done ? "checked" : ""}/>
        <span class="${task.done ? "done" : ""}">
          ${escapeHtml(task.text)}
          <small>(${task.priority})</small>
          ${task.deadline ? `<small>• ${task.deadline}</small>` : ""}
          ${overdue ? "<strong style='color:red'> OVERDUE</strong>" : ""}
        </span>
      </label>
      <button type="button" data-id="${task.id}">✕</button>
    `;

    // checkbox done/undone
    item.querySelector("input").addEventListener("change", e => {
      task.done = e.target.checked;
      saveTasks();
      render();
    });

    // delete 1 task
    item.querySelector("button").addEventListener("click", () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      render();
    });

    (task.done ? doneList : todoList).appendChild(item);
  });
}

/* ===== TAB SWITCH ===== */
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const isTodo = tab.dataset.tab === "todo";
    todoList.style.display = isTodo ? "block" : "none";
    doneList.style.display = isTodo ? "none" : "block";
  });
});

/* ===== HELPER (biar aman dari HTML injection) ===== */
function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
