const STORAGE_KEY = "account_onboarding_state_v1";

const roleConfig = {
  frontend: {
    label: "Frontend Developer",
    required: ["HTML & CSS", "JavaScript", "React", "Git"],
    suggested: [
      "TypeScript",
      "Tailwind CSS",
      "Next.js",
      "REST APIs",
      "Accessibility",
      "Testing",
    ],
  },
  backend: {
    label: "Backend Developer",
    required: ["Node.js", "Python", "SQL", "REST APIs", "Git"],
    suggested: [
      "PostgreSQL",
      "Docker",
      "Authentication",
      "Redis",
      "System Design",
      "FastAPI",
    ],
  },
  fullstack: {
    label: "Full-Stack Developer",
    required: ["HTML & CSS", "JavaScript", "React", "Node.js", "SQL", "Git"],
    suggested: [
      "TypeScript",
      "Python",
      "Docker",
      "REST APIs",
      "Cloud Deployment",
      "CI/CD",
    ],
  },
  designer: {
    label: "UI/UX Designer",
    required: ["Figma", "UI/UX Design", "Wireframing", "Prototyping"],
    suggested: [
      "Design Systems",
      "User Research",
      "Typography",
      "Accessibility",
      "Usability Testing",
    ],
  },
  data_analyst: {
    label: "Data Analyst",
    required: ["SQL", "Python", "Excel", "Data Visualization"],
    suggested: [
      "Pandas",
      "Power BI",
      "Tableau",
      "Statistics",
      "Data Cleaning",
      "A/B Testing",
    ],
  },
  devops: {
    label: "DevOps Engineer",
    required: ["Linux", "Docker", "CI/CD", "Cloud Computing", "Git"],
    suggested: [
      "Kubernetes",
      "Terraform",
      "AWS",
      "Bash Scripting",
      "Monitoring",
      "Networking",
    ],
  },
  manager: {
    label: "Product Manager",
    required: ["Product Strategy", "Agile", "Roadmapping", "Communication"],
    suggested: [
      "User Stories",
      "Stakeholder Alignment",
      "Jira",
      "A/B Testing",
      "Prioritization",
      "Metrics",
    ],
  },
  qa_engineer: {
    label: "QA / Test Engineer",
    required: ["Test Automation", "API Testing", "Bug Tracking", "Git"],
    suggested: [
      "Selenium",
      "Playwright",
      "Cypress",
      "Postman",
      "Performance Testing",
      "CI/CD",
    ],
  },
};

const generalSkillPool = [
  "JavaScript",
  "Python",
  "SQL",
  "Figma",
  "Project Management",
  "Agile",
  "Communication",
  "Data Analysis",
  "Excel",
  "Git",
  "Cloud Computing",
  "Public Speaking",
  "Problem Solving",
];

const ratingLabels = {
  1: "Beginner",
  2: "Basic",
  3: "Intermediate",
  4: "Advanced",
  5: "Expert",
};

// State
let currentStepIndex = 0;
let isSubmitted = false;
let activeFlow = ["stepProfile", "stepSkills", "stepRating"];
let customRequiredSkills = [];
let selectedSkills = [];
let skillRatings = {};

// Elements
const form = document.getElementById("accountForm");
const stepIndicator = document.getElementById("stepIndicator");
const nameInput = document.getElementById("name");
const roleSelect = document.getElementById("role");
const otherInput = document.getElementById("other");

const reqSkillInput = document.getElementById("reqSkillInput");
const addReqSkillBtn = document.getElementById("addReqSkillBtn");
const reqSuggestionsBox = document.getElementById("reqSuggestionsBox");
const customReqBox = document.getElementById("customReqBox");
const emptyCustomReqHint = document.getElementById("emptyCustomReqHint");
const customReqGroup = document.getElementById("customReqGroup");

const roleRequiredBox = document.getElementById("roleRequiredBox");
const roleBadgeName = document.getElementById("roleBadgeName");
const addMissingReqBtn = document.getElementById("addMissingReqBtn");
const missingBanner = document.getElementById("missingBanner");
const missingBannerText = document.getElementById("missingBannerText");

const skillInput = document.getElementById("skillInput");
const addSkillBtn = document.getElementById("addSkillBtn");
const suggestionsBox = document.getElementById("suggestionsBox");
const selectedSkillsBox = document.getElementById("selectedSkillsBox");
const emptySkillsHint = document.getElementById("emptySkillsHint");
const skillsGroup = document.getElementById("skillsGroup");

