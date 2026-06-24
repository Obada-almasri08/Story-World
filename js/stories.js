const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

if (!currentUser || currentUser.role !== "student") {
  window.location.href = "index.html";
}

function logout() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

function openStory(storyId) {
  // We'll pass the story ID to the story page
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

let currentFilter = "all";
let allStories = [];

async function fetchStories() {
  const container = document.getElementById("storiesContainer");
  container.innerHTML = "جاري تحميل القصص...";

  try {
    allStories = await fetchApi('/stories');
    renderStories();
  } catch (error) {
    container.innerHTML = "حدث خطأ أثناء تحميل القصص";
  }
}

function renderStories() {
  const container = document.getElementById("storiesContainer");

  const filteredStories = currentFilter === "all"
    ? allStories
    : allStories.filter(story => story.category === currentFilter);

  container.innerHTML = "";

  if (filteredStories.length === 0) {
    container.innerHTML = "لا توجد قصص في هذا التصنيف";
    return;
  }

  filteredStories.forEach(story => {
    const card = document.createElement("div");
    card.className = "story-card";

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
        <button onclick="openStory(${story.id})">قراءة</button>
      </div>
    `;

    container.appendChild(card);
  });
}

function filterStories(category, btn) {
  currentFilter = category;

  document.querySelectorAll(".filter-btn").forEach(b => {
    b.classList.remove("active");
  });

  btn.classList.add("active");
  renderStories();
}

fetchStories();