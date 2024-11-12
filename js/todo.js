document.addEventListener('DOMContentLoaded', function() {
    const todoListItems = document.getElementById('todo-list-items');
    const newTaskInput = document.getElementById('new-task-input');
    const addTaskButton = document.getElementById('add-task-button');
    const confirmTaskButton = document.getElementById('confirm-task-button');
    const closeModalButton = document.querySelector('.close-modal');
    const taskModal = document.getElementById('task-modal');
    let draggedItem = null;

    addTaskButton.addEventListener('click', function() {
        taskModal.style.display = 'flex';
    });

    confirmTaskButton.addEventListener('click', function() {
        const taskText = newTaskInput.value.trim();
        if (taskText !== '') {
            addTask(taskText);
            newTaskInput.value = '';
            taskModal.style.display = 'none';
        }
    });

    closeModalButton.addEventListener('click', function() {
        taskModal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target === taskModal) {
            taskModal.style.display = 'none';
        }
    });

    newTaskInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            confirmTaskButton.click();
        }
    });

    function loadTasks() {
        chrome.storage.local.get('tasks', function(result) {
            const tasks = result.tasks || [];
            todoListItems.innerHTML = '';
            tasks.forEach(task => {
                const taskElement = createTaskElement(task);
                todoListItems.appendChild(taskElement);
            });
        });
    }

    function saveTasks() {
        const tasks = [...document.querySelectorAll('.todo-item')]
            .map(item => ({ text: item.querySelector('.task-text').textContent, done: item.classList.contains('done') }));
        chrome.storage.local.set({ tasks: tasks });
    }

    function addTask(text) {
        const task = { text: text, done: false };
        const taskElement = createTaskElement(task);
        todoListItems.appendChild(taskElement);
        saveTasks();
    }

    function createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.classList.add('todo-item');
        if (task.done) taskItem.classList.add('done');

        taskItem.innerHTML = `
            <input type="checkbox" class="checkbox" ${task.done ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            <span class="remove-task">⛔</span>
        `;

        taskItem.draggable = true;

        taskItem.querySelector('.checkbox').addEventListener('click', function() {
            taskItem.classList.toggle('done');
            saveTasks();
        });

        taskItem.querySelector('.remove-task').addEventListener('click', function() {
            taskItem.remove();
            saveTasks();
        });

        taskItem.addEventListener('dragstart', function() {
            draggedItem = taskItem;
            taskItem.classList.add('dragging');
            document.body.style.cursor = 'pointer';
        });

        taskItem.addEventListener('dragend', function() {
            taskItem.classList.remove('dragging');
            document.body.style.cursor = '';
            saveTasks();
        });

        todoListItems.addEventListener('dragover', function(event) {
            event.preventDefault();
            const afterElement = getDragAfterElement(todoListItems, event.clientY);
            const dragging = document.querySelector('.dragging');
            if (afterElement == null) {
                todoListItems.appendChild(dragging);
            } else {
                todoListItems.insertBefore(dragging, afterElement);
            }
        });

        return taskItem;
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.todo-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    loadTasks();
});
