const toggleBtn = document.getElementById("theme-toggle");
const root = document.documentElement;

// Cargar preferencia
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  root.classList.add("dark");
  toggleBtn.textContent = "☀️";
}

// Toggle manual
toggleBtn.addEventListener("click", () => {
  const isDark = root.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  toggleBtn.textContent = isDark ? "☀️" : "🌙";
});
