const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const calendarContainer = document.getElementById("year-calendar");
const yearTitle = document.getElementById("year-title");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

let currentYear = new Date().getFullYear();

function renderYearCalendar(year) {
  calendarContainer.innerHTML = "";
  yearTitle.textContent = year;

  for (let month = 0; month < 12; month++) {
    const monthDiv = document.createElement("div");
    monthDiv.className = "month";

    const startDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    const today = new Date();
    const isCurrentYear = year === today.getFullYear();
    const isCurrentMonth = month === today.getMonth();

    if (isCurrentYear && isCurrentMonth) {
      monthDiv.id = "current-month";
    }


    let html = `<h3>${months[month]}</h3>
          <div class="days">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div>
            <div>Thu</div><div>Fri</div><div>Sat</div>
          </div>
          <ul class="dates">`;

    for (let i = startDay; i > 0; i--) {
      html += `<li class="inactive"> </li>`;
    }

    for (let d = 1; d <= totalDays; d++) {
      let isToday =
        isCurrentYear && isCurrentMonth && d === today.getDate();
      html += `<li class="${isToday ? "today" : ""}">${d}</li>`;
    }

    html += `</ul>`;
    monthDiv.innerHTML = html;
    calendarContainer.appendChild(monthDiv);

    const dateItems = monthDiv.querySelectorAll("li:not(.inactive)");
    dateItems.forEach((item) => {
      item.addEventListener("click", () => {
        document.querySelectorAll(".selected-date").forEach(el => {
          el.classList.remove("selected-date");
        });

        item.classList.add("selected-date");


        const monthStr = months[month];
        const fullDate = `${monthStr} ${year}`;

        const dayNumber = parseInt(item.textContent);

        const selectedDate = new Date(year, month, dayNumber);

        dayNumber.classlis

        openBtn.textContent = fullDate;
        openBtn.style.color = "";
        modal.style.display = "none";

        renderWeeklyView(selectedDate);
      });
    });
  }
}

prevBtn.addEventListener("click", () => {
  currentYear--;
  renderYearCalendar(currentYear);
});

nextBtn.addEventListener("click", () => {
  currentYear++;
  renderYearCalendar(currentYear);
});


const modal = document.getElementById("calendarModal");
const openBtn = document.getElementById("openCalendarBtn");
const closeBtn = document.getElementById("year-title");


let clickTimer = null;

openBtn.addEventListener("click", () => {
  clickTimer = setTimeout(() => {
    const today = new Date();
    const monthStr = months[today.getMonth()];
    const year = today.getFullYear();
    openBtn.textContent = `${monthStr} ${year}`;

    renderWeeklyView(today, today);
  }, 250);
});

