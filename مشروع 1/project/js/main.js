let selectedRole = "";

function selectRole(role, button) {
  selectedRole = role;

  document.querySelectorAll(".roles button").forEach(btn => {
    btn.classList.remove("active");
  });

  button.classList.add("active");
}

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const message = document.getElementById("message");

  message.textContent = "";

  if (!email || !password || !selectedRole) {
    message.textContent = "يرجى إدخال البريد وكلمة المرور واختيار نوع الحساب";
    return;
  }

  if (password.length < 6) {
    message.textContent = "كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل";
    return;
  }

  try {
    const data = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role: selectedRole })
    });

    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("currentUser", JSON.stringify(data.user));

    if (data.user.role === 'manager') {
        window.location.href = "manager.html";
    } else if (data.user.role === 'teacher') {
        window.location.href = "admin.html";
    } else {
        window.location.href = "home.html";
    }
  } catch (error) {
    message.textContent = error.message;
  }
}