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

let students = [];
let submissions = [];
let selectedStudentId = null;
let expandedSubmissions = {};

const studentsList = document.getElementById("studentsList");

async function fetchMyStudents() {
  try {
    students = await fetchApi('/users/students');
  } catch (error) {
    showToast("حدث خطأ في تحميل الطلاب", "warning");
  }
}

async function fetchMySubmissions() {
  try {
    submissions = await fetchApi('/submissions');
  } catch (error) {
    showToast("حدث خطأ في تحميل التسجيلات", "warning");
  }
}

function getGradeName(grade) {
  const names = {
    "1": "الصف الأول",
    "2": "الصف الثاني",
    "3": "الصف الثالث",
    "4": "الصف الرابع",
    "5": "الصف الخامس",
    "6": "الصف السادس",
    "7": "الصف السابع",
    "8": "الصف الثامن"
  };
  return names[grade] || "بدون صف";
}

async function showGradeStudents(gradeStr) {
  const grade = parseInt(gradeStr);
  await fetchMyStudents();
  
  const myStudents = students.filter(student => student.grade === grade);

  selectedStudentId = null;
  // Clear any view query param so clicking grades goes back to student-specific view
  const url = new URL(window.location);
  url.searchParams.delete('view');
  window.history.pushState({}, '', url);

  document.getElementById("selectedStudentTitle").textContent = `طلاب ${getGradeName(grade)}`;
  document.getElementById("submissionsList").innerHTML = "اختر طالباً لعرض تسجيلاته";

  if (myStudents.length === 0) {
    studentsList.innerHTML = `لا يوجد طلاب في ${getGradeName(grade)} حالياً`;
    return;
  }

  studentsList.innerHTML = "";

  myStudents.forEach(student => {
    const row = document.createElement("div");
    row.className = "student-row";

    row.innerHTML = `
      <strong>${student.name}</strong>
      <span>${student.email} | كلمة السر: ${student.passwordPlain || '••••••'}</span>
      <button onclick="showStudentSubmissions(${student.id})">عرض التسجيلات</button>
      <button onclick="deleteStudent(${student.id}, ${grade})">حذف</button>
    `;

    studentsList.appendChild(row);
  });
}

async function deleteStudent(id, grade) {
  try {
    await fetchApi(`/users/students/${id}`, { method: 'DELETE' });
    
    studentsList.innerHTML = "اختر صفاً لعرض الطلاب";
    selectedStudentId = null;
    document.getElementById("submissionsList").innerHTML = "اختر طالباً لعرض تسجيلاته";

    showToast("تم حذف الطالب", "warning");
    showGradeStudents(grade); // refresh the list
  } catch (error) {
    showToast(error.message, "warning");
  }
}

async function showStudentSubmissions(studentId) {
  selectedStudentId = studentId;

  // Clear query parameters
  const url = new URL(window.location);
  url.searchParams.delete('view');
  window.history.pushState({}, '', url);

  await fetchMySubmissions();
  
  const student = students.find(s => s.id === studentId);
  document.getElementById("selectedStudentTitle").textContent =
    student ? `تسجيلات الطالب: ${student.name}` : "تسجيلات الطالب";

  renderSubmissions();
}

function renderSubmissions() {
  const list = document.getElementById("submissionsList");
  if (!list) return;

  const urlParams = new URLSearchParams(window.location.search);
  const view = urlParams.get('view');

  if (!selectedStudentId && (view === 'pending' || view === 'reviewed')) {
    renderAllSubmissionsFiltered(view);
    return;
  }

  if (!selectedStudentId) {
    list.innerHTML = "اختر طالباً لعرض تسجيلاته";
    return;
  }

  const studentSubmissions = submissions.filter(submission => submission.studentId === selectedStudentId);

  if (studentSubmissions.length === 0) {
    list.innerHTML = "لا توجد تسجيلات لهذا الطالب حالياً";
    return;
  }

  const pending = studentSubmissions.filter(sub => sub.status !== "تم التقييم");
  const reviewed = studentSubmissions.filter(sub => sub.status === "تم التقييم");

  list.innerHTML = "";

  const pendingTitle = document.createElement("h4");
  pendingTitle.textContent = "بانتظار التقييم";
  list.appendChild(pendingTitle);

  if (pending.length === 0) {
    const pEl = document.createElement("p");
    pEl.textContent = "لا يوجد تسجيلات بانتظار التقييم";
    list.appendChild(pEl);
  } else {
    pending.forEach(sub => list.appendChild(createSubmissionRow(sub)));
  }

  const reviewedTitle = document.createElement("h4");
  reviewedTitle.textContent = "تم التقييم";
  reviewedTitle.style.marginTop = "25px";
  list.appendChild(reviewedTitle);

  if (reviewed.length === 0) {
    const pEl = document.createElement("p");
    pEl.textContent = "لا يوجد تسجيلات تم تقييمها";
    list.appendChild(pEl);
  } else {
    reviewed.forEach(sub => list.appendChild(createSubmissionRow(sub)));
  }
}