openBtn.addEventListener("dblclick", () => {
  clearTimeout(clickTimer);
  modal.style.display = "block";
  renderYearCalendar(currentYear);

  setTimeout(() => {
    const currentMonthEl = document.getElementById("current-month");
    if (currentMonthEl) {
      currentMonthEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, 100);
});




closeBtn.onclick = function () {
  modal.style.display = "none";
};

window.onclick = function (event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};


renderYearCalendar(currentYear);

//weekdays
const weekContainer = document.getElementById("weekly-view");
const rootStyles = getComputedStyle(document.documentElement);
const primaryFont = rootStyles.getPropertyValue("--primary-font").trim();

function renderWeeklyView(baseDate = new Date(), highlightDate = null) {
  const today = baseDate;
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const currentDate = new Date();

  // --- Month & Year Header ---
  const monthWithYear = document.getElementById("openCalendarBtn");
  const monthName = months[today.getMonth()];
  const year = today.getFullYear();
  monthWithYear.textContent = `${monthName} ${year}`;
  monthWithYear.style.color =
    currentDate.getMonth() !== today.getMonth() ||
      currentDate.getFullYear() !== today.getFullYear()
      ? "#5167f4"
      : "";
  monthWithYear.style.cursor = "pointer";

  // Reset container
  weekContainer.innerHTML = "";

  const firstRow = document.createElement("div");
  firstRow.className = "week-grid-row";

  const satSunColumn = document.createElement("div");
  satSunColumn.style.display = "flex";
  satSunColumn.style.flexDirection = "column";
  satSunColumn.style.gap = "40px";

  const monday = new Date(today);
  const dayOfWeek = monday.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

  // Calculate the difference to get to the previous Monday
  // If today is Sunday (0), we subtract 6 days. Otherwise, we subtract (dayOfWeek - 1) days.
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(today.getDate() + diff);

  // Set time to the beginning of the day to avoid timezone issues
  monday.setHours(0, 0, 0, 0);

  // --- Helpers ---
  function createInput(styles = {}) {
    const input = document.createElement("input");
    input.type = "text";
    Object.assign(input.style, {
      border: "rgba(255,255,255,0.95)",
      fontSize: "14px",
      borderRadius: "6px",
      backgroundColor: "white",
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      outline: "none",
      height: "100%",
      marginTop: "0",
      boxSizing: "border-box",
      width: "100%",
      ...styles,
    });
    return input;
  }

  function styleTaskSpan(span, color) {
    span.style.whiteSpace = "nowrap";
    span.style.overflow = "hidden";
    span.style.textOverflow = "ellipsis";
    span.style.height = "18px";
    span.style.textAlign = "left";
    if (color) {
      span.style.backgroundColor = color;
      span.style.color = "#fff";
    }
  }

  function createCheckBtn(span, task) {
    const btn = document.createElement("img");
    btn.src = "./assets/icons/check-button.png";
    btn.className = "check-btn";
    btn.title = "Mark as done / undone";
    Object.assign(btn.style, {
      width: "18px",
      height: "18px",
      marginLeft: "8px",
      cursor: "pointer",
      verticalAlign: "middle",
    });

    btn.addEventListener("click", async (e) => {
      e.stopPropagation();

      // This is safe because when you CLICK, the parent will always exist
      const parentTaskBox = span.parentElement;
      if (parentTaskBox) {
        parentTaskBox.classList.toggle("completed");
        const isCompleted = parentTaskBox.classList.contains("completed");

        // Save the updated status to the database
        const taskDate = new Date(task.date);
        const taskText = span.textContent.trim();
        const taskId = task._id;

        await saveTask(parentTaskBox, taskText, task.color, taskDate, taskId, isCompleted);
      }
    });
    return btn;
  }


  function balanceColumnHeights() {
    const allDayBoxes = [...document.querySelectorAll(".day-box")];
    const mainBoxes = allDayBoxes.slice(0, 5); // Mon-Fri
    const saturdayBox = allDayBoxes[5];
    const sundayBox = allDayBoxes[6];

    // Safety check to ensure all elements are found
    if (mainBoxes.length < 5 || !saturdayBox || !sundayBox) {
      console.error("Aborting balance: Not all day boxes were found on the page.");
      return;
    }

    let maxRows = 0;

    // 1. Find the tallest column among Mon-Fri
    mainBoxes.forEach(box => {
      const taskCount = box.querySelector('.todo-list').children.length;
      if (taskCount > maxRows) maxRows = taskCount;
    });

    // 2. Equalize Mon-Fri heights by adding empty rows
    mainBoxes.forEach(box => {
      const todoList = box.querySelector('.todo-list');
      while (todoList.children.length < maxRows) {
        const emptyTaskBox = document.createElement("li");
        emptyTaskBox.style.height = "40px";
        emptyTaskBox.style.borderBottom = "1px solid #e0e0e0";
        todoList.appendChild(emptyTaskBox);
      }
    });

    // --- REVISED LOGIC FOR WEEKEND ---

    // 3. Measure the final, actual height of a now-balanced weekday column
    const targetHeight = mainBoxes[0].offsetHeight;

    // 4. Calculate the total height available for the Sunday box
    const gapBetweenWeekend = 40; // This MUST match the 'gap' style on your satSunColumn
    const availableHeightForSunday = targetHeight - saturdayBox.offsetHeight - gapBetweenWeekend;

    // 5. Calculate the space available for just the task list (<ul>) inside the Sunday box
    const sundayHeader = sundayBox.querySelector('div:first-child');
    if (!sundayHeader) return; // Safety check

    const availableHeightForSundayRows = availableHeightForSunday - sundayHeader.offsetHeight;

    // 6. Calculate how many 40px rows can fit in that available space
    const rowHeight = 40;
    // Use Math.max(0, ...) to ensure we don't get a negative number if space is tight
    const numRowsForSunday = Math.max(0, Math.floor(availableHeightForSundayRows / rowHeight));

    // 7. Add the required number of rows to Sunday's list to fill the space
    const sundayTodoList = sundayBox.querySelector('.todo-list');
    // First, remove any extra empty rows that might exist from a previous render
    while (sundayTodoList.children.length > numRowsForSunday) {
      if (!sundayTodoList.lastChild.textContent.trim()) { // Only remove empty rows
        sundayTodoList.removeChild(sundayTodoList.lastChild);
      } else {
        break; // Stop if we hit a row with a task
      }
    }
    // Then, add rows until the count is correct
    while (sundayTodoList.children.length < numRowsForSunday) {
      const emptyTaskBox = document.createElement("li");
      emptyTaskBox.style.height = "40px";
      emptyTaskBox.style.borderBottom = "1px solid #e0e0e0";
      sundayTodoList.appendChild(emptyTaskBox);
    }
  }


  // use this for loadTasksFromDB
  function renderTaskElement(box, task) {
    box.innerHTML = "";
    box.dataset.id = task._id || "";

    const span = document.createElement("span");
    span.className = "task-text";
    span.textContent = task.title || task.text || ""; // FIX ✅
    styleTaskSpan(span, task.color || null);

    const checkBtn = createCheckBtn(span, task);

    box.append(span, checkBtn);
    if (task.completed) {
      box.classList.add("completed");
    }

    span.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditModal(
        task.title,
        (newText, newColor, newNotes, newDate) => {
          handleTaskSave(box, newText, newColor, newNotes, newDate);
        },
        box,
        task.color,
        new Date(task.date)
      );
    });

    Object.assign(box.style, {
      height: "40px",
      display: "flex",
      borderBottom: "1px solid #e0e0e0",
      justifyContent: "space-between",
      alignItems: "center",
      fontWeight: "400"
    });

    box.title = task.title || task.text || ""; // FIX ✅
  }



  async function saveTask(box, text, color = null, taskDate, taskId = null, isCompleted = false, isSomeday = false) {

    const jsDate = taskDate instanceof Date ? taskDate : new Date(taskDate);
    if (Number.isNaN(jsDate.getTime())) {
      console.warn("saveTask called without valid date", { text, taskId, taskDate });
      return;
    }

    // Prepare payload
    const payload = {
      title: text,
      description: "",
      color,
      completed: isCompleted,
      isSomeday
    };

    if (!isSomeday) {
      payload.date = jsDate.toISOString();  // only attach date for normal tasks
    }

    // New task
    if (!taskId) {
      const res = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        console.error("Failed to save task", await res.text());
        return;
      }

      const newTask = await res.json();
      box.dataset.id = newTask._id;
      // render the new task in DOM (call render helper for consistent UI)
      renderTaskElement(box, newTask);
      return newTask;
    }

    // Update existing task
    const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });


    if (!res.ok) {
      console.error("Failed to update task", await res.text());
      return;
    }

    const updated = await res.json();
    box.dataset.id = updated._id;
    renderTaskElement(box, updated);
    return updated;
  }



  function activateInput(box, taskDate) {
    const input = createInput();
    box.textContent = "";
    box.appendChild(input);
    input.focus();

    const save = () => {
      if (input.value.trim()) {
        if (taskDate) {
          saveTask(box, input.value.trim(), null, taskDate);
        } else {
          saveTask(box, input.value.trim(), null, null, null, false, true);
        }
      } else {
        box.textContent = "";
      }
    };


    input.addEventListener("blur", () => setTimeout(save, 0));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        save();
        input.blur();
      }
    });
  }


  // --- Weekly Days ---
  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + offset);

    const dayBox = document.createElement("div");
    dayBox.className = "day-box";

    dayBox.dataset.dateColumn = date.toISOString().split('T')[0];

    Object.assign(dayBox.style, {
      padding: "0 10px",
      borderRadius: "8px",
      display: "flex",
      flexDirection: "column",
      minHeight: "210px",
      minWidth: "150px",
      flexGrow: "1",
      cursor: "pointer",
    });

    const headerDiv = document.createElement("div");
    Object.assign(headerDiv.style, {
      display: "flex",
      justifyContent: "space-between",
      borderBottom: "2px solid black",
      paddingBottom: "7px",
    });
    const todoContainer = document.createElement("ul");
    applyHeaderStyle();

    function applyHeaderStyle() {
      if (window.innerWidth < 1024) {
        Object.assign(headerDiv.style, {
          width: "100%"
        });
        Object.assign(todoContainer.style, {
          width: "100%"
        })
      } else {
        Object.assign(headerDiv.style, {
          width: "105%"
        });
        Object.assign(todoContainer.style, {
          width: "105%"
        })
      }
    }

    const dayNumber = date.getDate().toString().padStart(2, "0");
    const monthNumber = (date.getMonth() + 1).toString().padStart(2, "0");

    const dateDiv = document.createElement("div");
    dateDiv.style.fontWeight = "bold";
    dateDiv.textContent = `${dayNumber}.${monthNumber}`;

    const weekdayDiv = document.createElement("div");
    weekdayDiv.textContent = weekdays[offset];
    weekdayDiv.style.color = "#000";
    weekdayDiv.style.textTransform = "capitalize";
    weekdayDiv.style.opacity = ".2";
    weekdayDiv.style.fontFamily = primaryFont;
    weekdayDiv.style.fontWeight = "400";

    headerDiv.append(dateDiv, weekdayDiv);

    // const todoContainer = document.createElement("ul");
    todoContainer.className = "todo-list";
    Object.assign(todoContainer.style, {
      margin: "0",
      paddingLeft: "1px",
      flexGrow: "1",
      listStyle: "none",
      fontSize: "16px",
    });

    const limit = offset < 5 ? 12 : 5;
    for (let i = 0; i < limit; i++) {
      const taskBox = document.createElement("li");
      taskBox.style.height = "40px";
      todoContainer.appendChild(taskBox);
    }

    // highlight today / selected
    const isToday =
      date.getDate() === currentDate.getDate() &&
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear();

    const isSelected =
      highlightDate &&
      date.getDate() === highlightDate.getDate() &&
      date.getMonth() === highlightDate.getMonth() &&
      date.getFullYear() === highlightDate.getFullYear();

    if (isSelected) {
      dateDiv.style.color = "#5167f4";
      weekdayDiv.style.color = "#5167f4";
    } else if (isToday) {
      dateDiv.style.color = "#5167f4";
      weekdayDiv.style.color = "#5167f4";
    }

    dayBox.append(headerDiv, todoContainer);

    dayBox.addEventListener("click", () => {
      const emptyBox = [...todoContainer.children].find(
        (box) => !box.textContent.trim() && !box.querySelector("input")
      );

      let newRowWasAdded = false;

      if (emptyBox) {
        activateInput(emptyBox, date);
      } else {
        const newBox = document.createElement("li");
        newBox.style.height = "40px";
        todoContainer.appendChild(newBox);
        activateInput(newBox, date);
        newRowWasAdded = true;
      }

      // All day boxes
      const allDayBoxes = [...weekContainer.querySelectorAll(".day-box")];
      const saturdayBox = allDayBoxes[5];
      const rowHeight = 40;

      if (newRowWasAdded) {
        if (offset === 5) {
          const totalRows = saturdayBox.querySelectorAll(".todo-list li").length;
          saturdayBox.style.maxHeight = `${totalRows * rowHeight}px`;

          allDayBoxes.forEach((otherBox, idx) => {
            if (idx !== 5 && idx !== 6) {
              const otherTodoContainer = otherBox.querySelector(".todo-list");
              const newBox = document.createElement("li");
              newBox.style.height = `${rowHeight}`;
              otherTodoContainer.appendChild(newBox);
            }
          });
        } else {
          const totalRows = saturdayBox.querySelectorAll(".todo-list li").length;
          saturdayBox.style.maxHeight = `${totalRows * rowHeight}px`;

          allDayBoxes.forEach((otherBox, idx) => {
            if (idx !== offset && idx !== 5) {
              const otherTodoContainer = otherBox.querySelector(".todo-list");
              const newBox = document.createElement("li");
              newBox.style.height = `${rowHeight}px`;
              otherTodoContainer.appendChild(newBox);
            }
          });
        }
      }
    });

    if (offset < 5) firstRow.appendChild(dayBox);
    else satSunColumn.appendChild(dayBox);
  }

  firstRow.appendChild(satSunColumn);
  weekContainer.appendChild(firstRow);

  // --- Someday Section ---
  const somedayDiv = document.createElement("div");
  Object.assign(somedayDiv.style, {
    marginTop: "40px",
    width: "100%",
    cursor: "pointer",
    height: "40px"
  });

  const label = document.createElement("strong");
  label.textContent = "Someday";
  label.style.fontFamily = primaryFont;
  label.style.fontWeight = "700";
  label.style.fontSize = "21px";
  somedayDiv.appendChild(label);

  const taskContainer = document.createElement("div");
  Object.assign(taskContainer.style, {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "10px",
  });

  for (let i = 0; i < 5; i++) {
    const taskBox = document.createElement("div");
    Object.assign(taskBox.style, {
      height: "40px",
      borderBottom: "1px solid #e0e0e0",
    });
    taskContainer.appendChild(taskBox);
  }

  somedayDiv.appendChild(taskContainer);
  weekContainer.appendChild(somedayDiv);

  somedayDiv.addEventListener("click", () => {
    const emptyBox = [...taskContainer.children].find(
      (box) => !box.textContent.trim() && !box.querySelector("input")
    );

    const targetBox = emptyBox || (() => {
      const newBox = document.createElement("div");
      taskContainer.appendChild(newBox);
      return newBox;
    })();

    activateInput(targetBox, null);
  });


  async function loadTasksFromDB() {
    // Helper function to get the weekId on the frontend
    function getWeekNumber(d) {
      d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
      return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    }

    try {
      // Determine the weekId for the current view (using the 'monday' variable from your main function)
      const currentWeekId = getWeekNumber(monday);

      // Define the two API endpoints we need
      const weeklyTasksUrl = `http://localhost:5000/api/tasks/week/${currentWeekId}`;
      const somedayTasksUrl = `http://localhost:5000/api/tasks/someday`;

      // Fetch both sets of data in parallel for maximum speed
      const [weeklyRes, somedayRes] = await Promise.all([
        fetch(weeklyTasksUrl, { credentials: 'include' }),
        fetch(somedayTasksUrl, { credentials: 'include' })
      ]);

      if (!weeklyRes.ok || !somedayRes.ok) {
        console.error("Failed to fetch tasks");
        return;
      }

      const weeklyTasks = await weeklyRes.json();
      const somedayTasks = await somedayRes.json();

      // --- Render Weekly Tasks ---
      const allDayBoxes = [...weekContainer.querySelectorAll(".day-box")];
      weeklyTasks.forEach(task => {
        const taskDate = new Date(task.date);
        let jsDay = taskDate.getDay();
        let idx = (jsDay === 0) ? 6 : jsDay - 1;
        const todoList = allDayBoxes[idx].querySelector(".todo-list");

        let box = [...todoList.children].find(
          li => !li.textContent.trim() && !li.querySelector("input")
        );
        if (box) {
          renderTaskElement(box, task);
        }
      });

      // --- Render Someday Tasks ---
      // 'taskContainer' is the variable for your someday list from the main function
      somedayTasks.forEach(task => {
        let box = [...taskContainer.children].find(
          div => !div.textContent.trim() && !div.querySelector("input")
        );
        if (box) {
          renderTaskElement(box, task);
        }
      });

      balanceColumnHeights();

    } catch (err) {
      console.error("Error loading tasks from DB:", err);
    }
  }


  loadTasksFromDB();
}