const ratingList = document.getElementById("ratingList");
const ratingErrorMsg = document.getElementById("ratingErrorMsg");
const summaryCard = document.getElementById("summaryCard");
const copyJsonBtn = document.getElementById("copyJsonBtn");

// --- LocalStorage Persistence ---
function saveState() {
  const snapshot = {
    name: nameInput.value,
    role: roleSelect.value,
    otherRole: otherInput.value,
    currentStepIndex,
    isSubmitted,
    customRequiredSkills,
    selectedSkills,
    skillRatings,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (err) {
    console.warn("Could not save state to localStorage:", err);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);

    nameInput.value = saved.name || "";
    roleSelect.value = saved.role || "";
    otherInput.value = saved.otherRole || "";
    otherInput.required = roleSelect.value === "others";

    customRequiredSkills = Array.isArray(saved.customRequiredSkills)
      ? saved.customRequiredSkills
      : [];
    selectedSkills = Array.isArray(saved.selectedSkills)
      ? saved.selectedSkills
      : [];
    skillRatings =
      saved.skillRatings && typeof saved.skillRatings === "object"
        ? saved.skillRatings
        : {};

    updateFlowForRole(false);

    const maxIndex = activeFlow.length - 1;
    currentStepIndex = Math.min(
      Math.max(0, saved.currentStepIndex || 0),
      maxIndex,
    );
    isSubmitted = Boolean(saved.isSubmitted);

    if (isSubmitted) {
      renderSummaryCard(false);
    } else {
      goToStepIndex(currentStepIndex, false);
    }
    return true;
  } catch (err) {
    console.warn("Could not restore state from localStorage:", err);
    return false;
  }
}

function buildExportPayload() {
  const required = getCurrentRoleRequired();
  const missing = getMissingRequiredSkills();

  return {
    name: nameInput.value.trim(),
    role:
      roleSelect.value === "others"
        ? otherInput.value.trim()
        : roleConfig[roleSelect.value]?.label || roleSelect.value,
    roleType: roleSelect.value === "others" ? "custom" : "preset",
    requiredSkillsForRole: required,
    missingRequiredSkills: missing,
    coverage: {
      matched: required.length - missing.length,
      totalRequired: required.length,
    },
    ratedSkills: selectedSkills.map((skill) => ({
      skill,
      isRequired: required.some((r) => r.toLowerCase() === skill.toLowerCase()),
      rating: skillRatings[skill] || null,
      level: skillRatings[skill] ? ratingLabels[skillRatings[skill]] : null,
    })),
    exportedAt: new Date().toISOString(),
  };
}

// --- Step Navigation & Dynamic Stepper ---
function updateFlowForRole(persist = true) {
  const isCustom = roleSelect.value === "others";
  activeFlow = isCustom
    ? ["stepProfile", "stepCustomReq", "stepSkills", "stepRating"]
    : ["stepProfile", "stepSkills", "stepRating"];
  renderStepper();
  if (persist) saveState();
}

// Track how many dots are currently rendered so transitions aren't wiped out
let renderedFlowLength = 0;

let stepperInitialized = false;

function renderStepper(completedAll = false) {
  // Build all 4 dots and 3 lines once so Step 4 can animate in/out smoothly
  if (!stepperInitialized) {
    stepIndicator.innerHTML = "";
    for (let idx = 0; idx < 4; idx++) {
      const dot = document.createElement("div");
      dot.className = "step-dot";
      dot.textContent = idx + 1;
      stepIndicator.appendChild(dot);

      if (idx < 3) {
        const line = document.createElement("div");
        line.className = "step-line";
        stepIndicator.appendChild(line);
      }
    }
    stepperInitialized = true;
  }

  const isFourStepFlow = activeFlow.length === 4;
  const dots = stepIndicator.querySelectorAll(".step-dot");
  const lines = stepIndicator.querySelectorAll(".step-line");

  dots.forEach((dot, idx) => {
    const isFourthHidden = idx === 3 && !isFourStepFlow;
    dot.classList.toggle("is-hidden", isFourthHidden);

    const isActive = completedAll || idx <= currentStepIndex;
    dot.classList.toggle("active", isActive);
    dot.textContent = completedAll || idx < currentStepIndex ? "✓" : idx + 1;
  });

  lines.forEach((line, idx) => {
    const isThirdLineHidden = idx === 2 && !isFourStepFlow;
    line.classList.toggle("is-hidden", isThirdLineHidden);

    const lineActive = completedAll || idx < currentStepIndex;
    line.classList.toggle("active", lineActive);
  });
}

