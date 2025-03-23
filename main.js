// Select elements
let input = document.querySelector(".input");
let submit = document.querySelector(".add-task");
let tasksDiv = document.querySelector(".kanban-board");
let themeSwitch = document.getElementById("theme-switch");
let body = document.body;

// Global variables to track the column and board being edited
let currentEditColumn = null;
let currentEditBoard = null;

// Array to store tasks
let arrayOfTasks = [];

// Check for saved tasks in Local Storage
if (localStorage.getItem("tasks")) {
  arrayOfTasks = JSON.parse(localStorage.getItem("tasks"));
  addElementsToPageFrom(arrayOfTasks);
}

// Check for saved theme mode
if (localStorage.getItem("theme") === "light") {
  enableLightMode();
}

// Function to clear modal fields (for tasks)
function clearModalFields() {
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDescription").value = "";
  document.getElementById("taskStatus").value = "TODO";
}

// Add Task Button Click
let addTaskButton = document.querySelector(".add-task");
let taskModal = document.getElementById("taskModal");

addTaskButton.onclick = function () {
  clearModalFields();
  taskModal.classList.remove("hidden");
};

// Close Task Modal Button
let closeModalButton = document.getElementById("closeModal");
closeModalButton.onclick = function () {
  clearModalFields();
  taskModal.classList.add("hidden");
};

// Save Task Button
let saveTaskButton = document.getElementById("saveTask");
saveTaskButton.onclick = function () {
  let taskTitle = document.getElementById("taskTitle").value;
  let taskDescription = document.getElementById("taskDescription").value;
  let taskStatus = document.getElementById("taskStatus").value;

  if (taskTitle && taskStatus) {
    addTaskToArray(taskTitle, taskStatus, taskDescription);
    clearModalFields();
    taskModal.classList.add("hidden");
  } else {
    alert("Please fill in all fields.");
  }
};

// Open Edit Task Modal when task is clicked
tasksDiv.addEventListener("click", (e) => {
  if (
    e.target.classList.contains("task") ||
    e.target.parentElement.classList.contains("task")
  ) {
    let taskElement = e.target.classList.contains("task")
      ? e.target
      : e.target.parentElement;
    let taskId = taskElement.getAttribute("data-id");
    let task = arrayOfTasks.find((task) => task.id == taskId);

    if (task) {
      document.getElementById("editTaskTitle").value = task.title;
      document.getElementById("editTaskDescription").value = task.description;
      document.getElementById("editTaskStatus").value = task.category;
      document
        .querySelector("#editTaskModal .modal-content")
        .setAttribute("data-id", taskId);
      document.getElementById("editTaskModal").classList.remove("hidden");
    }
  }
});

// Save Edited Task
let saveEditedTaskButton = document.getElementById("saveEditedTask");
saveEditedTaskButton.onclick = function () {
  let taskId = document
    .querySelector("#editTaskModal .modal-content")
    .getAttribute("data-id");
  let taskTitle = document.getElementById("editTaskTitle").value;
  let taskDescription = document.getElementById("editTaskDescription").value;
  let taskStatus = document.getElementById("editTaskStatus").value;

  if (taskTitle && taskStatus) {
    arrayOfTasks = arrayOfTasks.map((task) =>
      task.id == taskId
        ? { ...task, title: taskTitle, description: taskDescription, category: taskStatus }
        : task
    );
    addDataToLocalStorageFrom(arrayOfTasks);
    addElementsToPageFrom(arrayOfTasks);
    document.getElementById("editTaskModal").classList.add("hidden");
  } else {
    alert("Please fill in all fields.");
  }
};

// Delete Task from Edit Modal
let deleteTaskButton = document.getElementById("deleteTask");
deleteTaskButton.onclick = function () {
  let taskId = document
    .querySelector("#editTaskModal .modal-content")
    .getAttribute("data-id");
  deleteTaskWith(taskId);
  document.getElementById("editTaskModal").classList.add("hidden");
};