function renderAllSubmissionsFiltered(type) {
  const list = document.getElementById("submissionsList");
  if (!list) return;

  const titleEl = document.getElementById("selectedStudentTitle");
  
  let filtered = [];
  if (type === 'pending') {
    titleEl.textContent = "جميع التسجيلات بانتظار التقييم";
    filtered = submissions.filter(sub => sub.status !== "تم التقييم");
  } else {
    titleEl.textContent = "جميع التسجيلات التي تم تقييمها";
    filtered = submissions.filter(sub => sub.status === "تم التقييم");
  }

  if (filtered.length === 0) {
    list.innerHTML = type === 'pending' ? "<p>لا توجد تسجيلات بانتظار التقييم حالياً</p>" : "<p>لا توجد تسجيلات تم تقييمها حالياً</p>";
    return;
  }

  list.innerHTML = "";
  filtered.forEach(sub => {
    list.appendChild(createSubmissionRow(sub));
  });
}

function renderAllStudentsList() {
  if (students.length === 0) {
    studentsList.innerHTML = "لا يوجد طلاب حالياً";
    return;
  }

  studentsList.innerHTML = "";
  students.forEach(student => {
    const row = document.createElement("div");
    row.className = "student-row";

    row.innerHTML = `
      <strong>${student.name} (${getGradeName(student.grade)})</strong>
      <span>${student.email} | كلمة السر: ${student.passwordPlain || '••••••'}</span>
      <button onclick="showStudentSubmissions(${student.id})">عرض التسجيلات</button>
      <button onclick="deleteStudent(${student.id}, ${student.grade})">حذف</button>
    `;

    studentsList.appendChild(row);
  });
}

function toggleExpand(submissionId) {
  expandedSubmissions[submissionId] = !expandedSubmissions[submissionId];
  renderSubmissions();
}

