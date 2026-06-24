const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

if (!currentUser || currentUser.role !== "student") {
  window.location.href = "index.html";
}

const studentNameEl = document.getElementById("studentName");
if (studentNameEl) {
  studentNameEl.textContent = currentUser.name || "طالب";
}

function getStatusLabel(progress) {
  if (progress === 100) return "مكتملة";
  if (progress >= 50) return "تم إرسال التسجيل";
  if (progress >= 20) return "بدأ التسجيل";
  return "لم يبدأ";
}

async function renderAchievements() {
  const container = document.getElementById("achievementsContainer");
  container.innerHTML = "جاري التحميل...";

  try {
    const stories = await fetchApi('/stories');
    const progresses = await fetchApi('/progress');

    container.innerHTML = "";

    let completedCount = 0;
    let totalProgress = 0;

    stories.forEach(story => {
      const myProgress = progresses.find(p => p.storyId === story.id);
      const progress = myProgress ? myProgress.percentage : 0;

      if (progress === 100) completedCount++;
      totalProgress += progress;

      const card = document.createElement("div");
      card.className = "achievement-card";

      card.innerHTML = `
        <div class="achieve-info">
          <h3>${story.title}</h3>
          <span>الحالة: ${getStatusLabel(progress)}</span>
        </div>
        <div class="achieve-bar">
          <div class="bar-fill" style="width: ${progress}%"></div>
          <span class="bar-text">${progress}%</span>
        </div>
      `;

      container.appendChild(card);
    });

    document.getElementById("completedCount").textContent = completedCount;
    document.getElementById("totalStories").textContent = stories.length;

    const avgProgress = stories.length > 0 ? Math.round(totalProgress / stories.length) : 0;
    document.getElementById("avgProgress").textContent = avgProgress;

  } catch (error) {
    container.innerHTML = "حدث خطأ في جلب الإنجازات";
  }
}

function logout() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

renderAchievements();