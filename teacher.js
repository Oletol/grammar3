(() => {
  const catalog = window.TASK_CATALOG || [];
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  let activeWeek = "week2";
  let allResponses = {};
  let students = {};

  function setupRequired() {
    $("#login-card").hidden = true;
    const box = $("#setup-message");
    box.hidden = false;
    box.innerHTML = "<h2>Firebase setup is still required</h2><p>Add the exact web-app configuration to <code>firebase-config.js</code>, enable Anonymous and Email/Password Authentication, create the teacher account, and deploy <code>database.rules.json</code> after replacing the teacher email placeholder.</p>";
  }

  function render() {
    const tasks = catalog.filter(task => task.week === activeWeek);
    const studentEntries = Object.entries(allResponses || {});
    const totalAnswered = studentEntries.reduce((sum, [, records]) => sum + Object.values(records || {}).filter(row => row.answered).length, 0);
    const autoTasks = tasks.filter(task => task.auto);
    const correctCount = studentEntries.reduce((sum, [, records]) => sum + Object.values(records || {}).filter(row => row.correct === true).length, 0);
    const possible = studentEntries.length * tasks.length;
    $("#metrics").innerHTML = `<div class="metric"><strong>${studentEntries.length}</strong><span>students started</span></div><div class="metric"><strong>${possible ? Math.round(totalAnswered / possible * 100) : 0}%</strong><span>class completion</span></div><div class="metric"><strong>${studentEntries.length * autoTasks.length ? Math.round(correctCount / (studentEntries.length * autoTasks.length) * 100) : 0}%</strong><span>objective answers correct</span></div>`;

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
      const updated = Math.max(0, ...Object.values(records || {}).map(row => Number(row.updatedAt) || 0));
      const name = students?.[uid]?.name || "Unnamed student";
      return `<tr><td><b>${escapeHtml(name)}</b></td><td>${answered}/${tasks.length} · ${tasks.length ? Math.round(answered / tasks.length * 100) : 0}%</td><td>${correct}/${autoTasks.length}</td><td>${updated ? new Date(updated).toLocaleString() : "—"}</td></tr>`;
    }).join("") || '<tr><td colspan="4">No student responses yet.</td></tr>';
  }

  function escapeHtml(value) { const node = document.createElement("span"); node.textContent = value; return node.innerHTML; }

  async function subscribe() {
    firebase.database().ref("students").on("value", snapshot => { students = snapshot.val() || {}; render(); });
    firebase.database().ref(`responses/${activeWeek}`).off();
    firebase.database().ref(`responses/${activeWeek}`).on("value", snapshot => { allResponses = snapshot.val() || {}; render(); });
  }

  if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey || !window.firebase) { setupRequired(); return; }
  firebase.initializeApp(window.FIREBASE_CONFIG);
  firebase.auth().onAuthStateChanged(user => {
    if (!user || user.isAnonymous) { $("#login-card").hidden = false; $("#dashboard").hidden = true; $("#teacher-account").innerHTML = ""; return; }
    $("#login-card").hidden = true; $("#dashboard").hidden = false;
    $("#teacher-account").innerHTML = `<div class="account-chip"><span>${escapeHtml(user.email || "Teacher")}</span><button id="sign-out">Sign out</button></div>`;
    $("#sign-out").addEventListener("click", () => firebase.auth().signOut());
    subscribe();
  });
  $("#teacher-login").addEventListener("submit", async event => {
    event.preventDefault(); $("#teacher-error").textContent = "";
    try { await firebase.auth().signInWithEmailAndPassword($("#teacher-email").value, $("#teacher-password").value); }
    catch (error) { $("#teacher-error").textContent = "Sign-in failed. Check the teacher account and Firebase Authentication setup."; }
  });
  $$(".dashboard-tabs button").forEach(button => button.addEventListener("click", () => {
    firebase.database().ref(`responses/${activeWeek}`).off(); activeWeek = button.dataset.week;
    $$(".dashboard-tabs button").forEach(item => item.classList.toggle("is-active", item === button)); subscribe();
  }));
})();
