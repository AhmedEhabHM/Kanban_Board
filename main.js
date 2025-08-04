let themeSwitch = document.getElementById("theme-switch");
let body = document.body;
let currentEditBoard = null;
let arrayOfTasks = [];
let arrayOfBoards = [
  { id: 1, title: "Platform Launch" },
  { id: 2, title: "Marketing Plan" },
  { id: 3, title: "Roadmap" },
];

// Drag and drop variables
let touchStartTime;
let isDragging = false;
let touchElement = null;

function loadFromLocalStorage() {
  if (localStorage.getItem("tasks")) {
    arrayOfTasks = JSON.parse(localStorage.getItem("tasks"));
  }
  if (localStorage.getItem("boards")) {
    arrayOfBoards = JSON.parse(localStorage.getItem("boards"));
  }
  if (localStorage.getItem("theme") === "light") {
    enableLightMode();
  }
}

function clearModalFields() {
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDescription").value = "";
  document.getElementById("taskStatus").value = "TODO";
}

// Task functions
function addTaskToArray(title, category, description = "") {
  let activeBoard = document.querySelector("#boardList li.active .board-title")?.textContent || "Platform Launch";
  const task = { id: Date.now(), title, category, description, board: activeBoard };
  arrayOfTasks.push(task);
  addElementsToPageFrom(arrayOfTasks);
  addDataToLocalStorageFrom(arrayOfTasks);
}

function deleteTaskWith(taskId) {
  arrayOfTasks = arrayOfTasks.filter((task) => task.id != taskId);
  addDataToLocalStorageFrom(arrayOfTasks);
  addElementsToPageFrom(arrayOfTasks);
}

// Board functions
function addBoardsToPageFrom(boards) {
  let boardList = document.getElementById("boardList");
  boardList.innerHTML = "";
  
  boards.forEach((board) => {
    let li = document.createElement("li");
    li.className = board.title === document.getElementById("boardHeader").textContent ? "active" : "";
    li.innerHTML = `<i class="fas fa-columns"></i> <span class="board-title">${board.title}</span>`;
    
    li.addEventListener("click", function () {
      document.querySelectorAll("#boardList li:not(.create-board)").forEach(i => i.classList.remove("active"));
      this.classList.add("active");
      document.getElementById("boardHeader").textContent = board.title;
      addElementsToPageFrom(arrayOfTasks);
    });
    
    li.addEventListener("dblclick", function (e) {
      e.stopPropagation();
      openEditBoardModal(li);
    });
    
    boardList.appendChild(li);
  });

  let createBoardLi = document.createElement("li");
  createBoardLi.className = "create-board";
  createBoardLi.innerHTML = `<i class="fas fa-plus"></i> Create New Board`;
  createBoardLi.addEventListener("click", function () {
    let boardName = prompt("Enter board name:");
    if (boardName?.trim()) {
      addNewBoard(boardName.trim());
    } else {
      alert("Board name cannot be empty.");
    }
  });
  boardList.appendChild(createBoardLi);
}

function addNewBoard(boardName) {
  if (arrayOfBoards.some(board => board.title.toLowerCase() === boardName.toLowerCase())) {
    alert("Board with this name already exists.");
    return;
  }
  
  let newBoard = { id: Date.now(), title: boardName };
  arrayOfBoards.push(newBoard);
  localStorage.setItem("boards", JSON.stringify(arrayOfBoards));
  addBoardsToPageFrom(arrayOfBoards);
  document.querySelector(`#boardList li:not(.create-board):last-child`).click();
}

// Drag and drop functions
function dragStart(event) {
  event.dataTransfer.setData("text/plain", event.target.getAttribute("data-id"));
}

function touchStart(event) {
  if (event.target.closest(".del")) return;
  
  touchElement = event.target.closest(".task");
  touchStartTime = Date.now();
  isDragging = false;
}

function touchMove(event) {
  if (!touchElement || isDragging) return;
  
  const touchTime = Date.now() - touchStartTime;
  if (touchTime < 200) return;
  
  isDragging = true;
  event.preventDefault();
  let touch = event.touches[0];
  touchElement.style.position = "absolute";
  touchElement.style.left = `${touch.pageX - touchElement.offsetWidth / 2}px`;
  touchElement.style.top = `${touch.pageY - touchElement.offsetHeight / 2}px`;
}

function touchEnd(event) {
  if (!touchElement) return;

  if (!isDragging) {
    touchElement = null;
    return;
  }

  touchElement.classList.remove("dragging");
  touchElement.style.position = "";
  touchElement.style.left = "";
  touchElement.style.top = "";
  
  let touch = event.changedTouches[0];
  let dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
  let column = dropTarget ? dropTarget.closest(".column") : null;
  
  if (column) {
    let category = column.getAttribute("data-category");
    let taskId = touchElement.getAttribute("data-id");
    arrayOfTasks = arrayOfTasks.map((task) =>
      task.id == taskId ? { ...task, category } : task
    );
    addDataToLocalStorageFrom(arrayOfTasks);
    addElementsToPageFrom(arrayOfTasks);
  }
  
  touchElement = null;
  isDragging = false;
}

function dragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add("drag-over");
}

function dragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}

function drop(event, category) {
  event.preventDefault();
  event.currentTarget.classList.remove("drag-over");
  let taskId = event.dataTransfer.getData("text/plain");
  arrayOfTasks = arrayOfTasks.map((task) =>
    task.id == taskId ? { ...task, category } : task
  );
  addDataToLocalStorageFrom(arrayOfTasks);
  addElementsToPageFrom(arrayOfTasks);
}

