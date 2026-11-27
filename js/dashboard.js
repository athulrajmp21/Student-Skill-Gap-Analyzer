const STORAGE_KEY = "account_onboarding_state_v1";

const roleConfig = {
  frontend: {
    label: "Frontend Developer",
    description:
      "Responsive interfaces, modern JavaScript frameworks, and web accessibility.",
    required: ["HTML & CSS", "JavaScript", "React", "Git"],
  },
  backend: {
    label: "Backend Developer",
    description:
      "Server-side APIs, relational databases, authentication, and deployment.",
    required: ["Node.js", "Python", "SQL", "REST APIs", "Git"],
  },
  fullstack: {
    label: "Full-Stack Developer",
    description:
      "End-to-end web architecture spanning UI, APIs, and database layers.",
    required: ["HTML & CSS", "JavaScript", "React", "Node.js", "SQL", "Git"],
  },
  designer: {
    label: "UI/UX Designer",
    description:
      "User research, interactive wireframing, and scalable design systems.",
    required: ["Figma", "UI/UX Design", "Wireframing", "Prototyping"],
  },
  data_analyst: {
    label: "Data Analyst",
    description:
      "Data cleaning, SQL querying, statistical insights, and dashboarding.",
    required: ["SQL", "Python", "Excel", "Data Visualization"],
  },
  devops: {
    label: "DevOps Engineer",
    description:
      "CI/CD automation, containerization, Linux servers, and cloud infrastructure.",
    required: ["Linux", "Docker", "CI/CD", "Cloud Computing", "Git"],
  },
  manager: {
    label: "Product Manager",
    description:
      "Product strategy, agile sprint execution, and cross-functional alignment.",
    required: ["Product Strategy", "Agile", "Roadmapping", "Communication"],
  },
  qa_engineer: {
    label: "QA / Test Engineer",
    description:
      "Automated test suites, bug tracking, API validation, and release quality.",
    required: ["Test Automation", "API Testing", "Bug Tracking", "Git"],
  },
};

const ratingLabels = {
  1: "Beginner",
  2: "Basic",
  3: "Intermediate",
  4: "Advanced",
  5: "Expert",
};

let state = {
  name: "",
  role: "",
  otherRole: "",
  currentStepIndex: 0,
  isSubmitted: false,
  customRequiredSkills: [],
  selectedSkills: [],
  skillRatings: {},
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = { ...state, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn("Could not read localStorage:", err);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("Could not save to localStorage:", err);
  }
}

function getRoleLabel() {
  if (state.role === "others") return state.otherRole || "Custom Role";
  return roleConfig[state.role]?.label || "No Role Selected";
}

function getRequiredSkills() {
  if (state.role === "others") return state.customRequiredSkills || [];
  return roleConfig[state.role]?.required || [];
}

function getMissingSkills() {
  const required = getRequiredSkills();
  const selected = state.selectedSkills || [];
  return required.filter(
    (req) => !selected.some((s) => s.toLowerCase() === req.toLowerCase()),
  );
}

function getInitials(fullName) {
  const clean = (fullName || "").trim();
  if (!clean) return "G";
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Navigation Tabs
const navItems = document.querySelectorAll(".nav-item");
const viewPanels = document.querySelectorAll(".view-panel");

function switchView(viewName) {
  navItems.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });
  viewPanels.forEach((panel) => {
    panel.hidden = panel.id !== `view-${viewName}`;
  });
}

navItems.forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

document.querySelectorAll("[data-jump]").forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.jump));
});

