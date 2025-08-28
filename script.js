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
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

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

  function createCheckBtn(span) {
    const btn = document.createElement("img");
    btn.src = "./assets/check-button.png";
    btn.className = "check-btn";
    btn.title = "Mark as done";
    Object.assign(btn.style, {
      width: "18px",
      height: "18px",
      marginLeft: "8px",
      cursor: "pointer",
      verticalAlign: "middle",
    });

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      span.classList.toggle("completed");
      btn.style.opacity = span.classList.contains("completed") ? "0.5" : "1";
      span.style.color = span.classList.contains("completed")
        ? "black"
        : "black";
    });
    return btn;
  }

  function saveTask(box, text, color = null) {
    box.innerHTML = "";
    const span = document.createElement("span");
    span.className = "task-text";
    span.textContent = text;
    styleTaskSpan(span, color);
    box.append(span, createCheckBtn(span));

    span.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditModal(span.textContent.trim(), (newText, newColor) => {
        if (newText?.trim()) saveTask(box, newText.trim(), newColor);
      }, box);
    });

    Object.assign(box.style, {
      height: "40px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    });
    box.title = text;
  }

  function activateInput(box) {
    const input = createInput();
    box.textContent = "";
    box.appendChild(input);
    input.focus();

    const save = () => {
      if (input.value.trim()) saveTask(box, input.value.trim());
      else box.textContent = "";
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
    Object.assign(dayBox.style, {
      padding: "10px 10px 0",
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
    weekdayDiv.style.color = "#999";

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
      dateDiv.style.color = "";
      weekdayDiv.style.color = "";
    }

    dayBox.append(headerDiv, todoContainer);

    dayBox.addEventListener("click", () => {
      // Get the index of the clicked day (0=Mon, 5=Sat, 6=Sun)
      const dayIndex = offset;

      // Find the first visually empty row to type in
      const emptyBox = [...todoContainer.children].find(
        (box) => !box.textContent.trim() && !box.querySelector("input")
      );

      let newRowWasAdded = false;

      // If there's an empty box, use it. Otherwise, create and add a new one.
      if (emptyBox) {
        activateInput(emptyBox);
      } else {
        const newBox = document.createElement("li");
        newBox.style.height = "40px";
        todoContainer.appendChild(newBox);
        activateInput(newBox);
        // We only need to sync when a brand new row is created.
        newRowWasAdded = true;
      }

      // --- CORRECTED ROW SYNCING LOGIC ---

      // STEP 1: Check if we should sync at all.
      // Only proceed if a new row was added AND the day we clicked on is NOT Saturday (index 5).
      if (newRowWasAdded && dayIndex !== 5) {

        const allDayBoxes = [...weekContainer.querySelectorAll(".day-box")];
        Object.assign(allDayBoxes[5].style, {
          maxHeight: "250px"
        })

        // STEP 2: Loop through all the day boxes to potentially add a row to them.
        allDayBoxes.forEach((otherBox, idx) => {

          // STEP 3: Decide whether to add a row to this specific day in the loop.
          // We add a blank row IF:
          //   1. It's NOT the day we originally clicked on (idx !== dayIndex)
          //   2. AND it's also NOT Saturday (idx !== 5)
          if (idx !== dayIndex && idx !== 5) {
            const otherTodoContainer = otherBox.querySelector(".todo-list");
            const newBox = document.createElement("li");
            newBox.style.height = "40px";
            otherTodoContainer.appendChild(newBox);
          }
        });
      }
    });


    if (offset < 5) firstRow.appendChild(dayBox);
    else satSunColumn.appendChild(dayBox);
  }

  firstRow.appendChild(satSunColumn);
  weekContainer.appendChild(firstRow);

  // --- Someday Section ---
  const somedayDiv = document.createElement("div");
  Object.assign(somedayDiv.style, { marginTop: "40px", width: "100%", cursor: "pointer" });

  const label = document.createElement("strong");
  label.textContent = "Someday";
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
      height: "30px",
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
    activateInput(emptyBox || taskContainer.appendChild(document.createElement("div")));
  });
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

function formatDate(date) {
  const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}
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

let currentEditableBox = null;

function openEditModal(oldText, callback, editableBox = null, currentColor = null) {
  const modal = editModal;
  const overlay = modalOverlay;
  const textarea = modalTextarea;

  currentEditableBox = editableBox;
  selectedTaskColor = currentColor;
  textarea.value = oldText;
  modal.style.display = "block";
  overlay.style.display = "block";

  if (selectedTaskColor) {
    colorPicker.value = selectedTaskColor;
    if (taskCircle) {
      taskCircle.style.backgroundColor = selectedTaskColor;
    }
  } else {
    colorPicker.value = "#000000";
    if (taskCircle) {
      taskCircle.style.backgroundColor = "";
    }
  }

  if (taskCircle && selectedTaskColor) {
    taskCircle.style.backgroundColor = selectedTaskColor;
  } else if (taskCircle) {
    taskCircle.style.backgroundColor = 'transparent';
  }


  setTimeout(() => modal.classList.add("show"), 10);

  function saveAndClose() {
    const newText = textarea.value;
    const notes = taskNotes.value;
    const color = selectedTaskColor;
    callback(newText, color, notes);
    closeModal();
  }

  function closeModal() {
    modal.classList.remove("show");
    overlay.style.display = "none";
    overlay.removeEventListener("click", overlayClickHandler);
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
  }

  function overlayClickHandler(e) {
    if (e.target === overlay) {
      saveAndClose();
    }
  }
  overlay.addEventListener("click", overlayClickHandler);

  textarea.focus();
}

function closeEditModal() {
  editModal.classList.remove("show");
  modalOverlay.style.display = "none";
  modalTextarea.value = "";
  currentEditableBox = null;
  setTimeout(() => {
    editModal.style.display = "none";
  }, 300);
}


const deleteBtn = document.querySelector('#editModal .modal-actions button[title="Delete"]');

if (deleteBtn) {
  deleteBtn.addEventListener('click', function () {
    if (currentEditableBox) {
      const parent = currentEditableBox.parentElement;
      if (parent) {
        parent.removeChild(currentEditableBox);
        const newBox = document.createElement(currentEditableBox.tagName);
        newBox.textContent = "";
        parent.appendChild(newBox);
      }
      closeEditModal();
    }
  });
}

const colorButton = document.querySelector('button[title="Select Color"]');
const colorPicker = document.getElementById('colorPicker');
const taskCircle = document.getElementById('taskCircle');

let selectedTaskColor = null;

if (colorButton) {
  colorButton.addEventListener('click', () => {
    colorPicker.click();
  });
}

if (colorPicker) {
  colorPicker.addEventListener('change', (e) => {
    selectedTaskColor = e.target.value;
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
}

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

  // --- EVENT LISTENERS ---
  authTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
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

menuBtn.addEventListener("click", () => {
  dropdown.classList.toggle("show");
});

document.addEventListener("click", (e) => {
  if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.remove("show");
  }
});

