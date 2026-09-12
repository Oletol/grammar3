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
    return [...uids].sort((a, b) => {
      const aName = students?.[a]?.name || "";
      const bName = students?.[b]?.name || "";
      return aName.localeCompare(bName, undefined, { sensitivity: "base" });
    });
  }

  function groupSummary(uid, group) {
    const records = group.tasks.map(task => recordFor(uid, task)).filter(Boolean);
    const autoTasks = group.tasks.filter(task => task.auto);
    const answered = records.filter(record => record.answered).length;
    const correct = autoTasks.filter(task => recordFor(uid, task)?.correct === true).length;
    const updated = Math.max(0, ...records.map(record => Number(record.updatedAt) || 0));
    const started = Boolean(students?.[uid]?.weeks?.[group.key]?.startedAt || records.length);
    return { answered, correct, updated, started, total: group.tasks.length, autoTotal: autoTasks.length };
  }

  function renderWeeklyOverview() {
    $("#student-week-head").innerHTML = `<th>Student</th>${weeklyGroups.map(group => `<th>${escapeHtml(group.label)}</th>`).join("")}<th>Actions</th>`;
    const uids = allStudentUids();
    $("#student-week-stats").innerHTML = uids.map(uid => {
      const name = students?.[uid]?.name || "Unnamed student";
      const cells = weeklyGroups.map(group => {
        const summary = groupSummary(uid, group);
        if (!summary.started) return '<td class="weekly-cell"><span>Not started</span></td>';
        const completion = summary.total ? Math.round(summary.answered / summary.total * 100) : 0;
        return `<td class="weekly-cell"><strong>${summary.answered}/${summary.total} · ${completion}%</strong><span>${summary.correct}/${summary.autoTotal} objective answers correct</span></td>`;
      }).join("");
      return `<tr><td class="student-name-cell"><b>${escapeHtml(name)}</b></td>${cells}<td><button type="button" class="delete-student" data-delete-student="${escapeHtml(uid)}" data-student-name="${escapeHtml(name)}">Delete student</button></td></tr>`;
    }).join("") || `<tr><td colspan="${weeklyGroups.length + 2}">No students yet.</td></tr>`;
  }

  function render() {
    const tasks = catalog.filter(task => task.week === activeWeek);
    const activeResponses = allResponses?.[activeWeek] || {};
    const lesson = lessonKey(activeWeek);
    const studentUids = allStudentUids().filter(uid => students?.[uid]?.weeks?.[lesson]?.startedAt || activeResponses?.[uid]);
    const studentEntries = studentUids.map(uid => [uid, activeResponses?.[uid] || {}]);
    const totalAnswered = studentEntries.reduce((sum, [, records]) => sum + Object.values(records).filter(row => row.answered).length, 0);
    const autoTasks = tasks.filter(task => task.auto);
    const correctCount = studentEntries.reduce((sum, [, records]) => sum + Object.values(records).filter(row => row.correct === true).length, 0);
    const possible = studentEntries.length * tasks.length;

    $("#metrics").innerHTML = `<div class="metric"><strong>${studentEntries.length}</strong><span>students started</span></div><div class="metric"><strong>${possible ? Math.round(totalAnswered / possible * 100) : 0}%</strong><span>section completion</span></div><div class="metric"><strong>${studentEntries.length * autoTasks.length ? Math.round(correctCount / (studentEntries.length * autoTasks.length) * 100) : 0}%</strong><span>objective answers correct</span></div>`;

    $("#task-stats").innerHTML = tasks.filter(task => task.auto).map(task => {
      const key = task.id.replaceAll(".", "__");
      const rows = studentEntries.map(([, records]) => records?.[key]).filter(row => row?.answered);
      const correct = rows.filter(row => row.correct === true).length;
      const percent = rows.length ? Math.round(correct / rows.length * 100) : 0;
      return `<tr><td><b>${escapeHtml(task.title)}</b><br>${escapeHtml(task.label)}</td><td>${rows.length}</td><td>${correct}</td><td><div class="rate"><div class="rate-bar"><span style="width:${percent}%"></span></div><b>${percent}%</b></div></td></tr>`;
    }).join("") || '<tr><td colspan="4">No objective tasks found.</td></tr>';

    $("#student-stats").innerHTML = studentEntries.map(([uid, records]) => {
      const answered = tasks.filter(task => records?.[task.id.replaceAll(".", "__")]?.answered).length;
      const correct = autoTasks.filter(task => records?.[task.id.replaceAll(".", "__")]?.correct === true).length;
      const updated = Math.max(0, ...Object.values(records).map(row => Number(row.updatedAt) || 0));
      const name = students?.[uid]?.name || "Unnamed student";
      return `<tr><td><b>${escapeHtml(name)}</b></td><td>${answered}/${tasks.length} · ${tasks.length ? Math.round(answered / tasks.length * 100) : 0}%</td><td>${correct}/${autoTasks.length}</td><td>${updated ? new Date(updated).toLocaleString() : "—"}</td></tr>`;
    }).join("") || '<tr><td colspan="4">No student responses yet.</td></tr>';

    renderWeeklyOverview();
  }

  function setDashboardMessage(message, isError = false) {
    const node = $("#dashboard-message");
    node.textContent = message;
    node.classList.toggle("is-error", isError);
  }

  async function deleteStudent(uid, name, button) {
    const confirmed = window.confirm(`Delete ${name} and all saved responses? This cannot be undone.`);
    if (!confirmed) return;
    button.disabled = true;
    setDashboardMessage(`Deleting ${name}…`);
    const updates = { [`students/${uid}`]: null };
    responseWeeks.forEach(week => { updates[`responses/${week}/${uid}`] = null; });
    try {
      await firebase.database().ref().update(updates);
      setDashboardMessage(`${name} and all saved responses were deleted.`);
    } catch (error) {
      console.error("Student deletion failed.", error);
      button.disabled = false;
      setDashboardMessage("Deletion failed. Deploy the updated database.rules.json file and try again.", true);
    }
  }

  function unsubscribe() {
    studentsRef?.off();
    responseRefs.forEach(ref => ref.off());
    studentsRef = null;
    responseRefs = [];
  }

  function subscribe() {
    unsubscribe();
    studentsRef = firebase.database().ref("students");
    studentsRef.on("value", snapshot => { students = snapshot.val() || {}; render(); });
    responseRefs = responseWeeks.map(week => {
      const ref = firebase.database().ref(`responses/${week}`);
      ref.on("value", snapshot => {
        allResponses[week] = snapshot.val() || {};
        render();
      });
      return ref;
    });
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
    const button = event.target.closest("[data-delete-student]");
    if (!button) return;
    deleteStudent(button.dataset.deleteStudent, button.dataset.studentName, button);
  });

  $$(".dashboard-tabs button").forEach(button => button.addEventListener("click", () => {
    activeWeek = button.dataset.week;
    $$(".dashboard-tabs button").forEach(item => item.classList.toggle("is-active", item === button));
    render();
  }));
})();
