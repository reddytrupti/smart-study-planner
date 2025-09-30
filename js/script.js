// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const taskForm = document.getElementById('taskForm');
const tasksContainer = document.getElementById('tasksContainer');
const emptyState = document.getElementById('emptyState');
const progressBar = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const totalTasks = document.getElementById('totalTasks');
const completedTasks = document.getElementById('completedTasks');
const pendingTasks = document.getElementById('pendingTasks');
const addAlarm = document.getElementById('addAlarm');
const alarmTime = document.getElementById('alarmTime');
const alarmsList = document.getElementById('alarmsList');

// New Features DOM Elements
const noteForm = document.getElementById('noteForm');
const notesContainer = document.getElementById('notesContainer');
const emptyNotesState = document.getElementById('emptyNotesState');
const addReminder = document.getElementById('addReminder');
const reminderTime = document.getElementById('reminderTime');
const reminderText = document.getElementById('reminderText');
const remindersList = document.getElementById('remindersList');
const emptyRemindersState = document.getElementById('emptyRemindersState');
const timerDisplay = document.getElementById('timerDisplay');
const startTimer = document.getElementById('startTimer');
const pauseTimer = document.getElementById('pauseTimer');
const resetTimer = document.getElementById('resetTimer');
const timerModeBtns = document.querySelectorAll('.timer-mode-btn');
const exportData = document.getElementById('exportData');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const totalStudyTime = document.getElementById('totalStudyTime');
const statsCompletedTasks = document.getElementById('statsCompletedTasks');
const productivityScore = document.getElementById('productivityScore');
const currentStreak = document.getElementById('currentStreak');

// Notification elements
const notification = document.getElementById('notification');
const notificationTitle = document.getElementById('notificationTitle');
const notificationMessage = document.getElementById('notificationMessage');
const notificationClose = document.getElementById('notificationClose');

// Audio context for buzzing sound
let audioContext;
let oscillator;
let isBuzzing = false;

// Initialize audio context
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.error('Web Audio API is not supported in this browser');
    }
}

// Create buzzing sound
function createBuzzingSound() {
    if (!audioContext) return;
    
    // Resume audio context if it's suspended
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Create a pulsating effect
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start();
    isBuzzing = true;
    
    // Stop after 2 seconds
    setTimeout(() => {
        if (oscillator) {
            oscillator.stop();
            isBuzzing = false;
        }
    }, 2000);
}

// Stop buzzing sound
function stopBuzzingSound() {
    if (oscillator && isBuzzing) {
        oscillator.stop();
        isBuzzing = false;
    }
}

// Show notification
function showNotification(title, message, playSound = true) {
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    notification.classList.add('active');
    
    if (playSound) {
        createBuzzingSound();
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

// Hide notification
function hideNotification() {
    notification.classList.remove('active');
    stopBuzzingSound();
}

// Close notification when close button is clicked
notificationClose.addEventListener('click', hideNotification);

// Theme Toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const icon = themeToggle.querySelector('i');
    const text = themeToggle.querySelector('span');
    
    if (document.body.classList.contains('dark-theme')) {
        icon.className = 'fas fa-sun';
        text.textContent = 'Light Mode';
    } else {
        icon.className = 'fas fa-moon';
        text.textContent = 'Dark Mode';
    }
    
    // Save theme preference to localStorage
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
});

// Load saved theme from localStorage
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    themeToggle.querySelector('i').className = 'fas fa-sun';
    themeToggle.querySelector('span').textContent = 'Light Mode';
}

// Tab Navigation
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
    });
});

// Task Management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let alarms = JSON.parse(localStorage.getItem('alarms')) || [];
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let reminders = JSON.parse(localStorage.getItem('reminders')) || [];
let studyStats = JSON.parse(localStorage.getItem('studyStats')) || {
    totalStudyTime: 0, // in minutes
    completedTasks: 0,
    productivityScore: 0,
    currentStreak: 0,
    lastStudyDate: null
};

// Pomodoro Timer Variables
let timerInterval;
let timerMode = 'pomodoro'; // pomodoro, shortBreak, longBreak
let timerSeconds = 25 * 60; // 25 minutes in seconds
let isTimerRunning = false;

// Timer Modes
const timerModes = {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
};