// Close Edit Task Modal
let closeEditModalButton = document.getElementById("closeEditModal");
closeEditModalButton.onclick = function () {
  document.getElementById("editTaskModal").classList.add("hidden");
};

// Add task to array & update page
function addTaskToArray(title, category, description = "") {
  // Get the currently active board
  let activeBoard = document.querySelector("#boardList li.active .board-title").textContent;
  const task = { id: Date.now(), title, category, description, board: activeBoard };
  arrayOfTasks.push(task);
  addElementsToPageFrom(arrayOfTasks);
  addDataToLocalStorageFrom(arrayOfTasks);
}

// Render tasks and update columns
function addElementsToPageFrom(tasks) {
  // Determine active board
  let activeBoard = document.querySelector("#boardList li.active .board-title").textContent;
  
  // Reset default columns (assumed to exist in your HTML)
  document.querySelector(".todo").innerHTML = "<h3>🔵 TODO</h3>";
  document.querySelector(".doing").innerHTML = "<h3>🟣 DOING</h3>";
  document.querySelector(".done").innerHTML = "<h3>🟢 DONE</h3>";

  // Render tasks only for the active board
  tasks
    .filter(task => task.board === activeBoard)
    .forEach((task) => {
      let div = document.createElement("div");
      div.className = "task";
      div.setAttribute("data-id", task.id);
      div.setAttribute("draggable", "true");
      div.ondragstart = dragStart;

      let taskText = document.createElement("span");
      taskText.textContent = task.title;
      div.appendChild(taskText);

      // Append task to the matching column
      let column = document.querySelector(`.${task.category.toLowerCase()}`);
      if (column) {
        column.appendChild(div);
      }
    });
    
  setupDragAndDrop();
}

