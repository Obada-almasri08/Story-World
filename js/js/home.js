const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser) {
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("studentName").textContent = currentUser.name || "طالب";

  const stories = ["story1", "story2", "story3", "story4"];
  let completedCount = 0;

  stories.forEach(storyId => {
    const key = `progress_${currentUser.email}_${storyId}`;
    const progress = Number(localStorage.getItem(key)) || 0;

    const bar = document.getElementById(`progress-${storyId}`);
    const percent = document.getElementById(`percent-${storyId}`);

    if (bar) {
      bar.style.width = progress + "%";
    }

    if (percent) {
      percent.textContent = progress + "%";
    }

    if (progress === 100) {
      completedCount++;
    }
  });

  document.getElementById("completedStories").textContent = completedCount;
});

function openStoryFromHome(storyId) {
  localStorage.setItem("currentStory", storyId);
  window.location.href = "story.html";
}