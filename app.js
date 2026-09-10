(() => {
  const answers = window.GRAMMAR_ANSWERS || {};
  const catalog = window.TASK_CATALOG || [];
  const state = { week: "week2part1", uid: localStorage.getItem("grammar3.localUid") || crypto.randomUUID(), firebase: false, responses: {} };
  localStorage.setItem("grammar3.localUid", state.uid);

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const storageKey = () => `grammar3.responses.${state.uid}`;
  const normalize = value => value.trim().toLowerCase().replace(/[’]/g, "'").replace(/[–—]/g, "-").replace(/\s+/g, " ").replace(/[.!?]+$/g, "");
  const toast = message => { const node = $("#toast"); node.textContent = message; node.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove("show"), 1800); };

  function localLoad() {
    try { state.responses = JSON.parse(localStorage.getItem(storageKey()) || "{}"); } catch { state.responses = {}; }
  }

  async function initFirebase() {
    const config = window.FIREBASE_CONFIG;
    if (!config || !config.apiKey || !window.firebase) return;
    try {
      firebase.initializeApp(config);
      await firebase.auth().signInAnonymously();
      state.uid = firebase.auth().currentUser.uid;
      state.firebase = true;
      $("#sync-status").textContent = "Firebase sync on";
      const snapshot = await firebase.database().ref(`responses/${state.week}/${state.uid}`).once("value");
      state.responses = { ...state.responses, ...(snapshot.val() || {}) };
      hydrateControls();
    } catch (error) {
      console.warn("Firebase unavailable; continuing locally.", error);
      $("#sync-status").textContent = "Local mode · Firebase unavailable";
    }
  }

  const lessonKey = week => week.startsWith("week2part") ? "week2" : week;
  function weekName(week = state.week) { return week === "week2part1" ? "Week 2 · Part 1" : "Week 2 · Part 2"; }
  function getName(week = state.week) { return localStorage.getItem(`grammar3.name.${lessonKey(week)}`) || ""; }

  async function saveName(week, fullName) {
    const lesson = lessonKey(week);
    localStorage.setItem(`grammar3.name.${lesson}`, fullName);
    if (state.firebase) await firebase.database().ref(`students/${state.uid}`).update({ name: fullName, [`weeks/${lesson}/startedAt`]: firebase.database.ServerValue.TIMESTAMP });
    updateNameCards();
  }

  async function saveResponse(taskId, value, correct = null) {
    const task = catalog.find(item => item.id === taskId);
    if (!task) return;
    const record = { value, correct, answered: Boolean(value.trim()), updatedAt: Date.now() };
    state.responses[taskId.replaceAll(".", "__")] = record;
    localStorage.setItem(storageKey(), JSON.stringify(state.responses));
    if (state.firebase) {
      await firebase.database().ref(`responses/${task.week}/${state.uid}/${taskId.replaceAll(".", "__")}`).set({ ...record, updatedAt: firebase.database.ServerValue.TIMESTAMP });
    }
    updateProgress();
  }

  function checkControl(control) {
    const taskId = control.dataset.taskId;
    const value = control.value;
    if (!value.trim()) { clearFeedback(control); saveResponse(taskId, "", null); return; }
    const accepted = (answers[taskId] || []).map(normalize);
    const correct = accepted.includes(normalize(value));
    control.classList.toggle("is-correct", correct);
    control.classList.toggle("is-incorrect", !correct);
    let feedback = control.parentElement.querySelector(`.feedback[data-for="${CSS.escape(taskId)}"]`);
    if (!feedback) {
      feedback = document.createElement("span"); feedback.className = "feedback"; feedback.dataset.for = taskId; control.insertAdjacentElement("afterend", feedback);
    }
    feedback.className = `feedback ${correct ? "correct" : "incorrect"}`;
    feedback.textContent = correct ? "Correct" : "Try again";
    saveResponse(taskId, value, correct);
  }

  function clearFeedback(control) {
    control.classList.remove("is-correct", "is-incorrect");
    control.parentElement.querySelector(`.feedback[data-for="${CSS.escape(control.dataset.taskId)}"]`)?.remove();
  }

  function enhanceExercise24() {
    const exercise = $("#e24");
    if (!exercise) return;

    $$(".item", exercise).forEach((item, itemIndex) => {
      let blankNumber = 0;
      [...item.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).forEach(node => {
        if (!node.textContent.includes(".....")) return;
        const parts = node.textContent.split(".....");
        const fragment = document.createDocumentFragment();
        parts.forEach((part, partIndex) => {
          fragment.append(document.createTextNode(part));
          if (partIndex < parts.length - 1) {
            blankNumber += 1;
            const marker = document.createElement("span");
            marker.className = "numbered-blank";
            marker.textContent = `[${blankNumber}]`;
            marker.setAttribute("aria-label", `blank ${blankNumber}`);
            fragment.append(marker);
          }
        });
        node.replaceWith(fragment);
      });

      const input = $("input[data-task-id]", item);
      const wrap = $(".open-response-wrap", item);
      if (!input || !wrap || !blankNumber) return;
      input.id = `e24-answer-${itemIndex + 1}`;
      input.placeholder = blankNumber === 1 ? "Type to or —" : "Type one entry for each numbered blank";

      const label = document.createElement("label");
      label.className = "sequence-answer-label";
      label.htmlFor = input.id;
      label.innerHTML = blankNumber === 1
        ? `Answer for blank <b>[1]</b> <small>Type <i>to</i> or —</small>`
        : `Answers for blanks <b>[1]–[${blankNumber}]</b> <small>Enter in order, separated by /</small>`;
      wrap.prepend(label);

      const hint = document.createElement("span");
      hint.className = "sequence-check-hint";
      hint.textContent = "Press Enter or click outside the field to check.";
      wrap.append(hint);
    });
  }

  function bindControls() {
    $$('[data-task-id]').forEach(control => {
      const taskId = control.dataset.taskId;
      if (answers[taskId]) {
        const eventName = control.tagName === "SELECT" ? "change" : "blur";
        control.addEventListener(eventName, () => checkControl(control));
        if (control.tagName === "INPUT") control.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); checkControl(control); } });
      } else {
        let timer;
        control.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => saveResponse(taskId, control.value, null), 450); });
      }
    });
  }

  function hydrateControls() {
    $$('[data-task-id]').forEach(control => {
      const record = state.responses[control.dataset.taskId.replaceAll(".", "__")];
      if (!record) return;
      control.value = record.value || "";
      if (record.correct === true || record.correct === false) {
        control.classList.toggle("is-correct", record.correct);
        control.classList.toggle("is-incorrect", !record.correct);
        let feedback = document.createElement("span"); feedback.className = `feedback ${record.correct ? "correct" : "incorrect"}`; feedback.dataset.for = control.dataset.taskId; feedback.textContent = record.correct ? "Correct" : "Try again"; control.insertAdjacentElement("afterend", feedback);
      }
    });
    updateProgress();
  }

  function updateProgress() {
    for (const panel of $$(".week-panel")) {
      const week = panel.dataset.week;
      const tasks = catalog.filter(task => task.week === week);
      const records = tasks.map(task => state.responses[task.id.replaceAll(".", "__")]).filter(Boolean);
      const answered = records.filter(record => record.answered).length;
      const autoTasks = tasks.filter(task => task.auto);
      const correct = autoTasks.filter(task => state.responses[task.id.replaceAll(".", "__")]?.correct === true).length;
      const percent = tasks.length ? Math.round(answered / tasks.length * 100) : 0;
      panel.querySelector(".week-progress").style.setProperty("--progress", `${percent}%`);
      panel.querySelector("[data-progress-value]").textContent = `${percent}%`;
      panel.querySelector("[data-summary-grid]").innerHTML = `
        <div class="summary-stat"><strong>${answered}/${tasks.length}</strong><span>responses completed</span></div>
        <div class="summary-stat"><strong>${correct}/${autoTasks.length}</strong><span>auto-checked correct</span></div>
        <div class="summary-stat"><strong>${percent}%</strong><span>weekly completion</span></div>`;
    }
  }

  async function switchWeek(week) {
    state.week = week;
    $$(".week-tab").forEach(tab => tab.classList.toggle("is-active", tab.dataset.weekTarget === week));
    $$(".week-panel").forEach(panel => { const active = panel.dataset.week === week; panel.hidden = !active; panel.classList.toggle("is-active", active); });
    $(".sidebar").classList.remove("is-open");
    $(".mobile-nav-toggle").setAttribute("aria-expanded", "false");
    history.replaceState(null, "", `#${week}`);
    if (state.firebase) {
      const snapshot = await firebase.database().ref(`responses/${week}/${state.uid}`).once("value");
      state.responses = { ...state.responses, ...(snapshot.val() || {}) };
      hydrateControls();
    }
    requireName();
    scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateNameCards() {
    $$(".week-panel").forEach(panel => { panel.querySelector("[data-student-name]").textContent = getName(panel.dataset.week) || "Not signed in"; });
  }

  function requireName(force = false) {
    if (!force && getName()) return;
    $("#dialog-week").textContent = weekName();
    $("#full-name").value = getName();
    $("#name-error").textContent = "";
    $("#name-dialog").showModal();
    setTimeout(() => $("#full-name").focus(), 50);
  }

  $$(".week-tab").forEach(tab => tab.addEventListener("click", () => switchWeek(tab.dataset.weekTarget)));
  $$("[data-change-name]").forEach(button => button.addEventListener("click", () => { state.week = button.closest(".week-panel").dataset.week; requireName(true); }));
  $(".mobile-nav-toggle").addEventListener("click", event => { const open = $(".sidebar").classList.toggle("is-open"); event.currentTarget.setAttribute("aria-expanded", String(open)); });
  $("#name-form").addEventListener("submit", async event => {
    event.preventDefault();
    const value = $("#full-name").value.trim().replace(/\s+/g, " ");
    if (value.split(" ").length < 2 || value.length < 5) { $("#name-error").textContent = "Please enter your first name and surname."; return; }
    await saveName(state.week, value); $("#name-dialog").close(); toast("Name saved");
  });
  $("#name-dialog").addEventListener("cancel", event => { if (!getName()) event.preventDefault(); });

  window.prepareFunctionExercises?.();
  localLoad();
  enhanceExercise24();
  bindControls();
  hydrateControls();
  updateNameCards();
  const initial = location.hash === "#week2part2" ? "week2part2" : "week2part1";
  switchWeek(initial);
  initFirebase();
})();