document.addEventListener('DOMContentLoaded', () => {
  renderWeeklyView();
})

document.getElementById("openCalendarBtn").addEventListener("click", () => {
  currentWeekDate = new Date();
  renderWeeklyView(new Date());
});


let prevweek = document.getElementById("prevweek");
let nextweek = document.getElementById("nextweek");

let currentWeekDate = new Date();

prevweek.addEventListener("click", () => {
  currentWeekDate.setDate(currentWeekDate.getDate() - 7);
  renderWeeklyView(new Date(currentWeekDate));
});

nextweek.addEventListener("click", () => {
  currentWeekDate.setDate(currentWeekDate.getDate() + 7);
  renderWeeklyView(new Date(currentWeekDate));
});

const taskTitleInput = document.querySelector('.modal-date');

const calendarDateText = document.querySelector('.calendar-date-text');
const modalDate = document.querySelector('.modal-date');

if (calendarDateText) {
  calendarDateText.textContent = formatDate(new Date());
}

flatpickr(modalDate, {
  defaultDate: new Date(),
  dateFormat: "D, d M Y",
  onChange: function (selectedDates) {
    if (calendarDateText && selectedDates[0]) {
      calendarDateText.textContent = formatDate(selectedDates[0]);
    }
  }
});

function setModalDate(date) {
  if (calendarDateText) {
    calendarDateText.textContent = formatDate(date);
  }
  if (modalDate._flatpickr) {
    modalDate._flatpickr.setDate(date, true);
  }
}

