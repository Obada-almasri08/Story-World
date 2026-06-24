const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

if (!currentUser || currentUser.role !== "teacher") {
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

document.getElementById("teacherName").textContent = currentUser.name || "معلم";

async function updateStats() {
  try {
    const students = await fetchApi('/users/students');
    const submissions = await fetchApi('/submissions');

    const pending = submissions.filter(sub => sub.status !== "تم التقييم").length;
    const reviewed = submissions.filter(sub => sub.status === "تم التقييم").length;

    document.getElementById("studentsCount").textContent = students.length;
    document.getElementById("pendingCount").textContent = pending;
    document.getElementById("reviewedCount").textContent = reviewed;
  } catch (error) {
    showToast("حدث خطأ في جلب الإحصائيات", "warning");
  }
}

async function addStudent() {
  const name = document.getElementById("studentName").value.trim();
  const email = document.getElementById("studentEmail").value.trim();
  const password = document.getElementById("studentPassword").value.trim();
  const grade = document.getElementById("studentGrade").value;

  if (!name || !email || !password || !grade) {
    showToast("املأ جميع الحقول واختر الصف", "warning");
    return;
  }

  if (!email.endsWith("@gmail.com")) {
    showToast("يجب أن ينتهي البريد الإلكتروني بـ @gmail.com", "warning");
    return;
  }

  if (password.length < 6) {
    showToast("كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل", "warning");
    return;
  }

  try {
    await fetchApi('/users/students', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, grade })
    });

    document.getElementById("studentName").value = "";
    document.getElementById("studentEmail").value = "";
    document.getElementById("studentPassword").value = "";
    document.getElementById("studentGrade").value = "";

    updateStats();
    showToast("تم إضافة الطالب بنجاح", "success");
  } catch (error) {
    showToast(error.message, "warning");
  }
}

function logout() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

// Fixed logout bug: admin.html doesn't have a logout function defined in js, but has a button calling it in HTML.
// Added logout function above.

updateStats();
