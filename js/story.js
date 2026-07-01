const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

if (!currentUser || currentUser.role !== "student") {
  window.location.href = "index.html";
}

const storyId = sessionStorage.getItem("currentStoryId");

if (!storyId) {
  window.location.href = "stories.html";
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

let story = null;
let currentProgress = 0;

async function fetchStoryAndStatus() {
  try {
    const stories = await fetchApi('/stories');
    story = stories.find(s => s.id === parseInt(storyId));

    if (!story) {
      showToast("القصة غير موجودة", "error");
      return;
    }

    document.getElementById("storyTitle").textContent = story.title;
    document.getElementById("storyText").textContent = story.text;
    let imageUrl = `images/story1.jpg`;
    if (story.imagePath) {
      if (story.imagePath.startsWith('/images')) {
        imageUrl = `.${story.imagePath}`;
      } else {
        imageUrl = `${window.BACKEND_URL || 'http://localhost:3000'}${story.imagePath}`;
      }
    }
    document.getElementById("storyImage").src = imageUrl;

    // Load progress
    const progresses = await fetchApi('/progress');
    const myProgress = progresses.find(p => p.storyId === story.id);
    if (myProgress) {
        currentProgress = myProgress.percentage;
    }

    loadFavoriteState();
    initQuiz(story.title);
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function saveProgress(value) {
  if (value > currentProgress) {
    currentProgress = value;
    try {
      await fetchApi(`/progress/${storyId}`, {
        method: 'PUT',
        body: JSON.stringify({ percentage: value })
      });
    } catch (error) {
      console.error("Error saving progress", error);
    }
  }
}

let mediaRecorder;
let audioChunks = [];
let timerInterval = null;
let accumulatedSeconds = 0;
let currentSegmentSeconds = 0;
let isRecording = false;
let currentStream = null;
let allSegments = [];

window.recordedAudioBlob = null;
window.recordSent = false;

function formatTime(sec) {
  const minutes = String(Math.floor(sec / 60)).padStart(2, "0");
  const secs = String(sec % 60).padStart(2, "0");
  return `${minutes}:${secs}`;
}

function updateTimer() {
  const timer = document.getElementById("recordTimer");
  if (timer) timer.textContent = formatTime(accumulatedSeconds + currentSegmentSeconds);
}

async function startRecording() {
  if (isRecording) {
    showToast("التسجيل يعمل حالياً", "warning");
    return;
  }

  try {
    currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(currentStream, {
      mimeType: "audio/webm"
    });

    audioChunks = [];
    window.recordSent = false;

    isRecording = true;
    currentSegmentSeconds = 0;
    updateTimer();

    const status = document.getElementById("recordStatus");
    if (status) status.textContent = allSegments.length > 0 ? "جاري استئناف التسجيل..." : "جاري التسجيل...";

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      currentSegmentSeconds++;
      updateTimer();
    }, 1000);

    mediaRecorder.ondataavailable = function (event) {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = function () {
      clearInterval(timerInterval);
      timerInterval = null;
      isRecording = false;

      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
      }

      const segmentBlob = new Blob(audioChunks, { type: "audio/webm" });

      if (segmentBlob.size > 0) {
        allSegments.push(segmentBlob);
        accumulatedSeconds += currentSegmentSeconds;
        currentSegmentSeconds = 0;
      }

      if (allSegments.length === 0) {
        showToast("لم يتم تسجيل صوت، حاول مرة أخرى", "error");
        return;
      }

      const combinedBlob = new Blob(allSegments, { type: "audio/webm" });
      const audioUrl = URL.createObjectURL(combinedBlob);
      window.recordedAudioBlob = combinedBlob;

      const audioPlayer = document.getElementById("audioPlayer");
      if (audioPlayer) {
        audioPlayer.src = audioUrl;
        audioPlayer.load();
      }

      const status = document.getElementById("recordStatus");
      if (status) status.textContent = `تم إيقاف التسجيل مؤقتاً (الأجزاء: ${allSegments.length})`;

      saveProgress(20);
      showToast("تم حفظ التسجيل مؤقتاً. اضغط بدء للتكملة.", "success");
    };

    mediaRecorder.start();
    showToast(allSegments.length > 0 ? "تم استئناف التسجيل" : "بدأ التسجيل", "success");

  } catch (error) {
    showToast("يجب السماح باستخدام الميكروفون", "error");
  }
}

function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state !== "recording") {
    showToast("لا يوجد تسجيل يعمل حالياً", "warning");
    return;
  }

  mediaRecorder.stop();
}

function resetRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }

  clearInterval(timerInterval);
  timerInterval = null;

  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }

  accumulatedSeconds = 0;
  currentSegmentSeconds = 0;
  isRecording = false;
  audioChunks = [];
  allSegments = [];
  window.recordedAudioBlob = null;
  window.recordSent = false;

  updateTimer();

  const status = document.getElementById("recordStatus");
  if (status) status.textContent = "لم يبدأ التسجيل بعد";

  const audioPlayer = document.getElementById("audioPlayer");
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.removeAttribute("src");
    audioPlayer.load();
  }

  showToast("تمت إعادة التسجيل بالكامل", "success");
}

async function sendRecording() {
  if (!story) {
    showToast("لا يمكن إرسال تسجيل لقصة غير موجودة", "error");
    return;
  }

  if (!window.recordedAudioBlob) {
    showToast("سجل صوتك أولاً قبل الإرسال", "warning");
    return;
  }

  const formData = new FormData();
  formData.append('storyId', storyId);
  // Need to provide a filename for the blob
  formData.append('audio', window.recordedAudioBlob, 'recording.webm');

  try {
    await fetchApi('/submissions', {
      method: 'POST',
      body: formData
    });

    window.recordSent = true;
    saveProgress(50);
    showToast("تم إرسال التسجيل للمعلم بنجاح", "success");
  } catch (error) {
    showToast(error.message, "error");
  }
}

function finishStory() {
  if (!window.recordedAudioBlob) {
    showToast("لازم تسجل صوتك قبل إنهاء القصة", "warning");
    return;
  }

  if (!window.recordSent) {
    showToast("لازم ترسل التسجيل للمعلم أولاً", "warning");
    return;
  }

  if (!isQuizPassed) {
    showToast("يجب الإجابة على جميع الأسئلة بشكل صحيح أولاً", "warning");
    return;
  }

  saveProgress(100);
  showToast("تم إنهاء القصة بنجاح", "success");

  setTimeout(() => {
    window.location.href = "home.html";
  }, 1200);
}

let isFavorite = false;

async function loadFavoriteState() {
  try {
    const favorites = await fetchApi('/favorites');
    isFavorite = favorites.some(f => f.storyId === parseInt(storyId));

    updateFavoriteUI();
  } catch (error) {
    console.error("Error loading favorite state", error);
  }
}

function updateFavoriteUI() {
  const btn = document.getElementById("favBtn");
  const icon = document.getElementById("favIcon");
  const text = document.getElementById("favText");

  if (!btn || !icon || !text) return;

  if (isFavorite) {
    icon.classList.remove("bx-heart");
    icon.classList.add("bxs-heart");
    btn.classList.add("active");
    text.textContent = "في المفضلة";
  } else {
    icon.classList.remove("bxs-heart");
    icon.classList.add("bx-heart");
    btn.classList.remove("active");
    text.textContent = "إضافة إلى المفضلة";
  }
}

async function toggleFavorite() {
  try {
    const result = await fetchApi(`/favorites/${storyId}`, {
      method: 'POST'
    });

    isFavorite = result.status === 'added';
    updateFavoriteUI();
    
    if (isFavorite) {
      showToast("تمت إضافة القصة إلى المفضلة", "success");
    } else {
      showToast("تمت إزالة القصة من المفضلة", "warning");
    }
  } catch (error) {
    showToast(error.message, "error");
  }
}

// Quiz System data and handlers
const storyQuizzes = {
  "مغامرة في جزيرة الكنز": [
    {
      question: "ماذا وجد الطفل الشجاع؟",
      options: ["خريطة قديمة", "صندوق الذهب", "سيفاً لامعاً"],
      answer: 0
    },
    {
      question: "ما هو سر النجاح الذي تعلمه الطفل؟",
      options: ["القوة والسرعة", "الشجاعة والتفكير", "الحظ الجيد"],
      answer: 1
    }
  ],
  "الأرنب الذكي": [
    {
      question: "أين كان يعيش الأرنب الصغير؟",
      options: ["في الحقل", "في الغابة", "في الصحراء"],
      answer: 1
    },
    {
      question: "ماذا فعل الأرنب لينقذ أصدقاءه؟",
      options: ["استخدم ذكاءه", "هرب وحيداً", "طلب المساعدة من الأسد"],
      answer: 0
    }
  ],
  "رحلة إلى النجوم": [
    {
      question: "بماذا حلم الطفل الصغير؟",
      options: ["بالسفر إلى الفضاء", "بالبقاء في المنزل", "بأن يصبح معلماً"],
      answer: 0
    },
    {
      question: "كيف تبدأ الأحلام الكبيرة؟",
      options: ["بالنوم الطويل", "بخطوة صغيرة", "بالمال الوفير"],
      answer: 1
    }
  ],
  "كهف الأسرار": [
    {
      question: "ماذا كان على المغامر أن يفعل ليصل إلى النهاية؟",
      options: ["أن يركض سريعاً", "أن يحل الألغاز", "أن ينام في الكهف"],
      answer: 1
    },
    {
      question: "ما هو أعظم كنز اكتشفه المغامر؟",
      options: ["المعرفة", "الذهب والفضة", "الأحجار الكريمة"],
      answer: 0
    }
  ]
};

