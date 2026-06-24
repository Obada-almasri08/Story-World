const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

if (!currentUser || currentUser.role !== "student") {
  window.location.href = "index.html";
}

const studentNameEl = document.getElementById("studentName");
if (studentNameEl) {
  studentNameEl.textContent = currentUser.name || "طالب";
}

async function renderMessages() {
  const container = document.getElementById("messagesList");
  container.innerHTML = "جاري التحميل...";

  try {
    const submissions = await fetchApi('/submissions');
    
    const myMessages = submissions.filter(sub => sub.rating);

    container.innerHTML = "";

    if (myMessages.length === 0) {
      container.innerHTML = "لا توجد رسائل تقييم من المعلم حالياً";
      return;
    }

    myMessages.forEach(async (msg) => {
      const card = document.createElement("div");
      card.className = "message-card";

      card.innerHTML = `
        <div class="msg-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #edf2f7; padding-bottom: 12px; margin-bottom: 12px;">
          <h3 style="margin: 0;">تقييم قصة: ${msg.story ? msg.story.title : "قصة محذوفة"}</h3>
          <span class="rating ${msg.rating ? msg.rating.replace(/\s+/g, '') : ''}">${msg.rating || ''}</span>
        </div>
        <div class="note">
          <strong>ملاحظة المعلم:</strong>
          <p style="margin: 5px 0 0 0;">${msg.note || "لا توجد ملاحظات إضافية"}</p>
        </div>
        <div class="msg-footer" style="margin-top: 15px; text-align: left;">
          <small style="color: #94a3b8;">تاريخ التقييم: ${new Date(msg.createdAt).toLocaleDateString("ar-SA")}</small>
        </div>
      `;

      container.appendChild(card);

      if (!msg.isRead) {
        try {
          await fetchApi(`/submissions/${msg.id}/read`, { method: 'PUT' });
        } catch (error) {
          console.error("Error marking message as read", error);
        }
      }
    });

  } catch (error) {
    container.innerHTML = "حدث خطأ في جلب الرسائل";
  }
}

function logout() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

renderMessages();