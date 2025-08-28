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

  const monthWithYear = document.getElementById("openCalendarBtn");
  const monthName = months[today.getMonth()];
  const year = today.getFullYear();
  monthWithYear.textContent = `${monthName} ${year}`;

  if (
    currentDate.getMonth() !== today.getMonth() ||
    currentDate.getFullYear() !== today.getFullYear()
  ) {
    monthWithYear.style.color = "#5167f4";
    monthWithYear.style.cursor = "pointer";
  } else {
    monthWithYear.style.color = "";
    monthWithYear.style.cursor = "pointer";
  }

  weekContainer.innerHTML = "";

  const firstRow = document.createElement("div");
  firstRow.className = "week-grid-row";

  const satSunColumn = document.createElement("div");
  satSunColumn.style.display = "flex";
  satSunColumn.style.flexDirection = "column";
  satSunColumn.style.gap = "10px";

  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  function closeActiveInput() {
    const allInputs = weekContainer.querySelectorAll('input[type="text"]');
    allInputs.forEach(input => {
      const parentBox = input.parentElement;
      if (input.value.trim() !== "") {
        parentBox.innerHTML = `
          <span class="task-text">${input.value.trim()}</span>
          <img src="./assets/check-button.png" class="check-btn" title="Mark as done" />
        `;
        const textSpan = parentBox.querySelector('.task-text');
        const checkBtn = parentBox.querySelector('.check-btn');

        textSpan.style.whiteSpace = "nowrap";
        textSpan.style.overflow = "hidden";
        textSpan.style.textOverflow = "ellipsis";
        textSpan.style.height = "18px";
        textSpan.style.textAlign = "left";
        textSpan.addEventListener("click", (e) => {
          e.stopPropagation();
          openEditModal(parentBox);
        });

        checkBtn.style.width = "18px";
        checkBtn.style.height = "18px";
        checkBtn.style.marginLeft = "8px";
        checkBtn.style.cursor = "pointer";
        checkBtn.style.verticalAlign = "middle";

        checkBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          textSpan.classList.toggle("completed");

          if (textSpan.classList.contains("completed")) {
            checkBtn.style.opacity = "0.5";
          } else {
            checkBtn.style.opacity = "1";
            textSpan.style.color = "black";
          }
        });

        parentBox.title = input.value.trim();
        parentBox.style.marginTop = "-22px";
        parentBox.style.display = "flex";
        parentBox.style.justifyContent = "space-between";
        parentBox.style.alignItems = "center";
      } else {
        parentBox.textContent = "";
      }
    });
    activeInput = null;
    activeBox = null;
  }

  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + offset);

    const dayBox = document.createElement("div");
    dayBox.className = "day-box";
    dayBox.style.padding = "10px";
    dayBox.style.borderRadius = "8px";
    dayBox.style.display = "flex";
    dayBox.style.flexDirection = "column";
    dayBox.style.minHeight = "210px";
    dayBox.style.minWidth = "289.484px";
    dayBox.style.flexGrow = "1";
    dayBox.style.cursor = "pointer";

    const headerDiv = document.createElement("div");
    headerDiv.style.marginBottom = "8px";
    headerDiv.style.display = "flex";
    headerDiv.style.justifyContent = "space-between";
    headerDiv.style.width = "105%";
    headerDiv.style.borderBottom = "2px solid black";
    headerDiv.style.paddingBottom = "10px";

    const dayNumber = date.getDate().toString().padStart(2, "0");
    const monthNumber = (date.getMonth() + 1).toString().padStart(2, "0");

    const dateDiv = document.createElement("div");
    dateDiv.style.fontWeight = "bold";
    dateDiv.textContent = `${dayNumber}.${monthNumber}`;

    const weekdayDiv = document.createElement("div");
    weekdayDiv.textContent = weekdays[offset];
    weekdayDiv.style.color = "#999";

    headerDiv.appendChild(dateDiv);
    headerDiv.appendChild(weekdayDiv);

    const todoContainer = document.createElement("ul");
    todoContainer.className = "todo-list";
    todoContainer.style.margin = "20px 0 0 0";
    todoContainer.style.paddingLeft = "1px";
    todoContainer.style.paddingTop = "13px";
    todoContainer.style.flexGrow = "1";
    todoContainer.style.listStyle = "none";
    todoContainer.style.width = "105%";
    todoContainer.style.fontSize = "16px";


    //add on the new li on the todo
    todoContainer.addEventListener("click", (e) => {
      const textSpan = e.target.closest('.task-text');
      if (textSpan) {
        e.stopPropagation();
        const editableBox = textSpan.closest('li');
        if (!editableBox) return;

        currentEditableBox = editableBox;
        modalTextarea.value = textSpan.innerText.trim();
        editModal();
      }
    });

    let limit = offset < 5 ? 11 : 4;
    for (let i = 0; i < limit; i++) {
      const li = document.createElement("li");
      li.textContent = " ";
      todoContainer.appendChild(li);
    }

    let isToday = (
      date.getDate() === currentDate.getDate() &&
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    );

    let isSelected = false;
    if (highlightDate) {
      isSelected = (
        date.getDate() === highlightDate.getDate() &&
        date.getMonth() === highlightDate.getMonth() &&
        date.getFullYear() === highlightDate.getFullYear()
      );
    }

    if (
      date.getFullYear() === baseDate.getFullYear() &&
      date.getMonth() === baseDate.getMonth() &&
      date.getDate() === baseDate.getDate()
    ) {
      dayBox.style.color = "#5167F4";
      dayBox.style.fontWeight = "bold";
    }



    if (isSelected) {
      dateDiv.style.color = "#5167f4";
      weekdayDiv.style.color = "#5167f4";
    } else if (isToday) {
      dateDiv.style.color = "default";
      weekdayDiv.style.color = "default";
    }

    dayBox.appendChild(headerDiv);
    dayBox.appendChild(todoContainer);

    function createInputForBox(box) {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "";
      input.style.border = "rgba(255, 255, 255, 0.95)";
      input.style.fontSize = "14px";
      input.style.borderRadius = "6px";
      input.style.backgroundColor = "white";
      input.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
      input.style.outline = "none";
      input.style.display = "flex";
      input.style.justifyContent = "space-between";
      input.style.height = "42px";
      input.style.marginTop = "-42px";
      input.style.boxSizing = "border-box";
      input.style.width = "100%";
      return input;
    }

    function saveTaskToBox(box, text) {
      box.innerHTML = `
      <span class="task-text">${text}</span>
      <img src="./assets/check-button.png" class="check-btn" title="Mark as done" />
      `;
      const textSpan = box.querySelector('.task-text');
      const checkBtn = box.querySelector('.check-btn');

      textSpan.style.whiteSpace = "nowrap";
      textSpan.style.overflow = "hidden";
      textSpan.style.textOverflow = "ellipsis";
      textSpan.style.height = "18px";
      textSpan.style.textAlign = "left";

      checkBtn.style.width = "18px";
      checkBtn.style.height = "18px";
      checkBtn.style.marginLeft = "8px";
      checkBtn.style.cursor = "pointer";
      checkBtn.style.verticalAlign = "middle";

      checkBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        textSpan.classList.toggle("completed");

        if (textSpan.classList.contains("completed")) {
          checkBtn.style.opacity = "0.5";
        } else {
          checkBtn.style.opacity = "1";
          textSpan.style.color = "black";
        }
      });

      textSpan.addEventListener("click", (e) => {
        e.stopPropagation();
        openEditModal(textSpan.textContent.trim(), (newText, color) => {
          if (newText && newText.trim() !== "") {
            saveTaskToBox(box, newText.trim());
          }

          const newTextSpan = box.querySelector(".task-text");

          if (color) {
            newTextSpan.style.backgroundColor = color;
            newTextSpan.style.color = "#fff";
          } else {
            newTextSpan.style.backgroundColor = "";
            newTextSpan.style.color = "black";
          }
        }, box);
      });

      box.title = text;
      box.style.marginTop = "-22px";
      box.style.display = "flex";
      box.style.justifyContent = "space-between";
      box.style.alignItems = "center";
    }

    dayBox.addEventListener("click", (e) => {
      e.stopPropagation();
      closeActiveInput();

      const boxes = Array.from(todoContainer.children);
      let emptyBox = boxes.find(box => box.textContent.trim() === "" && !box.querySelector("input"));

      // creating of new li
      if (!emptyBox) {
        const extraLi = document.createElement("li");
        const input = createInputForBox(extraLi);
        extraLi.appendChild(input);
        todoContainer.appendChild(extraLi);
        input.focus();

        activeInput = input;
        activeBox = extraLi;

        const saveTask = () => {
          if (input.value.trim() !== "") {
            saveTaskToBox(extraLi, input.value.trim());
          } else {
            extraLi.textContent = "";
          }
          activeInput = null;
          activeBox = null;
        };

        input.addEventListener("blur", () => setTimeout(saveTask, 0));
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            saveTask();
            input.blur();
          }
        });
        return;
      }

      const input = createInputForBox(emptyBox);
      emptyBox.textContent = "";
      emptyBox.appendChild(input);
      input.focus();

      activeInput = input;
      activeBox = emptyBox;

      const saveTask = () => {
        if (input.value.trim() !== "") {
          saveTaskToBox(emptyBox, input.value.trim());
        } else {
          emptyBox.textContent = "";
        }
        activeInput = null;
        activeBox = null;

        const nextBox = boxes.find(box => box.textContent.trim() === "" && !box.querySelector("input"));
        if (nextBox) {
          setTimeout(() => {
            if (!nextBox.querySelector("input")) {
              const nextInput = createInputForBox(nextBox);
              nextBox.textContent = "";
              nextBox.appendChild(nextInput);
              nextInput.focus();
              activeInput = nextInput;
              activeBox = nextBox;

              nextInput.addEventListener("blur", () => setTimeout(() => {
                if (nextInput.value.trim() !== "") {
                  saveTaskToBox(nextBox, nextInput.value.trim());
                } else {
                  nextBox.textContent = "";
                }
                activeInput = null;
                activeBox = null;
              }, 0));

              nextInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  nextInput.blur();
                }
              });
            }
          }, 150);
        }
      };

      input.addEventListener("blur", () => setTimeout(saveTask, 0));
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          saveTask();
          input.blur();
        }
      });
    });

    if (offset < 5) {
      firstRow.appendChild(dayBox);
    } else if (offset === 5 || offset === 6) {
      satSunColumn.appendChild(dayBox);
    }
  }

  firstRow.appendChild(satSunColumn);
  weekContainer.appendChild(firstRow);

  //someday section
  function handleTextSpanClick(e) {
    e.stopPropagation();
    const textSpan = e.target;
    const extraBox = textSpan.parentElement;

    openEditModal(textSpan.textContent.trim(), (newText, color) => {
      if (newText && newText.trim() !== "") {
        extraBox.innerHTML = `
          <span class="task-text">${newText.trim()}</span>
          <img src="./assets/check-button.png" class="check-btn" title="Mark as done" />
        `;
        const newTextSpan = extraBox.querySelector('.task-text');
        const newCheckBtn = extraBox.querySelector('.check-btn');

        if (color) {
          newTextSpan.style.backgroundColor = color;
          newTextSpan.style.color = "#fff";
        } else {
          newTextSpan.style.backgroundColor = "";
          newTextSpan.style.color = "black";
        }
        newTextSpan.style.whiteSpace = "nowrap";
        newTextSpan.style.overflow = "hidden";
        newTextSpan.style.textOverflow = "ellipsis";
        newTextSpan.style.textAlign = "left";
        newTextSpan.style.height = "18px";

        newCheckBtn.style.width = "18px";
        newCheckBtn.style.height = "18px";
        newCheckBtn.style.marginLeft = "8px";
        newCheckBtn.style.cursor = "pointer";
        newCheckBtn.style.verticalAlign = "middle";

        newCheckBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          newTextSpan.classList.toggle("completed");

          newCheckBtn.style.opacity = newTextSpan.classList.contains("completed") ? "0.5" : "1";
          newTextSpan.style.color = "black";
        });

        newTextSpan.addEventListener("click", handleTextSpanClick);
      }
    }, extraBox);
  }

  const somedayDiv = document.createElement("div");
  somedayDiv.style.marginTop = "10px";
  somedayDiv.style.width = "100%";
  somedayDiv.style.cursor = "pointer";

  const label = document.createElement("strong");
  label.textContent = "Someday";
  label.style.color = "#000";
  somedayDiv.appendChild(label);

  const taskContainer = document.createElement("div");
  taskContainer.style.display = "flex";
  taskContainer.style.flexDirection = "column";
  taskContainer.style.gap = "10px";
  taskContainer.style.marginTop = "20px";

  const somedayExtraTasks = document.createElement("div");
  somedayExtraTasks.className = "someday-extra-tasks";
  somedayExtraTasks.style.display = "flex";
  somedayExtraTasks.style.flexDirection = "column";
  somedayExtraTasks.style.gap = "10px";

  for (let i = 0; i < 5; i++) {
    const taskBox = document.createElement("div");
    taskBox.textContent = "";
    taskBox.style.height = "30px";
    taskBox.style.borderBottom = "1px solid #e0e0e0";
    taskBox.style.whiteSpace = "nowrap";
    taskBox.style.overflow = "hidden";
    taskBox.style.textOverflow = "ellipsis";
    taskContainer.appendChild(taskBox);
  }

  somedayDiv.appendChild(taskContainer);
  somedayDiv.appendChild(somedayExtraTasks);
  weekContainer.appendChild(somedayDiv);

  somedayDiv.addEventListener("click", (e) => {
    e.stopPropagation();
    closeActiveInput();
    const boxes = Array.from(taskContainer.children);
    const emptyBox = boxes.find(box => box.textContent.trim() === "");

    //appnending new on someday text
    if ((!emptyBox || emptyBox.querySelector("input"))) {
      const extraBox = document.createElement("div");
      extraBox.style.height = "30px";
      extraBox.style.borderBottom = "1px solid #e0e0e0";
      extraBox.style.whiteSpace = "nowrap";
      extraBox.style.overflow = "hidden";
      extraBox.style.textOverflow = "ellipsis";
      somedayExtraTasks.appendChild(extraBox);

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "";
      input.style.border = "rgba(255, 255, 255, 0.95)";
      input.style.fontSize = "14px";
      input.style.borderRadius = "6px";
      input.style.backgroundColor = "white";
      input.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
      input.style.outline = "none";
      input.style.height = "42px";
      input.style.marginTop = "-15px";
      input.style.boxSizing = "border-box";
      input.style.display = "flex";
      input.style.width = "auto";
      input.style.overflow = "visible";

      extraBox.textContent = "";
      extraBox.appendChild(input);
      input.focus();
      activeInput = input;
      activeBox = extraBox;

      const saveTask = () => {
        if (input.value.trim() !== "") {
          extraBox.innerHTML = `
            <span class="task-text">${input.value.trim()}</span>
            <img src="./assets/check-button.png" class="check-btn" title="Mark as done" />
          `;
          const textSpan = extraBox.querySelector('.task-text');
          const checkBtn = extraBox.querySelector('.check-btn');

          textSpan.style.whiteSpace = "nowrap";
          textSpan.style.overflow = "hidden";
          textSpan.style.textOverflow = "ellipsis";
          textSpan.style.textAlign = "left";
          textSpan.style.height = "18px";
          textSpan.addEventListener("click", handleTextSpanClick);


          checkBtn.style.width = "18px";
          checkBtn.style.height = "18px";
          checkBtn.style.marginLeft = "8px";
          checkBtn.style.cursor = "pointer";
          checkBtn.style.verticalAlign = "middle";

          checkBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            textSpan.classList.toggle("completed");

            if (textSpan.classList.contains("completed")) {
              checkBtn.style.opacity = "0.5";
            } else {
              checkBtn.style.opacity = "1";
              textSpan.style.color = "black";
            }
          });
          textSpan.addEventListener("click", handleTextSpanClick);
          extraBox.title = input.value.trim();
          extraBox.style.marginTop = "0";
          extraBox.style.display = "flex";
          extraBox.style.justifyContent = "space-between";
          extraBox.style.alignItems = "center";
        } else {
          extraBox.textContent = "";
        }

        activeInput = null;
        activeBox = null;
      };

      input.addEventListener("blur", () => setTimeout(saveTask, 0));
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          saveTask();
          input.blur();
        }
      });
      return;
    }

    if (emptyBox && !emptyBox.querySelector("input")) {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "";
      input.style.border = "rgba(255, 255, 255, 0.95)";
      input.style.fontSize = "14px";
      input.style.borderRadius = "6px";
      input.style.backgroundColor = "white";
      input.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
      input.style.outline = "none";
      input.style.height = "42px";
      input.style.marginTop = "-15px";
      input.style.boxSizing = "border-box";
      input.style.display = "flex";
      input.style.width = "auto";
      input.style.overflow = "visible";

      emptyBox.textContent = "";
      emptyBox.appendChild(input);
      input.focus();
      activeInput = input;
      activeBox = emptyBox;

      const saveTask = () => {
        if (input.value.trim() !== "") {
          emptyBox.innerHTML = `
            <span class="task-text">${input.value.trim()}</span>
            <img src="./assets/check-button.png" class="check-btn" title="Mark as done" />
          `;
          const textSpan = emptyBox.querySelector('.task-text');
          const checkBtn = emptyBox.querySelector('.check-btn');

          textSpan.style.whiteSpace = "nowrap";
          textSpan.style.overflow = "hidden";
          textSpan.style.textOverflow = "ellipsis";
          textSpan.style.textAlign = "left";
          textSpan.style.height = "18px";
          textSpan.addEventListener("click", handleTextSpanClick);

          checkBtn.style.width = "18px";
          checkBtn.style.height = "18px";
          checkBtn.style.marginLeft = "8px";
          checkBtn.style.cursor = "pointer";
          checkBtn.style.verticalAlign = "middle";

          checkBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            textSpan.classList.toggle("completed");

            if (textSpan.classList.contains("completed")) {
              checkBtn.style.opacity = "0.5";
            } else {
              checkBtn.style.opacity = "1";
              textSpan.style.color = "black";
            }
          });

          emptyBox.title = input.value.trim();
          emptyBox.style.marginTop = "0";
          emptyBox.style.display = "flex";
          emptyBox.style.justifyContent = "space-between";
          emptyBox.style.alignItems = "center";
        } else {
          emptyBox.textContent = "";
        }

        activeInput = null;
        activeBox = null;
      };

      input.addEventListener("blur", () => setTimeout(saveTask, 0));
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          saveTask();
          input.blur();
        }
      });
    }
  });

}

