const STORAGE_KEY = "account_onboarding_state_v1";

      const ratingLabels = {
        1: "Beginner",
        2: "Basic",
        3: "Intermediate",
        4: "Advanced",
        5: "Expert",
      };

      // Interactive Hero Preview Data
      const demoPresets = {
        developer: {
          title: "Developer",
          totalRequired: 3,
          missingSkill: { name: "Git", defaultRating: 4 },
          missingResolved: false,
          skills: [
            { name: "JavaScript", required: true, rating: 4 },
            { name: "HTML & CSS", required: true, rating: 5 },
            { name: "React", required: false, rating: 3 },
          ],
        },
        designer: {
          title: "Designer",
          totalRequired: 3,
          missingSkill: { name: "Wireframing", defaultRating: 4 },
          missingResolved: false,
          skills: [
            { name: "Figma", required: true, rating: 5 },
            { name: "UI/UX Design", required: true, rating: 4 },
            { name: "Design Systems", required: false, rating: 3 },
          ],
        },
        manager: {
          title: "Manager",
          totalRequired: 3,
          missingSkill: { name: "Communication", defaultRating: 5 },
          missingResolved: false,
          skills: [
            { name: "Project Management", required: true, rating: 4 },
            { name: "Agile", required: true, rating: 4 },
            { name: "Roadmapping", required: false, rating: 3 },
          ],
        },
      };

      let activeDemoRole = "developer";

      const demoTabs = document.querySelectorAll(".demo-tab");
      const demoWindowBody = document.getElementById("demoWindowBody");
      const demoRoleTitle = document.getElementById("demoRoleTitle");
      const demoCoverageBadge = document.getElementById("demoCoverageBadge");
      const demoMissingAlert = document.getElementById("demoMissingAlert");
      const demoMissingText = document.getElementById("demoMissingText");
      const demoFixBtn = document.getElementById("demoFixBtn");
      const demoSkillRows = document.getElementById("demoSkillRows");
      const demoJsonFooter = document.getElementById("demoJsonFooter");

      function renderHeroDemo(roleKey, animate = true) {
        activeDemoRole = roleKey;
        const data = demoPresets[roleKey];

        // Update active tab styling
        demoTabs.forEach((tab) => {
          const isMatch = tab.dataset.demoRole === roleKey;
          tab.classList.toggle("active", isMatch);
          tab.setAttribute("aria-selected", String(isMatch));
        });

        if (animate) {
          demoWindowBody.classList.remove("demo-fade");
          void demoWindowBody.offsetWidth;
          demoWindowBody.classList.add("demo-fade");
        }

        demoRoleTitle.textContent = data.title;

        // Build current skill list (including resolved missing skill if clicked)
        const currentSkills = [...data.skills];
        if (data.missingResolved) {
          currentSkills.splice(2, 0, {
            name: data.missingSkill.name,
            required: true,
            rating: data.missingSkill.defaultRating,
          });
        }

        const matchedCount = data.missingResolved
          ? data.totalRequired
          : data.totalRequired - 1;
        const pct = Math.round((matchedCount / data.totalRequired) * 100);

        demoCoverageBadge.textContent = `${matchedCount} / ${data.totalRequired} Required`;
        demoCoverageBadge.classList.toggle("is-complete", data.missingResolved);

        // Missing Alert Banner
        if (data.missingResolved) {
          demoMissingAlert.classList.add("is-resolved");
          demoMissingText.innerHTML = `<strong>All Required Skills Met:</strong> ${data.missingSkill.name} added`;
          demoFixBtn.textContent = "Reset";
        } else {
          demoMissingAlert.classList.remove("is-resolved");
          demoMissingText.innerHTML = `<strong>Missing Core Skill:</strong> ${data.missingSkill.name}`;
          demoFixBtn.textContent = "+ Add Skill";
        }

        // Render Skill Rows
        demoSkillRows.innerHTML = "";
        currentSkills.forEach((item) => {
          const row = document.createElement("div");
          row.className = "mock-skill-row";
          row.innerHTML = `
            <div class="mock-skill-meta">
              <span>
                ${item.name}
                ${item.required ? '<em class="mock-req">Required</em>' : ""}
              </span>
              <span>${item.rating} / 5 · ${ratingLabels[item.rating]}</span>
            </div>
            <div class="mock-bar">
              <div style="width: ${item.rating * 20}%"></div>
            </div>
          `;
          demoSkillRows.appendChild(row);
        });

        demoJsonFooter.textContent = `{ "role": "${roleKey}", "coverage": "${pct}%", "skills": ${currentSkills.length} }`;
      }

      demoTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          if (tab.dataset.demoRole !== activeDemoRole) {
            renderHeroDemo(tab.dataset.demoRole, true);
          }
        });
      });

      demoFixBtn.addEventListener("click", () => {
        const current = demoPresets[activeDemoRole];
        current.missingResolved = !current.missingResolved;
        renderHeroDemo(activeDemoRole, false);
      });

      // Check Saved LocalStorage Profile
      function checkSavedProfile() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return;
          const saved = JSON.parse(raw);

          if (
            !saved.name &&
            !saved.role &&
            (!saved.selectedSkills || saved.selectedSkills.length === 0)
          ) {
            return;
          }

          const bar = document.getElementById("savedSessionBar");
          const badge = document.getElementById("sessionStatusBadge");
          const text = document.getElementById("sessionSummaryText");

          bar.hidden = false;
          badge.textContent = saved.isSubmitted
            ? "Profile Ready"
            : "Draft Saved";
          badge.classList.toggle("is-draft", !saved.isSubmitted);

          const count = Array.isArray(saved.selectedSkills)
            ? saved.selectedSkills.length
            : 0;
          text.textContent = `${saved.name || "User"} · ${count} skill${
            count === 1 ? "" : "s"
          }`;

          document.getElementById("navStartBtn").textContent = saved.isSubmitted
            ? "View Profile"
            : "Resume Draft";
          document.getElementById("heroStartBtn").textContent =
            saved.isSubmitted ? "Open Saved Profile →" : "Resume Setup →";
          document.getElementById("bottomStartBtn").textContent =
            saved.isSubmitted ? "Edit Your Profile →" : "Continue Setup →";
        } catch {
          // Ignore malformed storage
        }

        // Inside checkSavedProfile() in index.html:
        if (saved.isSubmitted) {
          document.getElementById("navStartBtn").href = "dashboard.html";
          document.getElementById("navStartBtn").textContent = "Dashboard";

          document.getElementById("heroStartBtn").href = "dashboard.html";
          document.getElementById("heroStartBtn").textContent =
            "Open Dashboard →";

          document.querySelector(".session-link").href = "dashboard.html";
        }
      }

      renderHeroDemo("developer", false);
      checkSavedProfile();