// Update timer display
function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Start timer
startTimer.addEventListener('click', () => {
    if (!isTimerRunning) {
        isTimerRunning = true;
        startTimer.disabled = true;
        pauseTimer.disabled = false;
        
        timerInterval = setInterval(() => {
            timerSeconds--;
            updateTimerDisplay();
            
            if (timerSeconds <= 0) {
                clearInterval(timerInterval);
                isTimerRunning = false;
                startTimer.disabled = false;
                pauseTimer.disabled = true;
                
                // Show notification with buzzing sound
                showNotification('Timer Complete!', `Your ${timerMode} timer has finished!`);
                
                // Update study stats if it was a pomodoro session
                if (timerMode === 'pomodoro') {
                    studyStats.totalStudyTime += 25;
                    updateStudyStats();
                    // Save to localStorage
                    localStorage.setItem('studyStats', JSON.stringify(studyStats));
                }
            }
        }, 1000);
    }
});

// Pause timer
pauseTimer.addEventListener('click', () => {
    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        startTimer.disabled = false;
        pauseTimer.disabled = true;
    }
});

// Reset timer
resetTimer.addEventListener('click', () => {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerSeconds = timerModes[timerMode];
    updateTimerDisplay();
    startTimer.disabled = false;
    pauseTimer.disabled = true;
});

// Timer mode buttons
timerModeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        timerModeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        timerMode = btn.dataset.mode;
        timerSeconds = timerModes[timerMode];
        updateTimerDisplay();
        
        // Reset timer if it's running
        if (isTimerRunning) {
            clearInterval(timerInterval);
            isTimerRunning = false;
            startTimer.disabled = false;
            pauseTimer.disabled = true;
        }
    });
});

// Update study statistics
function updateStudyStats() {
    // Calculate productivity score (completed tasks / total tasks * 100)
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Update streak
    const today = new Date().toDateString();
    const lastStudyDate = studyStats.lastStudyDate;
    
    if (lastStudyDate) {
        const lastDate = new Date(lastStudyDate);
        const diffTime = Math.abs(new Date() - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            studyStats.currentStreak++;
        } else if (diffDays > 1) {
            studyStats.currentStreak = 1;
        }
    } else {
        studyStats.currentStreak = 1;
    }
    
    studyStats.lastStudyDate = today;
    studyStats.completedTasks = completed;
    studyStats.productivityScore = productivity;
    
    // Update UI
    const hours = Math.floor(studyStats.totalStudyTime / 60);
    const minutes = studyStats.totalStudyTime % 60;
    totalStudyTime.textContent = `${hours}h ${minutes}m`;
    statsCompletedTasks.textContent = completed;
    productivityScore.textContent = `${productivity}%`;
    currentStreak.textContent = `${studyStats.currentStreak} days`;
    
    // Save to localStorage
    localStorage.setItem('studyStats', JSON.stringify(studyStats));
}

// Export data
exportData.addEventListener('click', () => {
    const data = {
        tasks: tasks,
        notes: notes,
        reminders: reminders,
        studyStats: studyStats,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-planner-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Data Exported', 'Your study data has been successfully exported!', false);
});

// Render tasks
function renderTasks() {
    if (tasks.length === 0) {
        emptyState.style.display = 'block';
        tasksContainer.innerHTML = '';
        tasksContainer.appendChild(emptyState);
    } else {
        emptyState.style.display = 'none';
        tasksContainer.innerHTML = '';
        
        tasks.forEach((task, index) => {
            const taskCard = document.createElement('div');
            taskCard.className = `task-card ${task.priority} ${task.completed ? 'completed' : ''}`;
            
            const dueDate = new Date(task.due);
            const now = new Date();
            const timeDiff = dueDate - now;
            const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            
            let dueText = '';
            if (daysDiff < 0) {
                dueText = `Overdue by ${Math.abs(daysDiff)} days`;
            } else if (daysDiff === 0) {
                dueText = 'Due today';
            } else if (daysDiff === 1) {
                dueText = 'Due tomorrow';
            } else {
                dueText = `Due in ${daysDiff} days`;
            }
            
            taskCard.innerHTML = `
                <div class="task-header">
                    <div>
                        <div class="task-title">${task.title}</div>
                        <div class="task-priority">${task.priority.toUpperCase()}</div>
                    </div>
                    <div class="task-actions">
                        <button class="btn ${task.completed ? 'btn-warning' : 'btn-success'}" onclick="app.toggleTask(${index})">
                            <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                            ${task.completed ? 'Reopen' : 'Complete'}
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteTask(${index})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="task-due">
                    <i class="fas fa-calendar-day"></i>
                    ${dueText} (${dueDate.toLocaleDateString()})
                </div>
                <div class="task-description">${task.description}</div>
                ${task.category ? `<div class="task-category"><i class="fas fa-tag"></i> ${task.category}</div>` : ''}
            `;
            
            tasksContainer.appendChild(taskCard);
        });
    }
    
    updateProgress();
    updateStudyStats();
}

// Add new task
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const due = document.getElementById('taskDue').value;
    const priority = document.getElementById('taskPriority').value;
    const category = document.getElementById('taskCategory').value;
    const reminder = document.getElementById('taskReminder').value;
    
    const newTask = {
        id: Date.now(),
        title,
        description,
        due,
        priority,
        category,
        reminder,
        completed: false
    };
    
    tasks.push(newTask);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
    
    // If reminder is set, schedule it
    if (reminder) {
        scheduleReminder(newTask);
    }
    
    // Show notification
    showNotification('Task Added', `"${title}" has been added to your study tasks!`, false);
    
    // Reset form
    taskForm.reset();
    document.getElementById('taskDue').value = '';
    document.getElementById('taskReminder').value = '';
});