document.addEventListener('click', function (e) {
  const modalDateDiv = e.target.closest('.modal-date');
  if (modalDateDiv) {
    const dateValue = modalDateDiv.getAttribute('data-date');
    if (dateValue) {
      const dateObj = new Date(dateValue);
      taskTitleInput.value = formatDate(dateObj);
      if (taskTitleInput._flatpickr) {
        taskTitleInput._flatpickr.setDate(dateObj, true);
      }
    }
  }
});


//modal code
const editModal = document.getElementById("editModal");
const modalOverlay = document.getElementById("modalOverlay");
const modalTextarea = document.getElementById("taskTitle");
const taskNotes = document.getElementById("taskNotes");
const modalDateContainer = document.querySelector('.modal-date');
const deleteBtn = document.querySelector('#editModal .modal-actions button[title="Delete"]');
const colorButton = document.querySelector('button[title="Select Color"]');
const colorPicker = document.getElementById('colorPicker');
const taskCircle = document.getElementById('taskCircle');

// --- STATE VARIABLES ---
let currentEditableBox = null;
let selectedTaskColor = null;
let flatpickrInstance = null;
let onSaveCallback = null;
let currentTaskDate = null;

// --- DATE & CALENDAR LOGIC (FLATPICKR) ---
function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date)) return "";
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
}