// Update Local Storage
function addDataToLocalStorageFrom(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Delete Task
function deleteTaskWith(taskId) {
  arrayOfTasks = arrayOfTasks.filter((task) => task.id != taskId);
  addDataToLocalStorageFrom(arrayOfTasks);
  addElementsToPageFrom(arrayOfTasks);
}

// Drag & Drop Functions for tasks
function dragStart(event) {
  event.dataTransfer.setData("text/plain", event.target.getAttribute("data-id"));
}
function dragOver(event) {
  event.preventDefault();
}
function drop(event, category) {
  event.preventDefault();
  let taskId = event.dataTransfer.getData("text/plain");

  arrayOfTasks = arrayOfTasks.map((task) =>
    task.id == taskId ? { ...task, category } : task
  );

  addDataToLocalStorageFrom(arrayOfTasks);
  addElementsToPageFrom(arrayOfTasks);
}
// Setup Drag & Drop for all columns
function setupDragAndDrop() {
  let columns = document.querySelectorAll(".column");
  columns.forEach((column) => {
    column.addEventListener("dragover", dragOver);
    column.addEventListener("drop", (event) => {
      let category = column.getAttribute("data-category") || column.classList[1];
      drop(event, category.toUpperCase());
    });
  });
}

// Toggle Sidebar Visibility
let hideSidebarButton = document.querySelector(".hide-sidebar");
let showSidebarButton = document.getElementById("showSidebar");
hideSidebarButton.onclick = function () {
  let sidebar = document.querySelector(".sidebar");
  sidebar.classList.add("hidden");
  showSidebarButton.classList.remove("hidden");
};
showSidebarButton.onclick = function () {
  let sidebar = document.querySelector(".sidebar");
  sidebar.classList.remove("hidden");
  showSidebarButton.classList.add("hidden");
};

// Board Creation and Edit Modal

// When clicking the "Create New Board" list item, prompt for a board name
document.querySelector(".create-board").addEventListener("click", function () {
  let boardName = prompt("Enter board name:");
  if (boardName) {
    addNewBoard(boardName);
  }
});

// Function to add a new board as a list item
function addNewBoard(boardName) {
  let newBoard = document.createElement("li");
  newBoard.classList.add("custom-board");
  newBoard.innerHTML = `<img src="assets/icon-board.svg" alt="Board"> <span class="board-title">${boardName}</span>`;
  // Add event listener to open board edit modal when clicked
  newBoard.addEventListener("click", function () {
    // Remove active class from all board items
    document.querySelectorAll("#boardList li:not(.create-board)").forEach(li => li.classList.remove("active"));
    // Mark this board as active
    newBoard.classList.add("active");
    // Update header
    document.getElementById("boardHeader").textContent = boardName;
    // Render tasks for the active board
    addElementsToPageFrom(arrayOfTasks);
  });
  document.querySelector("#boardList").insertBefore(newBoard, document.querySelector(".create-board"));
  
  // Optionally, automatically switch to the new board:
  newBoard.click();
}

// Setup board switching for default boards
function setupBoardSwitching() {
  const boardItems = document.querySelectorAll("#boardList li:not(.create-board)");
  boardItems.forEach(item => {
    item.addEventListener("click", function () {
      // Remove active class from all board items
      boardItems.forEach(i => i.classList.remove("active"));
      // Mark the clicked board as active
      this.classList.add("active");
      
      // Update the header with the selected board title
      const boardTitle = this.querySelector(".board-title").textContent;
      document.getElementById("boardHeader").textContent = boardTitle;
      
      // Render tasks for the active board
      addElementsToPageFrom(arrayOfTasks);
    });
  });
}

// Initialize board switching for default boards
setupBoardSwitching();

// Board Edit Modal - Open when board is double-clicked
function openEditBoardModal(boardElement) {
  currentEditBoard = boardElement;
  let currentName = boardElement.querySelector(".board-title").textContent;
  document.getElementById("editBoardInput").value = currentName;
  document.getElementById("editBoardModal").classList.remove("hidden");
}

// Add event listener for board edit modal on default boards (double-click)
document.querySelectorAll("#boardList li:not(.create-board)").forEach(board => {
  board.addEventListener("dblclick", function (e) {
    e.stopPropagation();
    openEditBoardModal(board);
  });
});

// NEW: Menu toggle now opens the edit/delete board modal for the active board
document.querySelector('.menu-toggle').addEventListener('click', function() {
  let activeBoard = document.querySelector('#boardList li.active');
  if (activeBoard) {
    openEditBoardModal(activeBoard);
  }
});

// Event listener for saving edited board changes via the modal
document.getElementById("saveEditedBoard").onclick = function () {
  let newName = document.getElementById("editBoardInput").value.trim();
  if (newName) {
    currentEditBoard.querySelector(".board-title").textContent = newName;
    document.getElementById("editBoardModal").classList.add("hidden");
    currentEditBoard = null;
  } else {
    alert("Board name cannot be empty.");
  }
};

// Event listener for deleting the board via the modal
document.getElementById("deleteBoardButton").onclick = function () {
  if (confirm("Are you sure you want to delete this board?")) {
    currentEditBoard.remove();
    document.getElementById("editBoardModal").classList.add("hidden");
    currentEditBoard = null;
  }
};

// Event listener for closing the edit board modal
document.getElementById("closeEditBoardModal").onclick = function () {
  document.getElementById("editBoardModal").classList.add("hidden");
  currentEditBoard = null;
};

// Sidebar toggle (menu button)
let sidebar = document.querySelector(".sidebar");
let toggleButton = document.querySelector(".menu-toggle");
if (toggleButton) {
  toggleButton.addEventListener("click", function () {
    sidebar.classList.toggle("open");
  });
}

// Theme Toggle Functions
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
window.onload = function () {
  if (localStorage.getItem("theme") === "light") {
    enableLightMode();
  } else {
    enableDarkMode();
  }
};