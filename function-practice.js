(() => {
  const WEEK = "week2part2";
  const OPTIONS = [
    "subject",
    "real (notional) subject",
    "predicative",
    "marked adjective + infinitive pattern",
    "part of a compound verbal predicate",
    "part of a compound verbal modal predicate",
    "part of a compound verbal aspect predicate",
    "object",
    "part of a complex object",
    "complement of an adjective",
    "attribute",
    "adverbial modifier of purpose",
    "adverbial modifier of result",
    "adverbial modifier of attendant circumstances",
    "parenthesis"
  ];

  const S = "subject";
  const RS = "real (notional) subject";
  const PR = "predicative";
  const AP = "marked adjective + infinitive pattern";
  const CV = "part of a compound verbal predicate";
  const CM = "part of a compound verbal modal predicate";
  const CA = "part of a compound verbal aspect predicate";
  const O = "object";
  const CO = "part of a complex object";
  const ADJ = "complement of an adjective";
  const AT = "attribute";
  const PU = "adverbial modifier of purpose";
  const RE = "adverbial modifier of result";
  const AC = "adverbial modifier of attendant circumstances";
  const PA = "parenthesis";

  // Each item contains one entry per independently classified infinitive group.
  // An entry may contain two accepted analyses where the source explicitly allows both.
  const BANK = {
    e51: [[[S]], [[S]], [[RS]], [[S]], [[S]], [[RS]], [[RS]]],
    e52: [[[S], [PR]], [[AP]], [[AP]], [[AP]], [[AP]], [[AP]], [[PR]], [[AT], [PR]], [[AP]], [[AP]], [[AP]], [[AP]], [[AP]], [[AP]]],
    e53: [[[CA]], [[CM]], [[CA]], [[CA]], [[O]], [[CA]], [[ADJ]], [[O]], [[CA]], [[CA]]],
    e54: [[[CO]], [[O]], [[CM], [PU]], [[CA]], [[CO]], [[O]], [[O]]],
    e55: Array.from({ length: 16 }, (_, index) => index === 10 ? [[AT, CO]] : [[AT]]),
    e56: Array.from({ length: 15 }, () => [[RE]]),
    e57: Array.from({ length: 8 }, (_, index) => index === 5 ? [[AC, PU]] : [[AC]])
  };

  const MAIN_IDS = [
    "e56.10", "e51.3", "e55.1", "e53.2", "e57.5",
    "e52.2", "e54.1", "e51.1", "e56.1", "e53.5",
    "e55.10", "e57.3", "e52.1", "e54.2", "e51.4",
    "e56.13", "e53.1", "e55.12", "e57.1", "e52.7"
  ];

  const E41 = [
    [[S]], [[PR]], [[S]], [[CM]], [[RS]], [[PR]], [[CM]], [[CA]],
    [[CA], [CM]], [[PR]], [[CA]], [[RS]], [[CM]], [[CM]], [[CA]], [[CM]]
  ];

  const E42 = [
    [[S], [PR]], [[PU]], [[S], [PR]], [[PU], [CM]], [[AT]], [[CM]],
    [[PR]], [[O]], [[CO]], [[RE]], [[CA]], [[PU]], [[RE]], [[PA], [AT]],
    [[AC]], [[CA], [AP]], [[PU]], [[AT]], [[PU], [CM], [CA]], [[RS]], [[RS]], [[RS]]
  ];

  const E59 = [
    [[S]], [[PU]], [[AT]], [[CV]], [[PA]], [[AT]], [[CM]], [[RE]], [[PR]],
    [[PU, AC]], [[AT]], [[O]], [[PA]], [[AT]], [[RS]], [[CA]], [[AC]],
    [[PA], [RE]], [[PR]], [[AT]]
  ];

  const answers = window.GRAMMAR_ANSWERS = window.GRAMMAR_ANSWERS || {};
  const catalog = window.TASK_CATALOG = window.TASK_CATALOG || [];

  const removeOldTasks = () => {
    const replaced = /^week2part2\.(?:e41|e51|e52|e53|e54|e55|e56|e57|e59)\.open\d+$/;
    for (let index = catalog.length - 1; index >= 0; index -= 1) {
      if (replaced.test(catalog[index].id)) catalog.splice(index, 1);
    }
  };

  function addTask(id, exercise, title, label, accepted) {
    answers[id] = accepted;
    catalog.push({ id, week: WEEK, exercise, title, label, auto: true });
  }

  function registerGroups(prefix, exercise, title, groups, itemLabel) {
    groups.forEach((controls, itemIndex) => controls.forEach((accepted, controlIndex) => {
      const id = `${WEEK}.${prefix}.item${itemIndex + 1}.function${controlIndex + 1}`;
      const suffix = controls.length > 1 ? ` · infinitive ${controlIndex + 1}` : "";
      addTask(id, exercise, title, `${itemLabel} ${itemIndex + 1}${suffix}`, accepted);
    }));
  }

  removeOldTasks();

  Object.entries(BANK).forEach(([source, groups]) => groups.forEach((controls, itemIndex) => {
    const sourceId = `${source}.${itemIndex + 1}`;
    const main = MAIN_IDS.includes(sourceId);
    const prefix = main ? "e5mixed" : "e5extra";
    const title = main
      ? "Mixed functions of the infinitive · 20 sentences"
      : "Additional mixed practice · functions of the infinitive";
    controls.forEach((accepted, controlIndex) => {
      const id = `${WEEK}.${prefix}.${source}_${itemIndex + 1}.function${controlIndex + 1}`;
      const suffix = controls.length > 1 ? ` · infinitive ${controlIndex + 1}` : "";
      addTask(id, prefix, title, `Sentence ${sourceId}${suffix}`, accepted);
    });
  }));

  registerGroups("e41auto", "e41", "Exercise 4.1. State the function of the infinitives", E41, "Item");
  registerGroups("e42auto", "e42", "Exercise 4.2. Function of the infinitives", E42, "Item");
  registerGroups("e59auto", "e59", "Exercise 5.9. Mixed identification: the exit test", E59, "Item");

  function makeSelect(taskId, labelText, total) {
    const label = document.createElement("label");
    label.className = "function-choice";
    const caption = document.createElement("span");
    caption.textContent = total > 1 ? labelText : "Function";
    const select = document.createElement("select");
    select.className = "choice-control function-select";
    select.dataset.taskId = taskId;
    select.setAttribute("aria-label", labelText);
    select.innerHTML = '<option value="">Choose the function…</option>' + OPTIONS.map(option => `<option value="${option}">${option}</option>`).join("");
    label.append(caption, select);
    return label;
  }

  function addChoices(item, prefix, itemNumber, controls, labelPrefix = "Infinitive") {
    item.querySelector(".open-response-wrap")?.remove();
    const box = document.createElement("div");
    box.className = "function-choice-row";
    controls.forEach((_, controlIndex) => {
      const id = `${WEEK}.${prefix}.item${itemNumber}.function${controlIndex + 1}`;
      box.append(makeSelect(id, `${labelPrefix} ${controlIndex + 1}`, controls.length));
    });
    item.append(box);
  }

  function enhanceExisting(exerciseId, prefix, groups, keepWrittenResponse = false) {
    const section = document.getElementById(exerciseId);
    if (!section) return;
    section.querySelectorAll("ol.items > li.item").forEach((item, itemIndex) => {
      const written = item.querySelector(".open-response-wrap");
      if (written && keepWrittenResponse) {
        written.querySelector("textarea")?.setAttribute("placeholder", "Comment on the infinitive form / give your reason…");
      } else {
        written?.remove();
      }
      const box = document.createElement("div");
      box.className = "function-choice-row";
      groups[itemIndex].forEach((_, controlIndex) => {
        const id = `${WEEK}.${prefix}.item${itemIndex + 1}.function${controlIndex + 1}`;
        box.append(makeSelect(id, `Infinitive ${controlIndex + 1}`, groups[itemIndex].length));
      });
      if (written && keepWrittenResponse) item.insertBefore(box, written);
      else item.append(box);
    });
  }

  function buildMixedPractice() {
    const sourceItems = new Map();
    Object.keys(BANK).forEach(source => {
      const section = document.getElementById(source);
      section?.querySelectorAll("ol.items > li.item").forEach((item, index) => {
        const clone = item.cloneNode(true);
        clone.querySelector(".open-response-wrap")?.remove();
        sourceItems.set(`${source}.${index + 1}`, clone);
      });
    });
    if (!sourceItems.size) return;

    const allIds = [...sourceItems.keys()];
    const extraIds = allIds.filter(id => !MAIN_IDS.includes(id));
    // Fixed pseudo-random order: mixed for students, stable for saved answers and statistics.
    extraIds.sort((a, b) => {
      const score = value => [...value].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 7), 0) % 97;
      return score(a) - score(b) || a.localeCompare(b);
    });

    const makeSection = (id, title, sourceTag, rubric, ids, prefix) => {
      const section = document.createElement("section");
      section.className = "ex";
      section.id = id;
      section.innerHTML = `<div class="ex-h"><div class="ex-t">${title}<span class="src-tag">${sourceTag}</span></div></div><p class="rubric">${rubric}</p><ol class="items"></ol>`;
      const list = section.querySelector("ol");
      ids.forEach(sourceId => {
        const item = sourceItems.get(sourceId);
        const [source, numberText] = sourceId.split(".");
        const controls = BANK[source][Number(numberText) - 1];
        item.dataset.sourceItem = `${source.replace("e5", "5.")}, item ${numberText}`;
        const box = document.createElement("div");
        box.className = "function-choice-row";
        controls.forEach((_, controlIndex) => {
          const taskId = `${WEEK}.${prefix}.${source}_${numberText}.function${controlIndex + 1}`;
          box.append(makeSelect(taskId, `Infinitive ${controlIndex + 1}`, controls.length));
        });
        item.append(box);
        list.append(item);
      });
      return section;
    };

    const first = document.getElementById("e51");
    const main = makeSection(
      "e5mixed",
      "Exercise 5.1. Mixed functions of the infinitive · 20 sentences",
      "[mixed selection from Саакян, exx. 503 A, 504 A, 505, 507 A, 508 A, 515 A and 516 A]",
      "Choose the function of the infinitive in each sentence. The sentences are mixed, so the heading no longer gives away the answer.",
      MAIN_IDS,
      "e5mixed"
    );
    const extra = makeSection(
      "e5extra",
      "Additional practice. Mixed functions of the infinitive",
      `[the remaining ${extraIds.length} sentences from Exercises 5.1–5.7]`,
      "Extra practice: the remaining source sentences are also mixed and checked automatically.",
      extraIds,
      "e5extra"
    );
    first.before(main, extra);
    Object.keys(BANK).forEach(source => document.getElementById(source)?.remove());
  }

  window.prepareFunctionExercises = () => {
    buildMixedPractice();
    enhanceExisting("e41", "e41auto", E41);
    const e41Rubric = document.querySelector("#e41 .rubric");
    if (e41Rubric) e41Rubric.textContent = "Choose the function of each infinitive. Your choice is checked automatically.";
    enhanceExisting("e42", "e42auto", E42, true);
    const e42Rubric = document.querySelector("#e42 .rubric");
    if (e42Rubric) e42Rubric.textContent = "Choose each infinitive's function from the menu; use the text field to comment on its form and explain your choice.";
    enhanceExisting("e59", "e59auto", E59);
    const e59Rubric = document.querySelector("#e59 .rubric");
    if (e59Rubric) e59Rubric.textContent = "Choose the function of each infinitive. The result is checked automatically.";
  };
})();