// Render All Dashboard Sections
function renderDashboard() {
  const hasProfile = Boolean(
    state.name || state.role || state.selectedSkills.length > 0,
  );
  const required = getRequiredSkills();
  const missing = getMissingSkills();
  const selected = state.selectedSkills;

  // Header
  document.getElementById("headerUserName").textContent = state.name
    ? `${state.name}'s Workspace`
    : "Welcome to SkillGap";
  document.getElementById("headerRoleTag").textContent = hasProfile
    ? `Target Role · ${getRoleLabel()}`
    : "Role Readiness Studio";
  document.getElementById("navSkillCount").textContent = selected.length;

  document.getElementById("sidebarAvatar").textContent = getInitials(
    state.name,
  );
  document.getElementById("sidebarUserName").textContent =
    state.name || "Guest User";
  document.getElementById("sidebarUserRole").textContent = getRoleLabel();

  // Guided Next-Step Banner
  const guideBadge = document.getElementById("guideStepBadge");
  const guideTitle = document.getElementById("guideTitle");
  const guideDesc = document.getElementById("guideDesc");
  const guideActions = document.getElementById("guideActions");

  if (!hasProfile) {
    guideBadge.textContent = "Step 1 · Getting Started";
    guideTitle.textContent = "Create your skill profile in 2 minutes";
    guideDesc.textContent =
      "Select your target role from 8 built-in tracks (or define a custom role), add your skills, and see what you need to learn next.";
    guideActions.innerHTML = `<a href="onboarding.html" class="btn-primary">Start Setup Wizard →</a>`;
  } else if (missing.length > 0) {
    guideBadge.textContent = "Action Recommended";
    guideTitle.textContent = `You are missing ${missing.length} required skill${missing.length > 1 ? "s" : ""} for ${getRoleLabel()}`;
    guideDesc.textContent = `Add ${missing.join(", ")} to reach 100% core role coverage.`;
    guideActions.innerHTML = `<button type="button" class="btn-primary" id="bannerFixAllBtn">+ Add Missing Skills</button>`;
    document.getElementById("bannerFixAllBtn").addEventListener("click", () => {
      missing.forEach((skill) => addSkillDirect(skill, 3));
    });
  } else {
    guideBadge.textContent = "All Core Requirements Met";
    guideTitle.textContent = `You match 100% of ${getRoleLabel()} core skills.`;
    guideDesc.textContent =
      "Fine-tune your 1–5 proficiency ratings below or compare your stack against other roles in Role Benchmarks.";
    guideActions.innerHTML = `<button type="button" class="btn-primary" id="bannerBenchBtn">Compare Other Roles →</button>`;
    document.getElementById("bannerBenchBtn").addEventListener("click", () => {
      switchView("benchmarks");
    });
  }

  // KPI Metrics
  const matched = required.length - missing.length;
  const pct =
    required.length > 0
      ? Math.round((matched / required.length) * 100)
      : selected.length > 0
        ? 100
        : 0;

  document.getElementById("kpiReadinessTag").textContent = `${pct}%`;
  document.getElementById("kpiReadinessValue").textContent =
    `${matched} / ${required.length}`;
  document.getElementById("kpiReadinessBar").style.width = `${pct}%`;

  const reqCount = selected.filter((s) =>
    required.some((r) => r.toLowerCase() === s.toLowerCase()),
  ).length;
  const extraCount = selected.length - reqCount;

  document.getElementById("kpiTotalSkills").textContent = selected.length;
  document.getElementById("kpiSkillSplit").textContent =
    `${reqCount} required · ${extraCount} additional`;

  const scores = selected
    .map((s) => state.skillRatings[s] || 0)
    .filter((n) => n > 0);
  const avg =
    scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : "0.0";
  const roundedAvg = Math.round(Number(avg));

  document.getElementById("kpiAvgScore").innerHTML =
    `${avg} <small>/ 5</small>`;
  document.getElementById("kpiAvgLabel").textContent = roundedAvg
    ? ratingLabels[roundedAvg]
    : "Not Rated";

  // Overview: Skill Bars
  const barsContainer = document.getElementById("overviewSkillBars");
  barsContainer.innerHTML = "";

  if (selected.length === 0) {
    barsContainer.innerHTML = `
            <div class="empty-box">
              <p>No skills added yet. Use <strong>My Skills</strong> or the setup wizard to add your stack.</p>
            </div>
          `;
  } else {
    selected.forEach((skill) => {
      const isReq = required.some(
        (r) => r.toLowerCase() === skill.toLowerCase(),
      );
      const score = state.skillRatings[skill] || 3;

      const row = document.createElement("div");
      row.className = "skill-bar-row";
      row.innerHTML = `
              <div class="skill-bar-top">
                <span class="skill-title">
                  ${skill}
                  ${isReq ? '<span class="badge-req">Required</span>' : ""}
                </span>
                <div class="stepper-controls">
                  <span class="level-caption">${ratingLabels[score]} (${score}/5)</span>
                  <button type="button" class="mini-step-btn" data-delta="-1" aria-label="Decrease ${skill} rating">−</button>
                  <button type="button" class="mini-step-btn" data-delta="1" aria-label="Increase ${skill} rating">+</button>
                </div>
              </div>
              <div class="progress-bar thin">
                <div class="progress-fill" style="width: ${score * 20}%"></div>
              </div>
            `;

      row.querySelectorAll(".mini-step-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const delta = Number(btn.dataset.delta);
          const next = Math.min(5, Math.max(1, score + delta));
          state.skillRatings[skill] = next;
          saveState();
          renderDashboard();
        });
      });

      barsContainer.appendChild(row);
    });
  }

  // Overview: Missing Gaps
  const gapsContainer = document.getElementById("overviewGapsList");
  gapsContainer.innerHTML = "";

  if (!state.role) {
    gapsContainer.innerHTML = `
            <div class="empty-box">
              <p>Select a target role in <strong>Role Benchmarks</strong> or the setup wizard to see required skills.</p>
            </div>
          `;
  } else if (missing.length === 0) {
    gapsContainer.innerHTML = `
            <div class="success-box">
              <strong>✓ Zero Skill Gaps</strong>
              <p>You have every required skill for <strong>${getRoleLabel()}</strong> in your profile.</p>
            </div>
          `;
  } else {
    missing.forEach((skill) => {
      const item = document.createElement("div");
      item.className = "gap-item";
      item.innerHTML = `
              <div>
                <strong>${skill}</strong>
                <span>Required for ${getRoleLabel()}</span>
              </div>
              <button type="button" class="btn-add-gap">+ Add</button>
            `;
      item.querySelector(".btn-add-gap").addEventListener("click", () => {
        addSkillDirect(skill, 3);
      });
      gapsContainer.appendChild(item);
    });
  }

  renderManageSkillsList(required);
  renderBenchmarkCards();
}