function autoResizeTextarea(element) {
  element.style.height = 'auto';
  element.style.height = element.scrollHeight + 'px';
}

if (taskNotes) {
  taskNotes.addEventListener('input', function () {
    autoResizeTextarea(this);
  });
}

// Initialize Flatpickr on the date container in the header
if (modalDateContainer) {
  flatpickrInstance = flatpickr(modalDateContainer, {
    dateFormat: "Y-m-d",
    onChange: function (selectedDates) {
      if (calendarDateText && selectedDates[0]) {
        currentTaskDate = selectedDates[0];
        calendarDateText.textContent = formatDate(currentTaskDate);
      }
    }
  });
}

function setModalDate(date) {
  if (!(date instanceof Date) || isNaN(date)) return;

  currentTaskDate = date;

  if (calendarDateText) {
    calendarDateText.textContent = formatDate(date);
  }

  if (flatpickrInstance) {
    flatpickrInstance.setDate(date, false); // false = don’t trigger onChange again
  }
}


// --- MODAL CORE FUNCTIONS ---
const openEditModal = function (
  oldText,
  callback,
  editableBox = null,
  currentColor = null,
  taskDate = new Date()
) {
  // Store state
  currentEditableBox = editableBox;
  selectedTaskColor = currentColor || "#000000";
  onSaveCallback = callback;

  // Prefill modal fields
  modalTextarea.value = oldText || "";
  taskNotes.value = currentEditableBox?.dataset.notes || ""; // keep notes if stored in dataset
  autoResizeTextarea(taskNotes);
  setModalDate(taskDate);

  // Handle color
  colorPicker.value = selectedTaskColor;
  if (taskCircle) {
    taskCircle.style.backgroundColor =
      currentColor ? selectedTaskColor : "transparent";
  }

  // Show modal
  modalOverlay.style.display = "block";
  editModal.style.display = "block";
  setTimeout(() => editModal.classList.add("show"), 10);

  // Focus textarea
  modalTextarea.focus();

  // Ensure only one overlay listener is active
  modalOverlay.removeEventListener("click", handleOverlayClick);
  modalOverlay.addEventListener("click", handleOverlayClick);
};

