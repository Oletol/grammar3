(() => {
  const catalog = window.TASK_CATALOG || [];
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const responseWeeks = [...new Set(catalog.map(task => task.week))];
  let activeWeek = "week2part1";
  let allResponses = {};
  let students = {};
  let studentsRef = null;
  let responseRefs = [];
  let currentStudentGroups = [];

  const lessonKey = week => {
    const match = String(week).match(/^week(\d+)/i);
    return match ? `week${match[1]}` : week;
  };

  const lessonLabel = key => {
    const match = String(key).match(/^week(\d+)$/i);
    return match ? `Week ${match[1]}` : key;
  };

  const weeklyGroups = [...catalog.reduce((groups, task) => {
    const key = lessonKey(task.week);
    if (!groups.has(key)) groups.set(key, { key, label: lessonLabel(key), tasks: [] });
    groups.get(key).tasks.push(task);
    return groups;
  }, new Map()).values()];

  function setupRequired() {
    $("#login-card").hidden = true;
    const box = $("#setup-message");
    box.hidden = false;
    box.innerHTML = "<h2>Firebase setup is still required</h2><p>Add the exact web-app configuration to <code>firebase-config.js</code>, enable Anonymous and Email/Password Authentication, create the teacher account, and deploy <code>database.rules.json</code> after replacing the teacher email placeholder.</p>";
  }

  function escapeHtml(value) {
    const node = document.createElement("span");
    node.textContent = value;
    return node.innerHTML;
  }

  function recordFor(uid, task) {
    return allResponses?.[task.week]?.[uid]?.[task.id.replaceAll(".", "__")];
  }

  function allStudentUids() {
    const uids = new Set(Object.keys(students || {}));
    Object.values(allResponses || {}).forEach(weekResponses => {
      Object.keys(weekResponses || {}).forEach(uid => uids.add(uid));
    });
    return [...uids];
  }

  function normalizedName(name) {
    return String(name || "").normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
  }

  function groupedStudents() {
    const groups = new Map();
    allStudentUids().forEach(uid => {
      const savedName = String(students?.[uid]?.name || "").trim().replace(/\s+/g, " ");
      const key = savedName ? `name:${normalizedName(savedName)}` : "unnamed";
      if (!groups.has(key)) groups.set(key, { key, name: savedName || "Unidentified attempts", uids: [] });
      groups.get(key).uids.push(uid);
    });
    return [...groups.values()].sort((a, b) => {
      if (a.key === "unnamed") return 1;
      if (b.key === "unnamed") return -1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  }

  function combinedRecordFor(studentGroup, task) {
    return studentGroup.uids
      .map(uid => recordFor(uid, task))
      .filter(Boolean)
      .sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0))[0];
  }

  function groupSummary(studentGroup, group) {
    const records = group.tasks.map(task => combinedRecordFor(studentGroup, task)).filter(Boolean);
    const autoTasks = group.tasks.filter(task => task.auto);
    const answered = records.filter(record => record.answered).length;
    const correct = autoTasks.filter(task => combinedRecordFor(studentGroup, task)?.correct === true).length;
    const updated = Math.max(0, ...records.map(record => Number(record.updatedAt) || 0));
    const started = Boolean(records.length || studentGroup.uids.some(uid => students?.[uid]?.weeks?.[group.key]?.startedAt));
    return { answered, correct, updated, started, total: group.tasks.length, autoTotal: autoTasks.length };
  }

  function renderWeeklyOverview(studentGroups) {
    $("#student-week-head").innerHTML = `<th>Student</th>${weeklyGroups.map(group => `<th>${escapeHtml(group.label)}</th>`).join("")}<th>Actions</th>`;
    $("#student-week-stats").innerHTML = studentGroups.map((studentGroup, groupIndex) => {
      const cells = weeklyGroups.map(group => {
        const summary = groupSummary(studentGroup, group);
        if (!summary.started) return '<td class="weekly-cell"><span>Not started</span></td>';
        const completion = summary.total ? Math.round(summary.answered / summary.total * 100) : 0;
        const lastActivity = summary.updated ? new Date(summary.updated).toLocaleString() : "—";
        return `<td class="weekly-cell"><strong>${summary.answered}/${summary.total} · ${completion}%</strong><span>${summary.correct}/${summary.autoTotal} objective answers correct</span><span>Last activity: ${escapeHtml(lastActivity)}</span></td>`;
      }).join("");
      return `<tr><td class="student-name-cell"><b>${escapeHtml(studentGroup.name)}</b></td>${cells}<td><button type="button" class="delete-student" data-delete-group="${groupIndex}">Delete student</button></td></tr>`;
    }).join("") || `<tr><td colspan="${weeklyGroups.length + 2}">No students yet.</td></tr>`;
  }

  function render() {
    const tasks = catalog.filter(task => task.week === activeWeek);
    const lesson = lessonKey(activeWeek);
    currentStudentGroups = groupedStudents();
    const activeGroups = currentStudentGroups.filter(studentGroup => studentGroup.uids.some(uid => students?.[uid]?.weeks?.[lesson]?.startedAt || allResponses?.[activeWeek]?.[uid]));
    const totalAnswered = activeGroups.reduce((sum, studentGroup) => sum + tasks.filter(task => combinedRecordFor(studentGroup, task)?.answered).length, 0);
    const autoTasks = tasks.filter(task => task.auto);
    const correctCount = activeGroups.reduce((sum, studentGroup) => sum + autoTasks.filter(task => combinedRecordFor(studentGroup, task)?.correct === true).length, 0);
    const possible = activeGroups.length * tasks.length;

    $("#metrics").innerHTML = `<div class="metric"><strong>${activeGroups.length}</strong><span>students started</span></div><div class="metric"><strong>${possible ? Math.round(totalAnswered / possible * 100) : 0}%</strong><span>section completion</span></div><div class="metric"><strong>${activeGroups.length * autoTasks.length ? Math.round(correctCount / (activeGroups.length * autoTasks.length) * 100) : 0}%</strong><span>objective answers correct</span></div>`;

    $("#task-stats").innerHTML = tasks.filter(task => task.auto).map(task => {
      const rows = activeGroups.map(studentGroup => combinedRecordFor(studentGroup, task)).filter(row => row?.answered);
      const correct = rows.filter(row => row.correct === true).length;
      const percent = rows.length ? Math.round(correct / rows.length * 100) : 0;
      return `<tr><td><b>${escapeHtml(task.title)}</b><br>${escapeHtml(task.label)}</td><td>${rows.length}</td><td>${correct}</td><td><div class="rate"><div class="rate-bar"><span style="width:${percent}%"></span></div><b>${percent}%</b></div></td></tr>`;
    }).join("") || '<tr><td colspan="4">No objective tasks found.</td></tr>';

    renderWeeklyOverview(currentStudentGroups);
  }

  function setDashboardMessage(message, isError = false) {
    const node = $("#dashboard-message");
    node.textContent = message;
    node.classList.toggle("is-error", isError);
  }

  async function deleteStudentGroup(studentGroup, button) {
    const profileNote = studentGroup.uids.length > 1 ? ` from ${studentGroup.uids.length} combined browser profiles` : "";
    const confirmed = window.confirm(`Delete ${studentGroup.name}${profileNote} and all saved responses? This cannot be undone.`);
    if (!confirmed) return;
    button.disabled = true;
    setDashboardMessage(`Deleting ${studentGroup.name}…`);
    const updates = {};
    studentGroup.uids.forEach(uid => {
      updates[`students/${uid}`] = null;
      responseWeeks.forEach(week => { updates[`responses/${week}/${uid}`] = null; });
    });
    try {
      await firebase.database().ref().update(updates);
      setDashboardMessage(`${studentGroup.name} and all saved responses were deleted.`);
    } catch (error) {
      console.error("Firebase delete failed", error);
      setDashboardMessage("Could not delete this student. Check the Firebase database rules.", true);
      button.disabled = false;
    }
  }

  function subscribe() {
    studentsRef = firebase.database().ref("students");
    studentsRef.on("value", snapshot => { students = snapshot.val() || {}; render(); });
    responseRefs = responseWeeks.map(week => {
      const ref = firebase.database().ref(`responses/${week}`);
      ref.on("value", snapshot => { allResponses[week] = snapshot.val() || {}; render(); });
      return ref;
    });
  }

  function unsubscribe() {
    studentsRef?.off();
    responseRefs.forEach(ref => ref.off());
    studentsRef = null;
    responseRefs = [];
  }

  if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey || !window.firebase) {
    setupRequired();
    return;
  }

  firebase.initializeApp(window.FIREBASE_CONFIG);
  firebase.auth().onAuthStateChanged(user => {
    if (!user || user.isAnonymous) {
      unsubscribe();
      $("#login-card").hidden = false;
      $("#dashboard").hidden = true;
      $("#teacher-account").innerHTML = "";
      return;
    }
    $("#login-card").hidden = true;
    $("#dashboard").hidden = false;
    $("#teacher-account").innerHTML = `<div class="account-chip"><span>${escapeHtml(user.email || "Teacher")}</span><button id="sign-out">Sign out</button></div>`;
    $("#sign-out").addEventListener("click", () => firebase.auth().signOut());
    subscribe();
  });

  $("#teacher-login").addEventListener("submit", async event => {
    event.preventDefault();
    $("#teacher-error").textContent = "";
    try {
      await firebase.auth().signInWithEmailAndPassword($("#teacher-email").value, $("#teacher-password").value);
    } catch (error) {
      $("#teacher-error").textContent = "Sign-in failed. Check the teacher account and Firebase Authentication setup.";
    }
  });

  $("#student-week-stats").addEventListener("click", event => {
    const button = event.target.closest("[data-delete-group]");
    if (!button) return;
    const studentGroup = currentStudentGroups[Number(button.dataset.deleteGroup)];
    if (studentGroup) deleteStudentGroup(studentGroup, button);
  });

  $$(".dashboard-tabs button").forEach(button => button.addEventListener("click", () => {
    activeWeek = button.dataset.week;
    $$(".dashboard-tabs button").forEach(item => item.classList.toggle("is-active", item === button));
    render();
  }));
})();
