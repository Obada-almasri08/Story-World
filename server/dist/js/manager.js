const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

if (!currentUser || currentUser.role !== "manager") {
  window.location.href = "index.html";
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

const categoryNames = {
  islamic: "قصص إسلامية",
  fantasy: "قصص خيالية",
  adventure: "قصص مغامرات",
  educational: "قصص تعليمية",
  animals: "قصص حيوانات"
};

let teachers = [];
let stories = [];

async function renderTeachers() {
  const list = document.getElementById("teachersList");
  list.innerHTML = "جاري التحميل...";

  try {
    teachers = await fetchApi('/users/teachers');
    
    if (teachers.length === 0) {
      list.innerHTML = "لا يوجد معلمون حالياً";
      return;
    }

    list.innerHTML = "";
    teachers.forEach((teacher) => {
      const div = document.createElement("div");
      div.className = "item";

      div.innerHTML = `
        <div>
          <strong>${teacher.name}</strong>
          <br>
          <span>البريد: ${teacher.email} | الهاتف: ${teacher.phone || 'غير محدد'} | كلمة السر: ${teacher.passwordPlain || '••••••'}</span>
        </div>
        <button onclick="deleteTeacher(${teacher.id})">حذف</button>
      `;

      list.appendChild(div);
    });
  } catch (error) {
    showToast(error.message, "warning");
    list.innerHTML = "حدث خطأ أثناء تحميل المعلمين";
  }
}

async function addTeacher() {
  const name = document.getElementById("teacherName").value.trim();
  const email = document.getElementById("teacherEmail").value.trim();
  const phone = document.getElementById("teacherPhone").value.trim();
  const password = document.getElementById("teacherPassword").value.trim();

  if (!name || !email || !password) {
    showToast("املأ جميع بيانات المعلم", "warning");
    return;
  }

  if (password.length < 6) {
    showToast("كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل", "warning");
    return;
  }

  try {
    await fetchApi('/users/teachers', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone })
    });

    document.getElementById("teacherName").value = "";
    document.getElementById("teacherEmail").value = "";
    document.getElementById("teacherPhone").value = "";
    document.getElementById("teacherPassword").value = "";

    renderTeachers();
    showToast("تم إضافة المعلم بنجاح", "success");
  } catch (error) {
    showToast(error.message, "warning");
  }
}

async function deleteTeacher(id) {
  try {
    await fetchApi(`/users/teachers/${id}`, { method: 'DELETE' });
    renderTeachers();
    showToast("تم حذف المعلم", "warning");
  } catch (error) {
    showToast(error.message, "warning");
  }
}

let editingStoryId = null;

async function renderStories() {
  const list = document.getElementById("storiesList");
  list.innerHTML = "جاري التحميل...";

  try {
    stories = await fetchApi('/stories');

    if (stories.length === 0) {
      list.innerHTML = "لا توجد قصص مضافة حالياً";
      return;
    }

    list.innerHTML = "";
    stories.forEach((story) => {
      const div = document.createElement("div");
      div.className = "item";

      div.innerHTML = `
        <div>
          <strong>${story.title}</strong>
          <br>
          <span>${categoryNames[story.category] || "بدون تصنيف"}</span>
          <br>
          <span>${story.text.substring(0, 60)}...</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button onclick="editStory(${story.id})" style="background: #2563eb;">تعديل</button>
          <button onclick="deleteStory(${story.id})" style="background: #ef4444;">حذف</button>
        </div>
      `;

      list.appendChild(div);
    });
  } catch (error) {
    showToast(error.message, "warning");
    list.innerHTML = "حدث خطأ أثناء تحميل القصص";
  }
}

function editStory(id) {
  const story = stories.find(s => s.id === id);
  if (!story) return;

  editingStoryId = id;

  document.getElementById("storyTitle").value = story.title;
  document.getElementById("storyCategory").value = story.category;
  document.getElementById("storyText").value = story.text;

  document.querySelector(".story-card h3").textContent = "تعديل القصة";
  document.querySelector(".story-card button[onclick='addStory()']").textContent = "حفظ التعديلات";

  document.getElementById("quizQ1").value = "";
  document.getElementById("quizQ1Opt1").value = "";
  document.getElementById("quizQ1Opt2").value = "";
  document.getElementById("quizQ1Opt3").value = "";
  document.getElementById("quizQ1Answer").value = "0";

  document.getElementById("quizQ2").value = "";
  document.getElementById("quizQ2Opt1").value = "";
  document.getElementById("quizQ2Opt2").value = "";
  document.getElementById("quizQ2Opt3").value = "";
  document.getElementById("quizQ2Answer").value = "0";

  if (story.quizText) {
    try {
      const quiz = JSON.parse(story.quizText);
      if (quiz[0]) {
        document.getElementById("quizQ1").value = quiz[0].question || "";
        document.getElementById("quizQ1Opt1").value = quiz[0].options[0] || "";
        document.getElementById("quizQ1Opt2").value = quiz[0].options[1] || "";
        document.getElementById("quizQ1Opt3").value = quiz[0].options[2] || "";
        document.getElementById("quizQ1Answer").value = quiz[0].answer !== undefined ? quiz[0].answer : "0";
      }
      if (quiz[1]) {
        document.getElementById("quizQ2").value = quiz[1].question || "";
        document.getElementById("quizQ2Opt1").value = quiz[1].options[0] || "";
        document.getElementById("quizQ2Opt2").value = quiz[1].options[1] || "";
        document.getElementById("quizQ2Opt3").value = quiz[1].options[2] || "";
        document.getElementById("quizQ2Answer").value = quiz[1].answer !== undefined ? quiz[1].answer : "0";
      }
    } catch (e) {
      console.error(e);
    }
  }

  document.querySelector(".story-card").scrollIntoView({ behavior: 'smooth' });
}