// Toggle task completion
function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
    
    const action = tasks[index].completed ? 'completed' : 'reopened';
    showNotification('Task Updated', `Task "${tasks[index].title}" has been ${action}!`, false);
}

// Delete task
function deleteTask(index) {
    if (confirm('Are you sure you want to delete this task?')) {
        const taskTitle = tasks[index].title;
        tasks.splice(index, 1);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
        
        showNotification('Task Deleted', `Task "${taskTitle}" has been deleted.`, false);
    }
}

// Update progress
function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    progressBar.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    totalTasks.textContent = total;
    completedTasks.textContent = completed;
    pendingTasks.textContent = pending;
}

// Notes Management
function renderNotes() {
    if (notes.length === 0) {
        emptyNotesState.style.display = 'block';
        notesContainer.innerHTML = '';
        notesContainer.appendChild(emptyNotesState);
    } else {
        emptyNotesState.style.display = 'none';
        notesContainer.innerHTML = '';
        
        notes.forEach((note, index) => {
            const noteCard = document.createElement('div');
            noteCard.className = 'note-card';
            
            noteCard.innerHTML = `
                <div class="note-header">
                    <div class="note-title">${note.title}</div>
                    <div class="note-actions">
                        <button class="btn btn-danger" onclick="app.deleteNote(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="note-content">${note.content}</div>
                <div class="note-date">Created: ${new Date(note.created).toLocaleDateString()}</div>
            `;
            
            notesContainer.appendChild(noteCard);
        });
    }
}

// Add new note
noteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    
    const newNote = {
        id: Date.now(),
        title,
        content,
        created: new Date().toISOString()
    };
    
    notes.push(newNote);
    localStorage.setItem('notes', JSON.stringify(notes));
    renderNotes();
    
    // Show notification
    showNotification('Note Added', `"${title}" has been added to your notes!`, false);
    
    // Reset form
    noteForm.reset();
});

// Delete note
function deleteNote(index) {
    if (confirm('Are you sure you want to delete this note?')) {
        const noteTitle = notes[index].title;
        notes.splice(index, 1);
        localStorage.setItem('notes', JSON.stringify(notes));
        renderNotes();
        
        showNotification('Note Deleted', `Note "${noteTitle}" has been deleted.`, false);
    }
}