const defaultQuiz = [
  {
    question: "ما هو الدرس المستفاد الرئيسي من هذه القصة؟",
    options: ["العمل الجاد والشجاعة", "الكسل والتراخي", "الاعتماد على الآخرين دائماً"],
    answer: 0
  }
];

let isQuizPassed = false;
let userAnswers = {};

function initQuiz(storyTitle) {
  let quiz = defaultQuiz;
  if (story && story.quizText) {
    try {
      quiz = JSON.parse(story.quizText);
    } catch (e) {
      console.error("Error parsing quizText", e);
    }
  } else {
    quiz = storyQuizzes[storyTitle] || defaultQuiz;
  }

  const section = document.getElementById("quizSection");
  const container = document.getElementById("quizContainer");

  if (!section || !container) return;

  section.style.display = "block";
  container.innerHTML = "";
  isQuizPassed = false;
  userAnswers = {};

  quiz.forEach((item, qIdx) => {
    const qDiv = document.createElement("div");
    qDiv.className = "quiz-question-box";
    qDiv.style.background = "#f8fafc";
    qDiv.style.padding = "15px";
    qDiv.style.borderRadius = "12px";
    qDiv.style.border = "1px solid #e2e8f0";

    const titleEl = document.createElement("p");
    titleEl.style.fontWeight = "bold";
    titleEl.style.margin = "0 0 10px 0";
    titleEl.style.fontSize = "16px";
    titleEl.textContent = `${qIdx + 1}. ${item.question}`;
    qDiv.appendChild(titleEl);

    const optsDiv = document.createElement("div");
    optsDiv.style.display = "flex";
    optsDiv.style.flexDirection = "column";
    optsDiv.style.gap = "8px";

    item.options.forEach((opt, oIdx) => {
      const btn = document.createElement("button");
      btn.textContent = opt;
      btn.style.padding = "10px 15px";
      btn.style.border = "1px solid #cbd5e1";
      btn.style.background = "#ffffff";
      btn.style.borderRadius = "8px";
      btn.style.cursor = "pointer";
      btn.style.textAlign = "right";
      btn.style.fontWeight = "600";
      btn.style.fontSize = "14px";
      btn.style.transition = "all 0.2s";

      btn.onclick = () => {
        // Clear previous selections for this question
        Array.from(optsDiv.children).forEach(b => {
          b.style.background = "#ffffff";
          b.style.color = "#000000";
          b.style.borderColor = "#cbd5e1";
        });

        // Set active option state
        userAnswers[qIdx] = oIdx;

        // Neutral selection styling (blue style, does not reveal correctness instantly)
        btn.style.background = "#eff6ff";
        btn.style.borderColor = "#bfdbfe";
        btn.style.color = "#1e40af";

        checkQuizStatus(quiz);
      };

      optsDiv.appendChild(btn);
    });

    qDiv.appendChild(optsDiv);
    container.appendChild(qDiv);
  });
}

function checkQuizStatus(quiz) {
  const msgEl = document.getElementById("quizMessage");
  let allCorrect = true;

  quiz.forEach((item, qIdx) => {
    if (userAnswers[qIdx] !== item.answer) {
      allCorrect = false;
    }
  });

  if (Object.keys(userAnswers).length < quiz.length) {
    allCorrect = false;
  }

  if (allCorrect) {
    isQuizPassed = true;
    msgEl.style.display = "block";
    msgEl.style.background = "#dcfce7";
    msgEl.style.color = "#15803d";
    msgEl.style.border = "1px solid #86efac";
    msgEl.textContent = "إجابة رائعة! لقد أجبت على جميع الأسئلة بشكل صحيح 🎉";
  } else {
    isQuizPassed = false;
    if (Object.keys(userAnswers).length === quiz.length) {
      msgEl.style.display = "block";
      msgEl.style.background = "#fee2e2";
      msgEl.style.color = "#b91c1c";
      msgEl.style.border = "1px solid #fca5a5";
      msgEl.textContent = "بعض الإجابات غير صحيحة، حاول مجدداً 🧐";
    } else {
      msgEl.style.display = "none";
    }
  }
}

fetchStoryAndStatus();
updateTimer();