function applyStepAnimation(element, direction) {
  element.classList.remove("slide-next", "slide-prev");
  void element.offsetWidth; // Force reflow so repeated clicks retrigger animation
  if (direction === "next") element.classList.add("slide-next");
  if (direction === "prev") element.classList.add("slide-prev");
}

document.querySelectorAll('[data-nav="prev"]').forEach((btn) => {
  btn.addEventListener("click", () => {
    if (currentStepIndex > 0) goToStepIndex(currentStepIndex - 1);
  });
});

// --- Step 1: Profile Validation & Persistence ---
nameInput.addEventListener("input", saveState);
otherInput.addEventListener("input", saveState);

roleSelect.addEventListener("change", () => {
  const isOther = roleSelect.value === "others";
  otherInput.required = isOther;
  if (!isOther) {
    otherInput.value = "";
    clearFieldError(otherInput);
  }
  updateFlowForRole(true);
});

function validateField(field) {
  const group = field.closest(".form-group");
  const errorSpan = group.querySelector(".error-msg");
  if (field.required && !field.value.trim()) {
    group.classList.add("has-error");
    errorSpan.textContent = "This field is required.";
    return false;
  }
  clearFieldError(field);
  return true;
}

function clearFieldError(field) {
  const group = field.closest(".form-group");
  group.classList.remove("has-error");
  group.querySelector(".error-msg").textContent = "";
}

document
  .getElementById("stepProfile")
  .querySelectorAll("input, select")
  .forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.closest(".form-group").classList.contains("has-error")) {
        validateField(field);
      }
    });
  });

document.getElementById("profileNextBtn").addEventListener("click", () => {
  let valid = true;
  document
    .getElementById("stepProfile")
    .querySelectorAll("input, select")
    .forEach((f) => {
      if (!validateField(f)) valid = false;
    });
  if (valid) {
    updateFlowForRole(false);
    goToStepIndex(1);
  }
});

// --- Step 2 (Custom Role Only): Define Required Skills ---
function renderCustomReqSuggestions(filterText = "") {
  const query = filterText.trim().toLowerCase();
  reqSuggestionsBox.innerHTML = "";

  const available = generalSkillPool.filter(
    (s) =>
      !customRequiredSkills.some((c) => c.toLowerCase() === s.toLowerCase()) &&
      s.toLowerCase().includes(query),
  );

  if (available.length === 0) {
    const hint = document.createElement("span");
    hint.className = "empty-hint";
    hint.textContent = query
      ? `Press "Add" to require "${filterText.trim()}".`
      : "All common skills added.";
    reqSuggestionsBox.appendChild(hint);
    return;
  }

  available.forEach((skill) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "skill-chip suggestion-chip";
    chip.innerHTML = `<span>+</span> ${skill}`;
    chip.addEventListener("click", () => addCustomRequiredSkill(skill));
    reqSuggestionsBox.appendChild(chip);
  });
}

function renderCustomReqSelected() {
  customReqBox.querySelectorAll(".selected-chip").forEach((el) => el.remove());
  emptyCustomReqHint.hidden = customRequiredSkills.length > 0;

  customRequiredSkills.forEach((skill) => {
    const chip = document.createElement("span");
    chip.className = "skill-chip selected-chip";
    chip.textContent = skill;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-skill";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      customRequiredSkills = customRequiredSkills.filter((s) => s !== skill);
      renderCustomReqSelected();
      renderCustomReqSuggestions(reqSkillInput.value);
      saveState();
    });

    chip.appendChild(removeBtn);
    customReqBox.appendChild(chip);
  });
}

function addCustomRequiredSkill(raw) {
  const clean = raw.trim();
  if (!clean) return;
  if (
    !customRequiredSkills.some((s) => s.toLowerCase() === clean.toLowerCase())
  ) {
    customRequiredSkills.push(clean);
    customReqGroup.classList.remove("has-error");
    customReqGroup.querySelector(".error-msg").textContent = "";
    saveState();
  }
  reqSkillInput.value = "";
  renderCustomReqSelected();
  renderCustomReqSuggestions();
  reqSkillInput.focus();
}

reqSkillInput.addEventListener("input", () =>
  renderCustomReqSuggestions(reqSkillInput.value),
);
reqSkillInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addCustomRequiredSkill(reqSkillInput.value);
  }
});
addReqSkillBtn.addEventListener("click", () =>
  addCustomRequiredSkill(reqSkillInput.value),
);