function setupDragAndDrop() {
  let columns = document.querySelectorAll(".column");
  columns.forEach((column) => {
    column.addEventListener("dragover", dragOver);
    column.addEventListener("dragleave", dragLeave);
    column.addEventListener("drop", (event) => {
      let category = column.getAttribute("data-category");
      drop(event, category.toUpperCase());
    });
  });
}

// UI rendering
function addElementsToPageFrom(tasks) {
  let activeBoard = document.querySelector("#boardList li.active .board-title")?.textContent || "Platform Launch";
  document.querySelector(".todo").innerHTML = "<h3>🔵 TODO</h3>";
  document.querySelector(".doing").innerHTML = "<h3>🟣 DOING</h3>";
  document.querySelector(".done").innerHTML = "<h3>🟢 DONE</h3>";

  tasks
    .filter(task => task.board === activeBoard)
    .forEach((task) => {
      let div = document.createElement("div");
      div.className = `task ${task.category.toLowerCase()}`;
      div.setAttribute("data-id", task.id);
      div.setAttribute("draggable", "true");
      div.ondragstart = dragStart;
      div.addEventListener("touchstart", touchStart, { passive: false });
      div.addEventListener("touchmove", touchMove, { passive: false });
      div.addEventListener("touchend", touchEnd);

      let taskText = document.createElement("span");
      taskText.textContent = task.title;
      div.appendChild(taskText);

      let deleteBtn = document.createElement("button");
      deleteBtn.className = "del";
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteTaskWith(task.id);
        showToast(`Task "${task.title}" deleted!`);
      };
      deleteBtn.ontouchstart = (e) => {
        e.stopPropagation();
        deleteTaskWith(task.id);
        showToast(`Task "${task.title}" deleted!`);
      };
      div.appendChild(deleteBtn);

      let column = document.querySelector(`.${task.category.toLowerCase()}`);
      if (column) {
        column.appendChild(div);
      }
    });

  setupDragAndDrop();
}

function addDataToLocalStorageFrom(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Modals
function openEditBoardModal(boardElement) {
  currentEditBoard = boardElement;
  let currentName = boardElement.querySelector(".board-title").textContent;
  document.getElementById("editBoardInput").value = currentName;
  document.getElementById("editBoardModal").classList.remove("hidden");
}

// Event listeners
document.querySelector(".menu-toggle").addEventListener("click", function () {
  let activeBoard = document.querySelector("#boardList li.active");
  if (activeBoard) {
    openEditBoardModal(activeBoard);
  }
});

document.getElementById("saveEditedBoard").onclick = function () {
  let newName = document.getElementById("editBoardInput").value.trim();
  if (newName) {
    let oldName = currentEditBoard.querySelector(".board-title").textContent;
    currentEditBoard.querySelector(".board-title").textContent = newName;
    arrayOfBoards = arrayOfBoards.map(board =>
      board.title === oldName ? { ...board, title: newName } : board
    );
    arrayOfTasks = arrayOfTasks.map(task =>
      task.board === oldName ? { ...task, board: newName } : task
    );
    localStorage.setItem("boards", JSON.stringify(arrayOfBoards));
    addDataToLocalStorageFrom(arrayOfTasks);
    document.getElementById("boardHeader").textContent = newName;
    addElementsToPageFrom(arrayOfTasks);
    document.getElementById("editBoardModal").classList.add("hidden");
    showToast(`Board "${newName}" updated!`);
    currentEditBoard = null;
  } else {
    alert("Board name cannot be empty.");
  }
};

document.getElementById("deleteBoardButton").onclick = function () {
  if (confirm("Are you sure you want to delete this board?")) {
    let boardName = currentEditBoard.querySelector(".board-title").textContent;
    arrayOfBoards = arrayOfBoards.filter(
      (board) => board.title !== boardName
    );
    arrayOfTasks = arrayOfTasks.filter((task) => task.board !== boardName);
    localStorage.setItem("boards", JSON.stringify(arrayOfBoards));
    addDataToLocalStorageFrom(arrayOfTasks);
    currentEditBoard.remove();
    document.getElementById("editBoardModal").classList.add("hidden");
    showToast(`Board "${boardName}" deleted!`);
    currentEditBoard = null;
    let firstBoard = document.querySelector("#boardList li:not(.create-board)");
    if (firstBoard) {
      firstBoard.click();
    } else {
      document.getElementById("boardHeader").textContent = "No Boards";
      addElementsToPageFrom([]);
    }
  }
};

document.getElementById("closeEditBoardModal").onclick = function () {
  document.getElementById("editBoardModal").classList.add("hidden");
  currentEditBoard = null;
};

// Theme toggle
themeSwitch.addEventListener("change", () => {
  if (themeSwitch.checked) {
    enableLightMode();
  } else {
    enableDarkMode();
  }
});

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

// Toast notification
function showToast(message) {
  let toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "1";
  }, 100);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// Sidebar toggle
let hideSidebarButton = document.querySelector(".hide-sidebar");
let mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
let sidebar = document.querySelector(".sidebar");

function toggleSidebar() {
  sidebar.classList.toggle("hidden");
  sidebar.classList.toggle("open");
}

hideSidebarButton.onclick = toggleSidebar;
mobileMenuToggle.onclick = toggleSidebar;

// Initialize
window.onload = function () {
  loadFromLocalStorage();
  if (window.innerWidth <= 768) {
    sidebar.classList.add("hidden");
    sidebar.classList.remove("open");
  } else {
    sidebar.classList.remove("hidden");
    sidebar.classList.add("open");
  }
};

window.onresize = function () {
  if (window.innerWidth <= 768) {
    sidebar.classList.add("hidden");
    sidebar.classList.remove("open");
  } else {
    sidebar.classList.remove("hidden");
    sidebar.classList.add("open");
  }
};