async function handleTaskSave(box, newText, color, notes, newDate) {
  // 'box' is the original <li> element of the task.
  if (!box) return;

  const taskId = box.dataset.id;
  if (!taskId) return;

  // 1. UPDATE THE SERVER (This part is correct)
  try {
    const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: newText,
        notes: notes,
        color: color,
        date: newDate.toISOString()
      }),
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error('Server update failed');
    }

    // 2. UPDATE THE TASK ELEMENT'S DATA (This part is correct)
    const textSpan = box.querySelector('.task-text');
    if (textSpan) textSpan.textContent = newText;
    box.dataset.notes = notes;
    const newDateString = newDate.toISOString().split('T')[0];
    box.dataset.date = newDateString;

    // 3. MOVE THE ELEMENT TO THE FIRST EMPTY SLOT IN THE NEW COLUMN
    const newDateColumn = document.querySelector(`[data-date-column="${newDateString}"]`);

    if (newDateColumn) {
      const todoList = newDateColumn.querySelector('.todo-list');
      if (todoList) {
        // ✅ --- START OF CHANGES ---

        // Find the first available empty row (an <li> with no text content)
        const emptySlot = [...todoList.children].find(li => !li.textContent.trim());

        if (emptySlot) {
          // If an empty slot is found, replace it with your task box.
          emptySlot.parentNode.replaceChild(box, emptySlot);
        } else {
          // If no empty slots are found, add the task to the end as a fallback.
          todoList.appendChild(box);
        }

        // ✅ --- END OF CHANGES ---
      }
    } else {
      // If the new date column isn't visible, remove the task.
      box.remove();
    }

  } catch (error) {
    console.error("Failed to save task:", error);
  }
}

function closeEditModal() {
  editModal.classList.remove("show");
  modalOverlay.removeEventListener("click", handleOverlayClick);
  setTimeout(() => {
    modalOverlay.style.display = "none";
    editModal.style.display = "none";
  }, 300);
}

function saveAndClose() {
  if (typeof onSaveCallback === 'function') {
    const newText = modalTextarea.value;
    const notes = taskNotes.value;
    const color = selectedTaskColor;
    onSaveCallback(newText, color, notes, currentTaskDate);
  }
  closeEditModal();
}

function handleOverlayClick(e) {
  if (e.target === modalOverlay) {
    saveAndClose();
  }
}

// --- EVENT LISTENERS ---
if (deleteBtn) {
  deleteBtn.addEventListener('click', async () => {
    if (currentEditableBox) {
      const taskId = currentEditableBox.dataset.id;
      if (taskId) {
        await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          },
          credentials: "include"
        });
        currentEditableBox.remove();
      }
      closeEditModal();
    }
  });
}

// Initialize the custom color picker when the page loads
Coloris({
  el: '#colorPicker',
  theme: 'default',
  themeMode: 'dark',
  alpha: false,
  format: 'hex'
});

if (colorButton) {
  colorButton.addEventListener('click', () => colorPicker.click());
}

document.addEventListener('coloris:pick', event => {
  selectedTaskColor = event.detail.color;
  if (taskCircle) {
    taskCircle.style.backgroundColor = selectedTaskColor;
  }
  if (currentEditableBox) {
    const textSpan = currentEditableBox.querySelector('.task-text');
    if (textSpan) {
      textSpan.style.backgroundColor = selectedTaskColor;
      textSpan.style.color = "#fff";
    }
  }
});

function insertAtCursor(textArea, openTag, closeTag = "") {
  const start = textArea.selectionStart;
  const end = textArea.selectionEnd;
  const selectedText = textArea.value.substring(start, end);

  const before = textArea.value.substring(0, start);
  const after = textArea.value.substring(end);

  const newText = before + openTag + selectedText + closeTag + after;

  textArea.value = newText;

  const cursorPos = start + openTag.length + selectedText.length + closeTag.length;
  textArea.selectionStart = textArea.selectionEnd = cursorPos;
  textArea.focus();
}

let currentFontSize = 15;
let headingApplied = false;


document.getElementById("btnheading").addEventListener("click", () => {
  if (!headingApplied) {
    currentFontSize += 2;
    taskNotes.style.fontSize = currentFontSize + "px";

    const value = taskNotes.value;
    const cursorPos = taskNotes.selectionStart;

    const newValue = value.slice(0, cursorPos) + "\n" + value.slice(cursorPos);
    taskNotes.value = newValue;

    taskNotes.selectionStart = taskNotes.selectionEnd = cursorPos + 2;
    taskNotes.focus();

    headingApplied = true;

    const onEnter = (e) => {
      if (e.key === "Enter") {
        setTimeout(() => {
          currentFontSize = 15;
          taskNotes.style.fontSize = currentFontSize + "px";
          headingApplied = false;
          taskNotes.removeEventListener("keydown", onEnter);
        }, 0);
      }
    };

    taskNotes.addEventListener("keydown", onEnter);
  }
});