document.getElementById("customReqNextBtn").addEventListener("click", () => {
  if (customRequiredSkills.length === 0) {
    customReqGroup.classList.add("has-error");
    customReqGroup.querySelector(".error-msg").textContent =
      "Add at least one required skill for this role.";
    reqSkillInput.focus();
    return;
  }
  goToStepIndex(currentStepIndex + 1);
});

// --- Step 2 / 3: Your Skills + Missing Required Highlight ---
function getCurrentRoleRequired() {
  if (roleSelect.value === "others") return customRequiredSkills;
  return roleConfig[roleSelect.value]?.required || [];
}

function getCurrentRoleSuggested() {
  if (roleSelect.value === "others") return generalSkillPool;
  return roleConfig[roleSelect.value]?.suggested || generalSkillPool;
}

function getMissingRequiredSkills() {
  const required = getCurrentRoleRequired();
  return required.filter(
    (req) =>
      !selectedSkills.some((sel) => sel.toLowerCase() === req.toLowerCase()),
  );
}

function updateMissingSkillsBanner() {
  const missing = getMissingRequiredSkills();
  addMissingReqBtn.hidden = missing.length === 0;

  if (missing.length > 0) {
    missingBanner.hidden = false;
    missingBannerText.innerHTML = `<strong>Missing required (${missing.length}):</strong> ${missing.join(", ")}`;
  } else {
    missingBanner.hidden = true;
    missingBannerText.textContent = "";
  }
}

addMissingReqBtn.addEventListener("click", () => {
  getMissingRequiredSkills().forEach((skill) => {
    if (!selectedSkills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      selectedSkills.push(skill);
    }
  });
  skillsGroup.classList.remove("has-error");
  skillsGroup.querySelector(".error-msg").textContent = "";
  saveState();
  renderSelectedSkills();
  renderRoleRequiredSkills();
  renderSkillSuggestions(skillInput.value);
});

function renderRoleRequiredSkills() {
  const required = getCurrentRoleRequired();
  roleBadgeName.textContent =
    roleSelect.value === "others"
      ? otherInput.value.trim() || "Custom Role"
      : roleConfig[roleSelect.value]?.label || "Role";

  roleRequiredBox.innerHTML = "";
  required.forEach((skill) => {
    const isAdded = selectedSkills.some(
      (s) => s.toLowerCase() === skill.toLowerCase(),
    );
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `skill-chip required-chip ${isAdded ? "is-added" : "is-missing"}`;
    chip.innerHTML = isAdded ? `✓ ${skill}` : `<span>+</span> ${skill}`;
    chip.title = isAdded
      ? "Added to your skills"
      : "Required skill — click to add";
    chip.addEventListener("click", () => {
      if (!isAdded) addSelectedSkill(skill);
    });
    roleRequiredBox.appendChild(chip);
  });

  updateMissingSkillsBanner();
}

function renderSkillSuggestions(filterText = "") {
  const query = filterText.trim().toLowerCase();
  const required = getCurrentRoleRequired();
  const pool = getCurrentRoleSuggested();
  suggestionsBox.innerHTML = "";

  const available = pool.filter(
    (skill) =>
      !selectedSkills.some((s) => s.toLowerCase() === skill.toLowerCase()) &&
      !required.some((r) => r.toLowerCase() === skill.toLowerCase()) &&
      skill.toLowerCase().includes(query),
  );

  if (available.length === 0) {
    const msg = document.createElement("span");
    msg.className = "empty-hint";
    msg.textContent = query
      ? `No preset match — press "Add" to include "${filterText.trim()}".`
      : "All suggested skills added!";
    suggestionsBox.appendChild(msg);
    return;
  }

  available.forEach((skill) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "skill-chip suggestion-chip";
    chip.innerHTML = `<span>+</span> ${skill}`;
    chip.addEventListener("click", () => addSelectedSkill(skill));
    suggestionsBox.appendChild(chip);
  });
}

function renderSelectedSkills() {
  selectedSkillsBox
    .querySelectorAll(".selected-chip")
    .forEach((el) => el.remove());
  emptySkillsHint.hidden = selectedSkills.length > 0;

  selectedSkills.forEach((skill) => {
    const chip = document.createElement("span");
    chip.className = "skill-chip selected-chip";
    chip.textContent = skill;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-skill";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      selectedSkills = selectedSkills.filter((s) => s !== skill);
      delete skillRatings[skill];
      saveState();
      renderSelectedSkills();
      renderRoleRequiredSkills();
      renderSkillSuggestions(skillInput.value);
    });

    chip.appendChild(removeBtn);
    selectedSkillsBox.appendChild(chip);
  });
}