// Reminders Management
function renderReminders() {
    if (reminders.length === 0) {
        emptyRemindersState.style.display = 'block';
        remindersList.innerHTML = '';
        remindersList.appendChild(emptyRemindersState);
    } else {
        emptyRemindersState.style.display = 'none';
        remindersList.innerHTML = '';
        
        reminders.forEach((reminder, index) => {
            const reminderItem = document.createElement('div');
            reminderItem.className = 'reminder-item';
            
            const reminderDate = new Date(reminder.time);
            const now = new Date();
            const timeDiff = reminderDate - now;
            
            let statusText = '';
            if (timeDiff < 0) {
                statusText = 'Past due';
            } else if (timeDiff < 60000) { // Less than 1 minute
                statusText = 'Due now';
            } else if (timeDiff < 3600000) { // Less than 1 hour
                statusText = `Due in ${Math.ceil(timeDiff / 60000)} minutes`;
            } else if (timeDiff < 86400000) { // Less than 1 day
                statusText = `Due in ${Math.ceil(timeDiff / 3600000)} hours`;
            } else {
                statusText = `Due in ${Math.ceil(timeDiff / 86400000)} days`;
            }
            
            reminderItem.innerHTML = `
                <div class="reminder-content">
                    <div class="reminder-title">${reminder.text}</div>
                    <div class="reminder-time">${reminderDate.toLocaleString()} - ${statusText}</div>
                </div>
                <div class="alarm-actions">
                    <button class="btn btn-danger" onclick="app.deleteReminder(${index})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            
            remindersList.appendChild(reminderItem);
        });
    }
}

// Add new reminder
addReminder.addEventListener('click', () => {
    const time = reminderTime.value;
    const text = reminderText.value;
    
    if (!time || !text) {
        alert('Please fill in both time and text for the reminder');
        return;
    }
    
    const newReminder = {
        id: Date.now(),
        time,
        text,
        active: true
    };
    
    reminders.push(newReminder);
    localStorage.setItem('reminders', JSON.stringify(reminders));
    renderReminders();
    
    // Schedule the reminder
    scheduleReminder(newReminder);
    
    // Show notification
    showNotification('Reminder Set', `Reminder "${text}" has been scheduled!`, false);
    
    // Reset form
    reminderTime.value = '';
    reminderText.value = '';
});

// Delete reminder
function deleteReminder(index) {
    reminders.splice(index, 1);
    localStorage.setItem('reminders', JSON.stringify(reminders));
    renderReminders();
    
    showNotification('Reminder Deleted', 'The reminder has been deleted.', false);
}

// Schedule reminder
function scheduleReminder(reminder) {
    const reminderTime = new Date(reminder.time);
    const now = new Date();
    const timeUntilReminder = reminderTime - now;
    
    // Only schedule if the reminder is in the future
    if (timeUntilReminder > 0) {
        setTimeout(() => {
            // Show notification with buzzing sound
            showNotification('Study Reminder!', reminder.text || 'Time to focus on your studies!');
        }, timeUntilReminder);
    }
}

// Alarm Management
function renderAlarms() {
    alarmsList.innerHTML = '';
    
    if (alarms.length === 0) {
        alarmsList.innerHTML = '<div class="empty-state"><i class="fas fa-bell-slash"></i><p>No alarms set</p></div>';
        return;
    }
    
    alarms.forEach((alarm, index) => {
        const alarmItem = document.createElement('div');
        alarmItem.className = 'alarm-item';
        
        alarmItem.innerHTML = `
            <div class="alarm-time">${alarm.time}</div>
            <div class="alarm-actions">
                <button class="btn btn-danger" onclick="app.deleteAlarm(${index})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        
        alarmsList.appendChild(alarmItem);
    });
}

// Add new alarm
addAlarm.addEventListener('click', () => {
    const time = alarmTime.value;
    
    if (!time) {
        alert('Please select a time for the alarm');
        return;
    }
    
    alarms.push({ time, active: true });
    localStorage.setItem('alarms', JSON.stringify(alarms));
    renderAlarms();
    
    // Set up the alarm notification
    scheduleAlarm(time);
    
    // Show notification
    showNotification('Alarm Set', `Alarm has been set for ${time}!`, false);
    
    alarmTime.value = '';
});

// Delete alarm
function deleteAlarm(index) {
    alarms.splice(index, 1);
    localStorage.setItem('alarms', JSON.stringify(alarms));
    renderAlarms();
    
    showNotification('Alarm Deleted', 'The alarm has been deleted.', false);
}

// Schedule alarm notification
function scheduleAlarm(time) {
    const now = new Date();
    const [hours, minutes] = time.split(':');
    const alarmTime = new Date();
    alarmTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // If the alarm time has already passed today, schedule for tomorrow
    if (alarmTime <= now) {
        alarmTime.setDate(alarmTime.getDate() + 1);
    }
    
    const timeUntilAlarm = alarmTime - now;
    
    setTimeout(() => {
        // Show notification with buzzing sound
        showNotification('Study Time!', 'Time to focus on your studies!');
        
        // Reschedule for the next day
        scheduleAlarm(time);
    }, timeUntilAlarm);
}

// Initialize the app
function initApp() {
    initAudio(); // Initialize audio context
    renderTasks();
    renderNotes();
    renderReminders();
    renderAlarms();
    updateStudyStats();
    updateTimerDisplay();

    // Schedule existing alarms and reminders
    alarms.forEach(alarm => {
        if (alarm.active) {
            scheduleAlarm(alarm.time);
        }
    });

    reminders.forEach(reminder => {
        if (reminder.active) {
            scheduleReminder(reminder);
        }
    });

    // Schedule task reminders
    tasks.forEach(task => {
        if (task.reminder) {
            scheduleReminder({
                time: task.reminder,
                text: `Reminder: ${task.title}`
            });
        }
    });
}

// Make functions globally accessible
window.app = {
    toggleTask,
    deleteTask,
    deleteNote,
    deleteReminder,
    deleteAlarm
};

// Initialize the app when the page loads
window.addEventListener('load', initApp);