document.getElementById("btnbold").addEventListener("click", () => {
  if (taskNotes) {
    taskNotes.style.fontWeight =
      taskNotes.style.fontWeight === "bold" ? "normal" : "bold";
  }
});

document.getElementById("btnlist").addEventListener("click", () => {
  const textarea = document.getElementById("taskNotes");
  const lines = textarea.value.split("\n");

  const newLines = lines.map(line => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("• ")) {
      return trimmed.replace(/^•\s/, "");
    } else {
      return "• " + trimmed;
    }
  });

  textarea.value = newLines.join("\n");
});

document.getElementById("btnstream").addEventListener("click", () => {
  insertAtCursor(taskNotes, "\n> ", "\n");
});

document.getElementById("link").addEventListener("click", () => {
  const url = prompt("Enter the URL");
  if (!url) return;

  const start = taskNotes.selectionStart;
  const end = taskNotes.selectionEnd;
  const selectedText = taskNotes.value.substring(start, end) || "link text";

  const before = taskNotes.value.substring(0, start);
  const after = taskNotes.value.substring(end);

  taskNotes.value = before + `[${selectedText}](${url})` + after;

  const cursorPos = before.length + `[${selectedText}](${url})`.length;
  taskNotes.selectionStart = taskNotes.selectionEnd = cursorPos;
  taskNotes.focus();
});

//3dot menu
// Get the button and the menu elements
const moreOptionsBtn = document.getElementById('moreOptionsBtn');
const moreOptionsMenu = document.getElementById('moreOptionsMenu');

// Ensure both elements exist before adding listeners
if (moreOptionsBtn && moreOptionsMenu) {

  // --- Logic to TOGGLE the menu ---
  moreOptionsBtn.addEventListener('click', (event) => {
    // This stops the click from immediately being caught by the 'window' listener
    event.stopPropagation();

    // Toggle the 'show' class on the menu
    moreOptionsMenu.classList.toggle('show');
  });

  // --- Logic to CLOSE the menu when clicking outside ---
  window.addEventListener('click', (event) => {
    // If the menu is currently shown...
    if (moreOptionsMenu.classList.contains('show')) {
      // ...and the click was NOT on the button or inside the menu...
      if (!moreOptionsBtn.contains(event.target) && !moreOptionsMenu.contains(event.target)) {
        // ...then hide the menu.
        moreOptionsMenu.classList.remove('show');
      }
    }
  });
}

