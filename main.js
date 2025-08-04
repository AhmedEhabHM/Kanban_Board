// DOM Elements
const themeSwitch = document.getElementById("theme-switch");
const sidebar = document.querySelector(".sidebar");
const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
const hideSidebarButton = document.querySelector(".hide-sidebar");
const boardHeader = document.getElementById("boardHeader");
const boardList = document.getElementById("boardList");
const kanbanBoard = document.querySelector(".kanban-board");

// App State
let currentEditBoard = null;
let arrayOfTasks = JSON.parse(localStorage.getItem("tasks")) || [];
let arrayOfBoards = JSON.parse(localStorage.getItem("boards")) || [
  { id: 1, title: "Platform Launch" },
  { id: 2, title: "Marketing Plan" },
  { id: 3, title: "Roadmap" }
];

// Drag and Drop State
let touchStartTime;
let isDragging = false;
let touchElement = null;

// Initialize App
function init() {
  loadTheme();
  setupEventListeners();
  renderBoards();
  renderTasks();
}

// Theme Functions
function loadTheme() {
  if (localStorage.getItem("theme") === "light") {
    enableLightMode();
  }
}

function enableLightMode() {
  document.body.classList.add("light-mode");
  themeSwitch.checked = true;
  localStorage.setItem("theme", "light");
}

function enableDarkMode() {
  document.body.classList.remove("light-mode");
  themeSwitch.checked = false;
  localStorage.setItem("theme", "dark");
}

// Task Functions
function addTaskToArray(title, category, description = "") {
  const activeBoard = document.querySelector("#boardList li.active .board-title")?.textContent || "Platform Launch";
  const task = {
    id: Date.now(),
    title,
    category,
    description,
    board: activeBoard
  };
  arrayOfTasks.push(task);
  saveTasks();
  renderTasks();
}

function deleteTask(taskId) {
  arrayOfTasks = arrayOfTasks.filter(task => task.id !== taskId);
  saveTasks();
  renderTasks();
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(arrayOfTasks));
}

// Board Functions
function addBoard(title) {
  if (!title.trim()) return;
  
  const newBoard = {
    id: Date.now(),
    title: title.trim()
  };
  arrayOfBoards.push(newBoard);
  saveBoards();
  renderBoards();
}

function saveBoards() {
  localStorage.setItem("boards", JSON.stringify(arrayOfBoards));
}

// Rendering Functions
function renderTasks() {
  const activeBoard = document.querySelector("#boardList li.active .board-title")?.textContent || "Platform Launch";
  const columns = {
    todo: document.querySelector(".todo"),
    doing: document.querySelector(".doing"),
    done: document.querySelector(".done")
  };

  // Clear columns
  Object.values(columns).forEach(column => {
    column.innerHTML = `<h3>${column.classList.contains("todo") ? "🔵" : 
                        column.classList.contains("doing") ? "🟣" : "🟢"} ${column.dataset.category}</h3>`;
  });

  // Render tasks
  arrayOfTasks
    .filter(task => task.board === activeBoard)
    .forEach(task => {
      const taskElement = createTaskElement(task);
      columns[task.category.toLowerCase()].appendChild(taskElement);
    });

  setupDragAndDrop();
}

function createTaskElement(task) {
  const div = document.createElement("div");
  div.className = `task ${task.category.toLowerCase()}`;
  div.dataset.id = task.id;
  div.draggable = true;

  div.innerHTML = `
    <span>${task.title}</span>
    <button class="del"><i class="fas fa-trash"></i></button>
  `;

  // Event listeners
  div.addEventListener("click", () => openEditTaskModal(task));
  div.querySelector(".del").addEventListener("click", (e) => {
    e.stopPropagation();
    if (confirm("Delete this task?")) {
      deleteTask(task.id);
      showToast(`Task "${task.title}" deleted!`);
    }
  });

  // Drag and drop
  div.addEventListener("dragstart", dragStart);
  div.addEventListener("touchstart", handleTouchStart, { passive: false });
  div.addEventListener("touchmove", handleTouchMove, { passive: false });
  div.addEventListener("touchend", handleTouchEnd);

  return div;
}

function renderBoards() {
  boardList.innerHTML = '';
  
  arrayOfBoards.forEach(board => {
    const li = document.createElement("li");
    li.innerHTML = `
      <i class="fas fa-columns"></i>
      <span class="board-title">${board.title}</span>
    `;
    
    if (board.title === boardHeader.textContent) {
      li.classList.add("active");
    }
    
    li.addEventListener("click", () => {
      document.querySelectorAll("#boardList li").forEach(item => 
        item.classList.remove("active"));
      li.classList.add("active");
      boardHeader.textContent = board.title;
      renderTasks();
    });
    
    boardList.appendChild(li);
  });

  // Add Create Board button
  const createBoardLi = document.createElement("li");
  createBoardLi.className = "create-board";
  createBoardLi.innerHTML = `
    <i class="fas fa-plus"></i>
    Create New Board
  `;
  createBoardLi.addEventListener("click", () => {
    const boardName = prompt("Enter board name:");
    if (boardName) addBoard(boardName);
  });
  boardList.appendChild(createBoardLi);
}