function createSubmissionRow(submission) {
  const row = document.createElement("div");
  row.className = "submission-row";
  if (submission.status === "تم التقييم") {
    row.classList.add("reviewed-row");
  }

  const audioUrl = `http://localhost:3000${submission.audioPath}`;

  // If it's reviewed, we show the header, and optionally the details below it when expanded
  if (submission.status === "تم التقييم") {
    const isExpanded = expandedSubmissions[submission.id];
    row.innerHTML = `
      <div class="submission-info" style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; margin-bottom: 8px;">
        <div>
          <strong style="color: #166534;">${submission.student.name}</strong> - 
          <span style="font-weight: 600; color: #1e293b;">${submission.story.title}</span>
          <small style="margin-right: 15px; color: #64748b;">${new Date(submission.createdAt).toLocaleDateString("ar-SA")}</small>
          <span class="status-badge reviewed" style="background: #15803d; color: white; padding: 4px 10px; border-radius: 8px; font-size: 13px; font-weight: bold; margin-right: 15px;">تم التقييم (${submission.rating || 'بدون تقييم'})</span>
        </div>
        <button class="expand-btn" onclick="toggleExpand(${submission.id})" style="background: #2563eb; color: white; padding: 8px 16px; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; transition: 0.2s;">${isExpanded ? 'إخفاء' : 'عرض'}</button>
      </div>
      ${isExpanded ? `
      <div class="evaluation-details" style="padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; margin-top: -5px; margin-bottom: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <audio controls src="${audioUrl}" style="width: 100%; margin-bottom: 15px;"></audio>

        <label style="display: block; font-weight: bold; margin-bottom: 8px; color: #334155;">التقييم:</label>
        <select id="rating-${submission.id}" style="width: 100%; padding: 10px; margin-bottom: 15px; border-radius: 8px; border: 1px solid #cbd5e1; font-weight: 600;">
          <option value="">اختر التقييم</option>
          <option value="ممتاز" ${submission.rating === "ممتاز" ? "selected" : ""}>ممتاز</option>
          <option value="جيد جداً" ${submission.rating === "جيد جداً" ? "selected" : ""}>جيد جداً</option>
          <option value="جيد" ${submission.rating === "جيد" ? "selected" : ""}>جيد</option>
          <option value="يحتاج تدريب" ${submission.rating === "يحتاج تدريب" ? "selected" : ""}>يحتاج تدريب</option>
        </select>

        <label style="display: block; font-weight: bold; margin-bottom: 8px; color: #334155;">الملاحظة:</label>
        <textarea id="note-${submission.id}" placeholder="اكتب ملاحظة للطالب" style="width: 100%; height: 90px; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 15px; resize: vertical;">${submission.note || ""}</textarea>

        <div class="submission-actions" style="display: flex; gap: 10px; justify-content: flex-end;">
          <button onclick="saveReview(${submission.id})" style="background: #16a34a; color: white; border: none; border-radius: 8px; padding: 10px 20px; font-weight: bold; cursor: pointer; transition: 0.2s;">حفظ التعديل</button>
          <button class="delete-btn" onclick="deleteSubmission(${submission.id})" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 10px 20px; font-weight: bold; cursor: pointer; transition: 0.2s;">حذف</button>
        </div>
      </div>
      ` : ''}
    `;
    return row;
  }

  // Otherwise show the full expanded version (for pending submissions)
  row.innerHTML = `
    <div class="submission-info">
      <strong>${submission.student.name}</strong>
      <span>${submission.story.title}</span>
      <small>${new Date(submission.createdAt).toLocaleDateString("ar-SA")}</small>
      <small style="color: #2563eb; font-weight: bold;">${submission.status || "بانتظار التقييم"}</small>
    </div>

    <audio controls src="${audioUrl}"></audio>

    <select id="rating-${submission.id}">
      <option value="">اختر التقييم</option>
      <option value="ممتاز" ${submission.rating === "ممتاز" ? "selected" : ""}>ممتاز</option>
      <option value="جيد جداً" ${submission.rating === "جيد جداً" ? "selected" : ""}>جيد جداً</option>
      <option value="جيد" ${submission.rating === "جيد" ? "selected" : ""}>جيد</option>
      <option value="يحتاج تدريب" ${submission.rating === "يحتاج تدريب" ? "selected" : ""}>يحتاج تدريب</option>
    </select>

    <textarea id="note-${submission.id}" placeholder="اكتب ملاحظة للطالب">${submission.note || ""}</textarea>

    <div class="submission-actions">
      <button onclick="saveReview(${submission.id})">حفظ التقييم</button>
      <button class="delete-btn" onclick="deleteSubmission(${submission.id})">حذف</button>
    </div>
  `;

  return row;
}

async function saveReview(submissionId) {
  const rating = document.getElementById(`rating-${submissionId}`).value;
  const note = document.getElementById(`note-${submissionId}`).value.trim();

  if (!rating && !note) {
    showToast("اكتب تقييم أو ملاحظة أولاً", "warning");
    return;
  }

  try {
    await fetchApi(`/submissions/${submissionId}/review`, {
      method: 'PUT',
      body: JSON.stringify({ rating, note })
    });

    showToast("تم حفظ التقييم بنجاح", "success");
    expandedSubmissions[submissionId] = false; // automatically collapse after evaluation!
    await fetchMySubmissions();
    renderSubmissions();
  } catch (error) {
    showToast(error.message, "warning");
  }
}

async function deleteSubmission(submissionId) {
  if (!confirm("هل أنت متأكد من رغبتك في حذف هذا التسجيل؟")) return;
  try {
    await fetchApi(`/submissions/${submissionId}`, { method: 'DELETE' });
    showToast("تم حذف التسجيل بنجاح", "success");
    await fetchMySubmissions();
    renderSubmissions();
  } catch (error) {
    showToast(error.message, "warning");
  }
}

async function refreshSubmissions() {
  showToast("جاري تحديث التسجيلات...", "success");
  await fetchMySubmissions();
  renderSubmissions();
}

function logout() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

async function init() {
  studentsList.innerHTML = "اختر صفاً لعرض الطلاب";
  document.getElementById("submissionsList").innerHTML = "اختر طالباً لعرض تسجيلاته";
  
  await fetchMyStudents();
  await fetchMySubmissions();
  
  const urlParams = new URLSearchParams(window.location.search);
  const view = urlParams.get('view');
  
  if (view === 'pending') {
    renderAllSubmissionsFiltered('pending');
  } else if (view === 'reviewed') {
    renderAllSubmissionsFiltered('reviewed');
  } else if (view === 'students') {
    document.getElementById("selectedStudentTitle").textContent = "جميع طلابي";
    renderAllStudentsList();
  }
}

init();