renderWeeklyView();


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

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = "http://localhost:5000";

  // --- DOM ELEMENTS ---
  const authTrigger = document.getElementById('auth-trigger');
  const otpModalBackdrop = document.getElementById('otp-modal-backdrop');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const profileDropdown = document.getElementById('profile-dropdown');
  const logoutButton = document.getElementById('logout-button');

  // OTP Form Elements
  const requestForm = document.getElementById('requestForm');
  const verifyForm = document.getElementById('verifyForm');
  const nameFieldsContainer = document.getElementById('nameFieldsContainer');
  const firstNameInput = document.getElementById('firstNameInput');
  const lastNameInput = document.getElementById('lastNameInput');
  const phoneInput = document.getElementById('phoneInput');
  const otpInput = document.getElementById('otpInput');
  const purposeRadios = document.querySelectorAll('input[name="purpose"]');
  const requestBtn = document.getElementById('requestBtn');
  const messageArea = document.getElementById('messageArea');

  // Profile Display Elements
  const dropdownInitials = document.getElementById('dropdown-initials');
  const dropdownFullname = document.getElementById('dropdown-fullname');

  // --- STATE ---
  let isLoggedIn = false;
  let currentPhone = '';
  let currentPurpose = '';
  let sessionRefreshInterval = null; // Holds the timer for session refresh
  const loginIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;

  // --- FUNCTIONS ---
  function showMessage(message, isError = false) {
    messageArea.textContent = message;
    messageArea.className = isError ? 'message-error' : 'message-success';
    messageArea.classList.toggle('hidden', !message);
  }

  function togglePurposeUI() {
    currentPurpose = document.querySelector('input[name="purpose"]:checked').value;
    nameFieldsContainer.classList.toggle('hidden', currentPurpose !== 'register');
    firstNameInput.required = currentPurpose === 'register';
    lastNameInput.required = currentPurpose === 'register';
  }

  function updateAuthState(loggedIn, user = null) {
    isLoggedIn = loggedIn;

    // Always clear any previous timer when the auth state changes
    if (sessionRefreshInterval) {
      clearInterval(sessionRefreshInterval);
    }

    if (isLoggedIn && user) {
      const firstName = user.firstName || 'User';
      const lastName = user.lastName || '';
      const initials = (firstName[0] + (lastName[0] || '')).toUpperCase();

      authTrigger.innerHTML = initials;
      authTrigger.classList.add('text');
      dropdownInitials.textContent = initials;
      dropdownFullname.textContent = `${firstName} ${lastName}`.trim();

      otpModalBackdrop.classList.add('hidden');

      // Start a timer to refresh the session token periodically
      // We refresh every 6 days, well before the 7-day cookie expires.
      sessionRefreshInterval = setInterval(async () => {
        try {
          console.log('Refreshing session...');
          await fetch(`${API_BASE_URL}/auth/refresh-token`, { method: 'POST', credentials: 'include' });
        } catch (error) {
          console.error('Failed to refresh session:', error);
          // Optional: Handle this error, e.g., by logging the user out
        }
      }, 6 * 24 * 60 * 60 * 1000); // 6 days in milliseconds

    } else {
      authTrigger.innerHTML = loginIconSVG;
      authTrigger.classList.remove('text');
      profileDropdown.classList.add('hidden');
    }
  }

  async function checkLoginStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      const data = await response.json();
      updateAuthState(true, data.user);
    } catch (error) {
      console.log('User not logged in.');
      updateAuthState(false);
    }
  }

  // --- EVENT LISTENERS ---
  authTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isLoggedIn) {
      profileDropdown.classList.toggle('hidden');
    } else {
      otpModalBackdrop.classList.remove('hidden');
    }
  });

  closeModalBtn.addEventListener('click', () => otpModalBackdrop.classList.add('hidden'));
  otpModalBackdrop.addEventListener('click', (e) => {
    if (e.target === otpModalBackdrop) otpModalBackdrop.classList.add('hidden');
  });

  purposeRadios.forEach(radio => radio.addEventListener('change', togglePurposeUI));

  requestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showMessage('');
    requestBtn.disabled = true;
    requestBtn.textContent = 'Sending...';
    currentPhone = phoneInput.value;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: currentPhone, purpose: currentPurpose })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      showMessage('OTP sent successfully.');
      requestForm.classList.add('hidden');
      verifyForm.classList.remove('hidden');
      otpInput.focus();
    } catch (err) {
      showMessage(err.message, true);
    } finally {
      requestBtn.disabled = false;
      requestBtn.textContent = 'Request OTP';
    }
  });

  verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showMessage('');
    const payload = { phone: currentPhone, purpose: currentPurpose, otp: otpInput.value };
    if (currentPurpose === 'register') {
      payload.firstName = firstNameInput.value;
      payload.lastName = lastNameInput.value;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      updateAuthState(true, data.user);

    } catch (err) {
      showMessage(err.message, true);
    }
  });

  logoutButton.addEventListener('click', async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      updateAuthState(false);
    }
  });

  document.addEventListener('click', () => {
    if (!profileDropdown.classList.contains('hidden')) {
      profileDropdown.classList.add('hidden');
    }
  });

  togglePurposeUI();
  checkLoginStatus();

});