// Modal Functions
function setupModals() {
  // Add Task Modal
  document.querySelector(".add-task").addEventListener("click", () => {
    document.getElementById("taskModal").classList.remove("hidden");
  });

  document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("taskModal").classList.add("hidden");
  });

  document.getElementById("saveTask").addEventListener("click", () => {
    const title = document.getElementById("taskTitle").value.trim();
    const description = document.getElementById("taskDescription").value.trim();
    const status = document.getElementById("taskStatus").value;
    
    if (title) {
      addTaskToArray(title, status, description);
      document.getElementById("taskModal").classList.add("hidden");
      showToast(`Task "${title}" added!`);
    } else {
      alert("Task title is required!");
    }
  });

  // Edit Task Modal
  document.getElementById("closeEditModal").addEventListener("click", () => {
    document.getElementById("editTaskModal").classList.add("hidden");
  });
}

function openEditTaskModal(task) {
  document.getElementById("editTaskTitle").value = task.title;
  document.getElementById("editTaskDescription").value = task.description;
  document.getElementById("editTaskStatus").value = task.category;
  document.getElementById("editTaskModal").dataset.id = task.id;
  document.getElementById("editTaskModal").classList.remove("hidden");
}

// Drag and Drop Functions
function dragStart(e) {
  e.dataTransfer.setData("text/plain", e.target.dataset.id);
}

function handleTouchStart(e) {
  touchElement = e.target.closest(".task");
  touchStartTime = Date.now();
  isDragging = false;
}

function handleTouchMove(e) {
  if (!touchElement || isDragging) return;
  
  const touchTime = Date.now() - touchStartTime;
  if (touchTime < 200) return;
  
  isDragging = true;
  e.preventDefault();
  const touch = e.touches[0];
  touchElement.style.position = "absolute";
  touchElement.style.left = `${touch.pageX - touchElement.offsetWidth / 2}px`;
  touchElement.style.top = `${touch.pageY - touchElement.offsetHeight / 2}px`;
}

function handleTouchEnd(e) {
  if (!touchElement || !isDragging) {
    touchElement = null;
    return;
  }

  const touch = e.changedTouches[0];
  const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
  const column = dropTarget?.closest(".column");

  if (column) {
    const taskId = parseInt(touchElement.dataset.id);
    const newCategory = column.dataset.category;
    
    arrayOfTasks = arrayOfTasks.map(task => 
      task.id === taskId ? { ...task, category: newCategory } : task
    );
    
    saveTasks();
    renderTasks();
  }

  touchElement.style.position = "";
  touchElement.style.left = "";
  touchElement.style.top = "";
  touchElement = null;
  isDragging = false;
}

function setupDragAndDrop() {
  document.querySelectorAll(".column").forEach(column => {
    column.addEventListener("dragover", e => {
      e.preventDefault();
      column.classList.add("drag-over");
    });
    
    column.addEventListener("dragleave", () => {
      column.classList.remove("drag-over");
    });
    
    column.addEventListener("drop", e => {
      e.preventDefault();
      column.classList.remove("drag-over");
      const taskId = e.dataTransfer.getData("text/plain");
      const newCategory = column.dataset.category;
      
      arrayOfTasks = arrayOfTasks.map(task => 
        task.id === parseInt(taskId) ? { ...task, category: newCategory } : task
      );
      
      saveTasks();
      renderTasks();
    });
  });
}

// UI Helpers
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.style.opacity = "1", 10);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function toggleSidebar() {
  sidebar.classList.toggle("hidden");
  sidebar.classList.toggle("open");
}

// Event Listeners
function setupEventListeners() {
  // Theme toggle
  themeSwitch.addEventListener("change", () => {
    themeSwitch.checked ? enableLightMode() : enableDarkMode();
  });

  // Sidebar toggle
  hideSidebarButton.addEventListener("click", toggleSidebar);
  mobileMenuToggle.addEventListener("click", toggleSidebar);

  // Window resize
  window.addEventListener("resize", () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.add("hidden");
      sidebar.classList.remove("open");
    } else {
      sidebar.classList.remove("hidden");
      sidebar.classList.add("open");
    }
  });

  // Initialize modals
  setupModals();
}

// Start the app
init();