function addSkillDirect(rawName, rating = 3) {
  const clean = rawName.trim();
  if (!clean) return;
  const exists = state.selectedSkills.some(
    (s) => s.toLowerCase() === clean.toLowerCase(),
  );
  if (!exists) {
    state.selectedSkills.push(clean);
  }
  state.skillRatings[clean] = rating;
  state.isSubmitted = true;
  saveState();
  renderDashboard();
}

function renderManageSkillsList(required) {
  const list = document.getElementById("manageSkillsList");
  list.innerHTML = "";

  if (state.selectedSkills.length === 0) {
    list.innerHTML = `<div class="empty-box"><p>Your skill list is empty. Add one above!</p></div>`;
    return;
  }

  state.selectedSkills.forEach((skill) => {
    const isReq = required.some((r) => r.toLowerCase() === skill.toLowerCase());
    const score = state.skillRatings[skill] || 3;

    const card = document.createElement("div");
    card.className = "manage-row";
    card.innerHTML = `
            <div class="manage-info">
              <strong>${skill}</strong>
              ${isReq ? '<span class="badge-req">Required</span>' : '<span class="badge-opt">Additional</span>'}
            </div>
            <div class="manage-controls">
              <div class="pill-rating-group">
                ${[1, 2, 3, 4, 5]
                  .map(
                    (n) =>
                      `<button type="button" class="rate-pill ${score === n ? "active" : ""}" data-score="${n}">${n}</button>`,
                  )
                  .join("")}
              </div>
              <button type="button" class="btn-remove-row" title="Remove skill">Remove</button>
            </div>
          `;

    card.querySelectorAll(".rate-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.skillRatings[skill] = Number(btn.dataset.score);
        saveState();
        renderDashboard();
      });
    });

    card.querySelector(".btn-remove-row").addEventListener("click", () => {
      state.selectedSkills = state.selectedSkills.filter((s) => s !== skill);
      delete state.skillRatings[skill];
      saveState();
      renderDashboard();
    });

    list.appendChild(card);
  });
}

function renderBenchmarkCards() {
  const container = document.getElementById("benchmarkCards");
  container.innerHTML = "";

  Object.entries(roleConfig).forEach(([key, cfg]) => {
    const isCurrent = state.role === key;
    const matched = cfg.required.filter((req) =>
      state.selectedSkills.some((s) => s.toLowerCase() === req.toLowerCase()),
    );

    const card = document.createElement("div");
    card.className = `benchmark-card ${isCurrent ? "is-current" : ""}`;
    card.innerHTML = `
            <div class="bench-top">
              <div>
                <h4>${cfg.label}</h4>
                <p>${cfg.description}</p>
              </div>
              <span class="bench-score">${matched.length}/${cfg.required.length} Matched</span>
            </div>
            <div class="bench-chips">
              ${cfg.required
                .map((req) => {
                  const hasIt = matched.includes(req);
                  return `<span class="bench-chip ${hasIt ? "has" : "missing"}">${hasIt ? "✓" : "+"} ${req}</span>`;
                })
                .join(
                  "",
                )} </div> <button type="button" class="btn-switch-role"> ${isCurrent ? "Current Target Role" : `Set ${cfg.label} as Target`}
            </button>
          `;

    const btn = card.querySelector(".btn-switch-role");
    btn.disabled = isCurrent;
    btn.addEventListener("click", () => {
      state.role = key;
      state.isSubmitted = true;
      saveState();
      renderDashboard();
      switchView("overview");
    });

    container.appendChild(card);
  });
}

// Quick Add Skill Form
document.getElementById("quickAddSkillForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("quickSkillInput");
  const rating = Number(document.getElementById("quickSkillRating").value);
  if (!input.value.trim()) return;
  addSkillDirect(input.value, rating);
  input.value = "";
});

// Reset Profile Button
//   document
//     .getElementById("resetProfileBtn")
//     .addEventListener("click", () => {
//       localStorage.removeItem(STORAGE_KEY);
//       state = {
//         name: "",
//         role: "",
//         otherRole: "",
//         currentStepIndex: 0,
//         isSubmitted: false,
//         customRequiredSkills: [],
//         selectedSkills: [],
//         skillRatings: {},
//       };
//       renderDashboard();
//       switchView("overview");
//     });
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  window.location.href = "index.html";
});

// Boot
loadState();
renderDashboard();