function addSelectedSkill(raw) {
  const clean = raw.trim();
  if (!clean) return;

  if (!selectedSkills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
    selectedSkills.push(clean);
    skillsGroup.classList.remove("has-error");
    skillsGroup.querySelector(".error-msg").textContent = "";
    saveState();
  }

  skillInput.value = "";
  renderSelectedSkills();
  renderRoleRequiredSkills();
  renderSkillSuggestions();
  skillInput.focus();
}

skillInput.addEventListener("input", () =>
  renderSkillSuggestions(skillInput.value),
);
skillInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addSelectedSkill(skillInput.value);
  }
});
addSkillBtn.addEventListener("click", () => addSelectedSkill(skillInput.value));

document.getElementById("skillsNextBtn").addEventListener("click", () => {
  if (selectedSkills.length === 0) {
    skillsGroup.classList.add("has-error");
    skillsGroup.querySelector(".error-msg").textContent =
      "Please select or add at least one skill.";
    skillInput.focus();
    return;
  }
  goToStepIndex(currentStepIndex + 1);
});

// --- Rating Step ---
function renderRatingStep() {
  const required = getCurrentRoleRequired();
  ratingList.innerHTML = "";
  ratingErrorMsg.textContent = "";

  selectedSkills.forEach((skill) => {
    const isRequired = required.some(
      (r) => r.toLowerCase() === skill.toLowerCase(),
    );
    const currentVal = skillRatings[skill] || 0;

    const row = document.createElement("div");
    row.className = "rating-row";

    const header = document.createElement("div");
    header.className = "rating-row-header";
    header.innerHTML = `
            <span class="rating-skill-name">
              ${skill}
              ${isRequired ? '<span class="req-tag">Required</span>' : ""}
            </span>
            <span class="rating-level-text">${currentVal ? ratingLabels[currentVal] : "Not rated"}</span>
          `;

    const buttonsWrap = document.createElement("div");
    buttonsWrap.className = "rating-buttons";

    for (let score = 1; score <= 5; score++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `rate-btn ${currentVal >= score ? "filled" : ""}`;
      btn.textContent = score;
      btn.setAttribute("aria-label", `Rate ${skill} ${score} out of 5`);
      btn.addEventListener("click", () => {
        skillRatings[skill] = score;
        ratingErrorMsg.textContent = "";
        saveState();
        renderRatingStep();
      });
      buttonsWrap.appendChild(btn);
    }

    row.appendChild(header);
    row.appendChild(buttonsWrap);
    ratingList.appendChild(row);
  });
}

// --- Final Submit -> Render Summary Card ---
function renderSummaryCard(persist = true) {
  const payload = buildExportPayload();
  const required = payload.requiredSkillsForRole;
  const missing = payload.missingRequiredSkills;

  document.getElementById("summaryName").textContent = payload.name;
  document.getElementById("summaryRole").textContent = payload.role;

  // Coverage Pill
  const coveragePill = document.getElementById("coveragePill");
  coveragePill.textContent = `${payload.coverage.matched} / ${payload.coverage.totalRequired} Required`;
  coveragePill.classList.toggle("is-complete", missing.length === 0);
  coveragePill.classList.toggle("is-partial", missing.length > 0);

  // Missing Required Skills Block
  const summaryMissingWrap = document.getElementById("summaryMissingWrap");
  const summaryMissingChips = document.getElementById("summaryMissingChips");
  summaryMissingChips.innerHTML = "";

  if (missing.length > 0) {
    summaryMissingWrap.hidden = false;
    missing.forEach((skill) => {
      const pill = document.createElement("span");
      pill.className = "missing-pill";
      pill.textContent = skill;
      summaryMissingChips.appendChild(pill);
    });
  } else {
    summaryMissingWrap.hidden = true;
  }

  // Rated Skills List
  const summarySkillsList = document.getElementById("summarySkillsList");
  summarySkillsList.innerHTML = "";

  payload.ratedSkills.forEach((itemData) => {
    const item = document.createElement("div");
    item.className = "summary-skill-item";
    item.innerHTML = `
            <span class="summary-skill-title">
              ${itemData.skill}
              ${itemData.isRequired ? '<span class="req-tag">Required</span>' : ""}
            </span>
            <span class="summary-skill-score">
              ${itemData.rating}/5 · ${itemData.level}
            </span>
          `;
    summarySkillsList.appendChild(item);
  });

  isSubmitted = true;
  form.hidden = true;
  summaryCard.hidden = false;
  renderStepper(true);

  if (persist) saveState();
}