async function addStory() {
  const title = document.getElementById("storyTitle").value.trim();
  const category = document.getElementById("storyCategory").value;
  const text = document.getElementById("storyText").value.trim();
  const imageInput = document.getElementById("storyImage");
  const imageFile = imageInput.files[0];

  if (!title || !category || !text) {
    showToast("املأ عنوان القصة والتصنيف والنص", "warning");
    return;
  }

  if (!editingStoryId && !imageFile) {
    showToast("اختر صورة للقصة", "warning");
    return;
  }

  // Quiz construction
  const quiz = [];
  const q1 = document.getElementById("quizQ1").value.trim();
  const q1Opt1 = document.getElementById("quizQ1Opt1").value.trim();
  const q1Opt2 = document.getElementById("quizQ1Opt2").value.trim();
  const q1Opt3 = document.getElementById("quizQ1Opt3").value.trim();
  const q1Ans = document.getElementById("quizQ1Answer").value;

  if (q1 && q1Opt1 && q1Opt2 && q1Opt3) {
    quiz.push({
      question: q1,
      options: [q1Opt1, q1Opt2, q1Opt3],
      answer: parseInt(q1Ans)
    });
  }

  const q2 = document.getElementById("quizQ2").value.trim();
  const q2Opt1 = document.getElementById("quizQ2Opt1").value.trim();
  const q2Opt2 = document.getElementById("quizQ2Opt2").value.trim();
  const q2Opt3 = document.getElementById("quizQ2Opt3").value.trim();
  const q2Ans = document.getElementById("quizQ2Answer").value;

  if (q2 && q2Opt1 && q2Opt2 && q2Opt3) {
    quiz.push({
      question: q2,
      options: [q2Opt1, q2Opt2, q2Opt3],
      answer: parseInt(q2Ans)
    });
  }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('category', category);
  formData.append('text', text);
  if (imageFile) {
    formData.append('image', imageFile);
  }
  if (quiz.length > 0) {
    formData.append('quizText', JSON.stringify(quiz));
  } else {
    formData.append('quizText', ''); // Clear quiz if not set
  }

  try {
    const url = editingStoryId ? `/stories/${editingStoryId}` : '/stories';
    const method = editingStoryId ? 'PUT' : 'POST';

    await fetchApi(url, {
      method: method,
      body: formData
    });

    document.getElementById("storyTitle").value = "";
    document.getElementById("storyCategory").value = "";
    document.getElementById("storyText").value = "";
    imageInput.value = "";

    // Clear quiz fields
    document.getElementById("quizQ1").value = "";
    document.getElementById("quizQ1Opt1").value = "";
    document.getElementById("quizQ1Opt2").value = "";
    document.getElementById("quizQ1Opt3").value = "";
    document.getElementById("quizQ1Answer").value = "0";

    document.getElementById("quizQ2").value = "";
    document.getElementById("quizQ2Opt1").value = "";
    document.getElementById("quizQ2Opt2").value = "";
    document.getElementById("quizQ2Opt3").value = "";
    document.getElementById("quizQ2Answer").value = "0";

    if (editingStoryId) {
      showToast("تم تعديل القصة بنجاح", "success");
      editingStoryId = null;
      document.querySelector(".story-card h3").textContent = "إضافة قصة";
      document.querySelector(".story-card button[onclick='addStory()']").textContent = "إضافة قصة +";
    } else {
      showToast("تم إضافة القصة بنجاح", "success");
    }

    renderStories();
  } catch (error) {
    showToast(error.message, "warning");
  }
}

async function deleteStory(id) {
  try {
    await fetchApi(`/stories/${id}`, { method: 'DELETE' });
    renderStories();
    showToast("تم حذف القصة", "warning");
  } catch (error) {
    showToast(error.message, "warning");
  }
}

function logout() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

renderTeachers();
renderStories();