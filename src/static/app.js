document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let activities = {};

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function formatParticipants(activityName, participants) {
    if (!participants.length) {
      return '<li class="participants-empty">No students signed up yet</li>';
    }

    return participants
      .map(
        (participant) => `
          <li class="participant-item">
            <span class="participant-email">${participant}</span>
            <button
              type="button"
              class="participant-delete-button"
              data-activity="${encodeURIComponent(activityName)}"
              data-email="${encodeURIComponent(participant)}"
              aria-label="Remove ${participant} from ${activityName}"
              title="Remove participant"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9 3.75h6a1.5 1.5 0 0 1 1.5 1.5V6h3a.75.75 0 0 1 0 1.5h-1.01l-.7 11.14A2.25 2.25 0 0 1 15.55 20.75H8.45a2.25 2.25 0 0 1-2.24-2.11L5.51 7.5H4.5a.75.75 0 0 1 0-1.5h3v-.75A1.5 1.5 0 0 1 9 3.75Zm6 2.25v-.75h-6V6h6Zm-6.04 3.5a.75.75 0 0 0-.75.79l.4 7a.75.75 0 1 0 1.5-.08l-.4-7a.75.75 0 0 0-.75-.71Zm6.08 0a.75.75 0 0 0-.75.71l-.4 7a.75.75 0 0 0 1.5.08l.4-7a.75.75 0 0 0-.75-.79ZM12 9.5a.75.75 0 0 0-.75.75v7a.75.75 0 0 0 1.5 0v-7A.75.75 0 0 0 12 9.5Z"></path>
              </svg>
            </button>
          </li>
        `
      )
      .join("");
  }

  function renderActivities() {
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-section">
          <p class="participants-title">Participants</p>
          <ul class="participants-list">
            ${formatParticipants(name, details.participants)}
          </ul>
        </div>
      `;

      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      activities = await response.json();
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        activities[result.activity_name] = result.activity;
        signupForm.reset();
        renderActivities();
        showMessage(result.message, "success");
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".participant-delete-button");

    if (!deleteButton) {
      return;
    }

    const activity = decodeURIComponent(deleteButton.dataset.activity);
    const email = decodeURIComponent(deleteButton.dataset.email);

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        activities[result.activity_name] = result.activity;
        renderActivities();
        showMessage(result.message, "success");
      } else {
        showMessage(result.detail || "Unable to remove participant.", "error");
      }
    } catch (error) {
      showMessage("Failed to remove participant. Please try again.", "error");
      console.error("Error removing participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