// Copy JSON Button with Fallback
copyJsonBtn.addEventListener("click", async () => {
  const jsonString = JSON.stringify(buildExportPayload(), null, 2);

  try {
    await navigator.clipboard.writeText(jsonString);
  } catch {
    const tempArea = document.createElement("textarea");
    tempArea.value = jsonString;
    document.body.appendChild(tempArea);
    tempArea.select();
    document.execCommand("copy");
    tempArea.remove();
  }

  copyJsonBtn.textContent = "Copied!";
  copyJsonBtn.classList.add("is-copied");
  setTimeout(() => {
    copyJsonBtn.textContent = "Copy JSON";
    copyJsonBtn.classList.remove("is-copied");
  }, 2000);
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);

    nameInput.value = saved.name || "";
    roleSelect.value = saved.role || "";
    otherInput.value = saved.otherRole || "";
    otherInput.required = roleSelect.value === "others";

    customRequiredSkills = Array.isArray(saved.customRequiredSkills)
      ? saved.customRequiredSkills
      : [];
    selectedSkills = Array.isArray(saved.selectedSkills)
      ? saved.selectedSkills
      : [];
    skillRatings =
      saved.skillRatings && typeof saved.skillRatings === "object"
        ? saved.skillRatings
        : {};

    updateFlowForRole(false);

    // If returning from dashboard to edit, open on Step 1 (or saved step)
    const maxIndex = activeFlow.length - 1;
    currentStepIndex = saved.isSubmitted
      ? 0
      : Math.min(Math.max(0, saved.currentStepIndex || 0), maxIndex);
    isSubmitted = Boolean(saved.isSubmitted);

    goToStepIndex(currentStepIndex, false);
    return true;
  } catch (err) {
    console.warn("Could not restore state from localStorage:", err);
    return false;
  }
}

// Keep ONLY this single goToStepIndex function (remove the second duplicate one)
function goToStepIndex(newIndex, persist = true, direction = null) {
  const resolvedDirection =
    direction ||
    (newIndex > currentStepIndex
      ? "next"
      : newIndex < currentStepIndex
        ? "prev"
        : "next");

  currentStepIndex = newIndex;
  summaryCard.hidden = true;
  form.hidden = false;

  const targetId = activeFlow[currentStepIndex];
  document.querySelectorAll("#accountForm .form-step").forEach((sec) => {
    const isTarget = sec.id === targetId;
    sec.hidden = !isTarget;
    if (isTarget) {
      applyStepAnimation(sec, resolvedDirection);
    }
  });

  renderStepper();

  if (targetId === "stepCustomReq") {
    document.getElementById("customRoleLabel").textContent =
      otherInput.value.trim() || "your custom role";
    renderCustomReqSuggestions();
    renderCustomReqSelected();
    reqSkillInput.focus();
  } else if (targetId === "stepSkills") {
    renderRoleRequiredSkills();
    renderSkillSuggestions();
    renderSelectedSkills();
    skillInput.focus();
  } else if (targetId === "stepRating") {
    renderRatingStep();
  }

  if (persist) saveState();
}

// Redirect to dashboard.html on final submit
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const unrated = selectedSkills.filter((s) => !skillRatings[s]);
  if (unrated.length > 0) {
    ratingErrorMsg.textContent = `Please rate all skills (${unrated.length} remaining).`;
    return;
  }

  isSubmitted = true;
  renderStepper(true);
  saveState();

  // Navigate to the dashboard after a brief moment so the final checkmark animates
  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 250);
});

document.getElementById("editSummaryBtn").addEventListener("click", () => {
  goToStepIndex(currentStepIndex, true);
});

document.getElementById("resetFormBtn").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  form.reset();
  customRequiredSkills = [];
  selectedSkills = [];
  skillRatings = {};
  isSubmitted = false;
  otherInput.required = false;
  updateFlowForRole(false);
  goToStepIndex(0, false);
});

// Boot: restore saved state or render default step 1
if (!loadState()) {
  renderStepper();
}