// account login
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = "http://localhost:5000";

  // --- DOM ELEMENTS ---
  const authTrigger = document.getElementById('auth-trigger');
  const authModalBackdrop = document.getElementById('auth-modal-backdrop');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modalTitle = document.getElementById('modal-title');
  const messageArea = document.getElementById('messageArea');

  // Forms
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const verifyForm = document.getElementById('verifyForm');

  // Links to switch forms
  const showRegisterLink = document.getElementById('showRegisterLink');
  const showLoginLinkFromRegister = document.getElementById('showLoginLinkFromRegister');

  // Profile Display
  const profileDropdown = document.getElementById('profile-dropdown');
  const dropdownInitials = document.getElementById('dropdown-initials');
  const dropdownFullname = document.getElementById('dropdown-fullname');
  const logoutButton = document.getElementById('logout-button');

  // --- STATE ---
  let isLoggedIn = false;
  let currentEmailForVerification = ''; // To store email between register and verify steps
  let sessionRefreshInterval = null;
  const loginIconSVG = `<svg xmlns="http://www.w.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;

  // --- HELPER FUNCTIONS ---
  function showMessage(message, isError = false) {
    messageArea.textContent = message;
    messageArea.className = isError ? 'message-error' : 'message-success';
    messageArea.style.display = message ? 'block' : 'none';
  }

  function showView(viewToShow) {
    // Hide all forms first
    loginForm.classList.add('hidden');
    registerForm.classList.add('hidden');
    verifyForm.classList.add('hidden');
    // Show the requested form
    viewToShow.classList.remove('hidden');
    // Update modal title
    if (viewToShow === loginForm) modalTitle.textContent = 'Login to Your Account';
    if (viewToShow === registerForm) modalTitle.textContent = 'Create an Account';
    if (viewToShow === verifyForm) modalTitle.textContent = 'Verify Your Email';
    showMessage(''); // Clear any previous messages
  }

  // --- MAIN AUTH LOGIC ---
  function updateAuthState(loggedIn, user = null) {
    isLoggedIn = loggedIn;
    if (sessionRefreshInterval) clearInterval(sessionRefreshInterval);

    if (isLoggedIn && user) {
      const firstName = user.firstName || 'User';
      const lastName = user.lastName || '';
      const initials = (firstName[0] + (lastName[0] || '')).toUpperCase();
      authTrigger.innerHTML = initials;
      authTrigger.classList.add('text');
      dropdownInitials.textContent = initials;
      dropdownFullname.textContent = `${firstName} ${lastName}`.trim();
      authModalBackdrop.classList.add('hidden');
      // Set up token refresh
      sessionRefreshInterval = setInterval(() => fetch(`${API_BASE_URL}/auth/refresh-token`, { method: 'POST', credentials: 'include' }), 6 * 24 * 60 * 60 * 1000);
    } else {
      authTrigger.innerHTML = loginIconSVG;
      authTrigger.classList.remove('text');
      profileDropdown.classList.add('hidden');
    }
  }

  async function checkLoginStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, { method: 'GET', credentials: 'include' });
      if (!response.ok) throw new Error('Not authenticated');
      const data = await response.json();
      updateAuthState(true, data.user);
    } catch (error) {
      updateAuthState(false);
    }
  }

  // --- AUTH TRIGGER ---
  authTrigger.addEventListener('click', (e) => {
    e.stopPropagation();

    dropdown.classList.remove('show');

    if (isLoggedIn) {
      profileDropdown.classList.toggle('hidden');
    } else {
      authModalBackdrop.classList.remove('hidden');
      showView(loginForm); // Default to login view
      loginForm.reset();
      registerForm.reset();
      verifyForm.reset();
    }
  });

  closeModalBtn.addEventListener('click', () => authModalBackdrop.classList.add('hidden'));
  authModalBackdrop.addEventListener('click', (e) => { if (e.target === authModalBackdrop) authModalBackdrop.classList.add('hidden'); });

  // Form switching links
  showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); showView(registerForm); });
  showLoginLinkFromRegister.addEventListener('click', (e) => { e.preventDefault(); showView(loginForm); });

  // --- FORM SUBMISSIONS ---

  // Step 1: Register
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showMessage('');
    const registerBtn = registerForm.querySelector('button');
    registerBtn.disabled = true;
    registerBtn.textContent = 'Registering...';

    currentEmailForVerification = document.getElementById('registerEmail').value;
    const payload = {
      firstName: document.getElementById('firstNameInput').value,
      lastName: document.getElementById('lastNameInput').value,
      email: currentEmailForVerification,
      password: document.getElementById('registerPassword').value
    };

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      // On success, move to the OTP verification step
      document.getElementById('otpEmailDisplay').textContent = currentEmailForVerification;
      showView(verifyForm);

    } catch (err) {
      showMessage(err.message, true);
    } finally {
      registerBtn.disabled = false;
      registerBtn.textContent = 'Register';
    }
  });

  // Step 2: Verify OTP
  verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showMessage('');
    const verifyBtn = verifyForm.querySelector('button');
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying...';

    const payload = {
      email: currentEmailForVerification,
      otp: document.getElementById('otpInput').value
    };

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-account`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      // On success, inform the user and switch to the login form
      showMessage('Account verified successfully! Please log in.', false);
      showView(loginForm);

    } catch (err) {
      showMessage(err.message, true);
    } finally {
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Verify Account';
    }
  });

  // Step 3: Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showMessage('');
    const loginBtn = loginForm.querySelector('button');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging In...';

    const payload = {
      email: document.getElementById('loginEmail').value,
      password: document.getElementById('loginPassword').value
    };

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      updateAuthState(true, data.user); // Login successful
      if (typeof renderWeeklyView === 'function') {
        renderWeeklyView();
      }
    } catch (err) {
      showMessage(err.message, true);
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login';
    }
  });

  // --- Other Listeners (Logout, Password Toggle, etc.) ---
  logoutButton.addEventListener('click', async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } finally {
      updateAuthState(false);
      if (typeof renderWeeklyView === 'function') {
        renderWeeklyView();
      }
    }
  });

  const toggleRegisterPassword = document.getElementById('toggleRegisterPassword');
  toggleRegisterPassword.addEventListener('click', function () {
    const registerPasswordInput = document.getElementById('registerPassword');
    const type = registerPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    registerPasswordInput.setAttribute('type', type);
    document.getElementById('register-eye-open-svg').style.display = (type === 'password') ? 'block' : 'none';
    document.getElementById('register-eye-closed-svg').style.display = (type === 'password') ? 'none' : 'block';
  });

  // --- INITIALIZATION ---
  checkLoginStatus();
});



// : button dropdown
const menuBtn = document.querySelector(".circle-menu");
const dropdown = document.querySelector(".dropdown-content");
const authTrigger = document.getElementById('auth-trigger');
const profileDropdown = document.getElementById('profile-dropdown');
// --- CIRCLE MENU ---
menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  profileDropdown.classList.add('hidden');
  dropdown.classList.toggle("show");
});

document.addEventListener("click", (e) => {
  if (!authTrigger.contains(e.target) && !profileDropdown.contains(e.target)) {
    profileDropdown.classList.add("hidden");
  }
  if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.remove("show");
  }
});

