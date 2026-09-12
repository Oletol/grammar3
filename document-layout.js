(() => {
  const catalog = window.TASK_CATALOG = window.TASK_CATALOG || [];
  const answers = window.GRAMMAR_ANSWERS = window.GRAMMAR_ANSWERS || {};

  const aggregateExercises = {
    k11: { week: "week2part1", title: "Workbook Exercise 11. Translate into English using an infinitive, without modal verbs" },
    k13: { week: "week2part1", title: "Workbook Exercise 13. Translate without beginning with it" },
    k14: { week: "week2part1", title: "Workbook Exercise 14. Rewrite without it" },
    e25: { week: "week2part1", title: "Exercise 2.5. Translate using the full or the bare infinitive" }
  };
  const exercisesWithoutResponses = new Set(["e31", "e32", "e510", "e511", "sp1", "sp2"]);
  const deletedExercises = new Set(["e33", "e43", "e58", "sp3", "e71"]);
  const supplementaryExercises = new Set(["e5mixed", "e5extra", "e59", "e81", "e82", "e83"]);

  function removeCatalogTasks(predicate) {
    for (let index = catalog.length - 1; index >= 0; index -= 1) {
      if (predicate(catalog[index])) catalog.splice(index, 1);
    }
  }

  Object.entries(aggregateExercises).forEach(([exercise, config]) => {
    removeCatalogTasks(task => task.exercise === exercise);
    catalog.push({
      id: `${config.week}.${exercise}.response`,
      week: config.week,
      exercise,
      title: config.title,
      label: "Combined response",
      auto: false
    });
  });

  removeCatalogTasks(task => exercisesWithoutResponses.has(task.exercise) || deletedExercises.has(task.exercise));

  const e24Sequences = [
    "- / -", "- / - / to", "- / to", "to", "to / -", "-", "- / -", "- / -",
    "- / to / -", "to", "- / -", "-", "to", "to", "to", "- / to", "to / -"
  ];
  removeCatalogTasks(task => task.exercise === "e24");
  let e24Gap = 0;
  e24Sequences.forEach(sequence => sequence.split("/").map(value => value.trim()).filter(Boolean).forEach(value => {
    e24Gap += 1;
    const id = `week2part1.e24.gap${e24Gap}`;
    answers[id] = [value.replace(/[–—]/g, "-")];
    catalog.push({
      id,
      week: "week2part1",
      exercise: "e24",
      title: "Exercise 2.4. Use to before the infinitives where possible",
      label: `Gap ${e24Gap}`,
      auto: true
    });
  }));

  catalog.forEach(task => {
    if (supplementaryExercises.has(task.exercise)) task.week = "week2supp";
    if (task.exercise === "e5mixed") task.title = "Exercise 5.1. Mixed functions of the infinitive";
    if (task.exercise === "e5extra") task.title = "Exercise 5.2. Mixed functions of the infinitive";
    if (task.exercise === "e59") task.title = "Exercise 5.9. Mixed functions of the infinitive";
  });

  function setExerciseTitle(section, title) {
    const titleNode = section?.querySelector(".ex-t");
    if (!titleNode) return;
    const source = titleNode.querySelector(".src-tag");
    titleNode.replaceChildren(document.createTextNode(title));
    if (source) titleNode.append(source);
  }

  function combineResponses(exerciseId) {
    const section = document.getElementById(exerciseId);
    if (!section) return;
    const items = [...section.querySelectorAll("ol.items > li.item")];
    items.forEach(item => item.querySelector(".open-response-wrap")?.remove());
    const box = document.createElement("div");
    box.className = "open-response-wrap section-notes combined-response";
    const id = `${aggregateExercises[exerciseId].week}.${exerciseId}.response`;
    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = `Write all ${items.length} answers here and number them 1–${items.length}.`;
    const textarea = document.createElement("textarea");
    textarea.className = "open-response combined-response-field";
    textarea.id = id;
    textarea.dataset.taskId = id;
    textarea.rows = Math.min(16, Math.max(8, items.length + 2));
    textarea.placeholder = `1. …\n2. …\n3. …`;
    box.append(label, textarea);
    section.append(box);
  }

  function makeE24Inline() {
    const section = document.getElementById("e24");
    if (!section) return;
    const rubric = section.querySelector(".rubric");
    if (rubric) rubric.innerHTML = "Choose <i>to</i> or – directly in every gap. Choose – when no particle is needed.";
    let gapNumber = 0;
    section.querySelectorAll("ol.items > li.item").forEach(item => {
      item.querySelector(".open-response-wrap")?.remove();
      [...item.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.includes(".....")).forEach(node => {
        const parts = node.textContent.split(".....");
        const fragment = document.createDocumentFragment();
        parts.forEach((part, index) => {
          fragment.append(document.createTextNode(part));
          if (index >= parts.length - 1) return;
          gapNumber += 1;
          const select = document.createElement("select");
          select.className = "choice-control e24-inline-choice";
          select.dataset.taskId = `week2part1.e24.gap${gapNumber}`;
          select.setAttribute("aria-label", `Exercise 2.4, gap ${gapNumber}: choose to or dash`);
          select.innerHTML = '<option value="">…</option><option value="to">to</option><option value="-">–</option>';
          fragment.append(select);
        });
        node.replaceWith(fragment);
      });
    });
  }

  function removeResponseBlocks(exerciseId) {
    document.getElementById(exerciseId)?.querySelectorAll(".open-response-wrap").forEach(node => node.remove());
  }

  function removeHeadingRange(container, startPrefix, endPrefix) {
    const children = [...container.children];
    const start = children.findIndex(node => node.matches("h1,h2") && node.textContent.trim().startsWith(startPrefix));
    if (start < 0) return;
    const end = children.findIndex((node, index) => index > start && node.matches("h1,h2") && node.textContent.trim().startsWith(endPrefix));
    children.slice(start, end < 0 ? children.length : end).forEach(node => node.remove());
  }

  function takeRange(container, startPrefix, endPrefix) {
    const children = [...container.children];
    const start = children.findIndex(node => node.matches("h1,h2") && node.textContent.trim().startsWith(startPrefix));
    if (start < 0) return [];
    const end = children.findIndex((node, index) => index > start && node.matches("h1,h2") && node.textContent.trim().startsWith(endPrefix));
    return children.slice(start, end < 0 ? children.length : end);
  }

  function moveSupplementaryContent() {
    const part1 = document.querySelector("#week2part1 .lesson-content");
    const part2 = document.querySelector("#week2part2 .lesson-content");
    const target = document.querySelector("#week2supp .lesson-content");
    if (!part1 || !part2 || !target) return;

    takeRange(part1, "Speaking 1.", "Part 3.").forEach(node => target.append(node));
    takeRange(part2, "Speaking 2.", "Part 5.").forEach(node => target.append(node));

    const part5Heading = [...part2.children].find(node => node.matches("h1") && node.textContent.trim().startsWith("Part 5."));
    if (part5Heading) {
      let comment = part5Heading.nextElementSibling;
      while (comment && !comment.matches("section")) {
        const next = comment.nextElementSibling;
        comment.remove();
        comment = next;
      }
      part5Heading.textContent = "Part 5. Mixed functions of the infinitive";
      target.append(part5Heading);
    }
    ["e5mixed", "e5extra", "e59", "e510", "e511"].forEach(id => {
      const section = document.getElementById(id);
      if (section) target.append(section);
    });

    removeHeadingRange(part2, "Part 6.", "Part 8.");
    takeRange(part2, "Part 8.", "__end__").forEach(node => target.append(node));

    const part8Lead = [...target.children].find(node => node.matches("p.lead") && node.previousElementSibling?.textContent.trim().startsWith("Part 8."));
    if (part8Lead) part8Lead.textContent = "Enter or select only the words that fill each gap. Do not rewrite the complete sentence.";
  }

  function simplifyFunctionPractice() {
    const mixed = document.getElementById("e5mixed");
    const extra = document.getElementById("e5extra");
    const exit = document.getElementById("e59");
    setExerciseTitle(mixed, "Exercise 5.1. Mixed functions of the infinitive");
    setExerciseTitle(extra, "Exercise 5.2. Mixed functions of the infinitive");
    setExerciseTitle(exit, "Exercise 5.9. Mixed functions of the infinitive");
    [mixed, extra, exit].forEach(section => {
      const rubric = section?.querySelector(".rubric");
      if (rubric) rubric.textContent = "Mixed functions of the infinitive.";
      section?.querySelector(".src-tag")?.remove();
      section?.querySelector(".just")?.remove();
      section?.querySelectorAll("[data-source-item]").forEach(item => item.removeAttribute("data-source-item"));
    });
  }

  function updateCaeInstructions() {
    const instructions = {
      e81: "Enter only the missing words in each gap, not the complete sentence. Keep the given key word unchanged and use three to six words, including it.",
      e82: "Enter only the one missing word in each gap, not the complete sentence.",
      e83: "Choose only the option that fills the gap; do not rewrite the complete sentence."
    };
    Object.entries(instructions).forEach(([id, text]) => {
      const rubric = document.querySelector(`#${id} .rubric`);
      if (rubric) rubric.textContent = text;
    });
  }

  window.prepareDocumentLayout = () => {
    Object.keys(aggregateExercises).forEach(combineResponses);
    makeE24Inline();
    exercisesWithoutResponses.forEach(removeResponseBlocks);
    deletedExercises.forEach(id => document.getElementById(id)?.remove());
    simplifyFunctionPractice();
    updateCaeInstructions();
    moveSupplementaryContent();
  };
})();
