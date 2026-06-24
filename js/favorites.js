const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

if (!currentUser || currentUser.role !== "student") {
  window.location.href = "index.html";
}

const studentNameEl = document.getElementById("studentName");
if (studentNameEl) {
  studentNameEl.textContent = currentUser.name || "طالب";
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 2500);
}

function openStory(storyId) {
  sessionStorage.setItem("currentStoryId", storyId);
  window.location.href = "story.html";
}

const categoryNames = {
  islamic: "قصص إسلامية",
  fantasy: "قصص خيالية",
  adventure: "قصص مغامرات",
  educational: "قصص تعليمية",
  animals: "قصص حيوانات"
};

async function renderFavorites() {
  const container = document.getElementById("favoritesList");
  container.innerHTML = "جاري التحميل...";

  try {
    const favorites = await fetchApi('/favorites');

    container.innerHTML = "";

    if (favorites.length === 0) {
      container.innerHTML = "لا توجد قصص في المفضلة حالياً";
      return;
    }

    favorites.forEach(fav => {
      const story = fav.story;
      if (!story) return; // safety check
      const card = document.createElement("div");
      card.className = "favorite-card";

      let imageUrl = `images/story1.jpg`;
      if (story.imagePath) {
        if (story.imagePath.startsWith('/images')) {
          imageUrl = `.${story.imagePath}`;
        } else {
          imageUrl = `http://localhost:3000${story.imagePath}`;
        }
      }

      card.innerHTML = `
        <img src="${imageUrl}" alt="${story.title}" onerror="this.src='images/story1.jpg'">
        <div class="story-info">
          <h3>${story.title}</h3>
          <small>${categoryNames[story.category] || "بدون تصنيف"}</small>
          <div class="card-actions">
            <button onclick="openStory(${story.id})">قراءة</button>
            <button class="remove-btn" onclick="removeFavorite(${story.id})"><i class='bx bxs-trash'></i> إزالة</button>
          </div>
        </div>
      `;

      container.appendChild(card);
    });
  } catch (error) {
    container.innerHTML = "حدث خطأ في جلب المفضلة";
    showToast(error.message, "warning");
  }
}

async function removeFavorite(storyId) {
  try {
    await fetchApi(`/favorites/${storyId}`, { method: 'POST' });
    showToast("تمت إزالة القصة من المفضلة", "warning");
    renderFavorites();
  } catch (error) {
    showToast(error.message, "warning");
  }
}

function logout() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

renderFavorites();