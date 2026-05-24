const byId = (id) => document.getElementById(id);
const normalizeHandle = (value) => String(value || "").trim().replace(/^@+/, "").toLowerCase();
const LAST_PROFILE_KEY = "engaja_last_profile_v2";

document.addEventListener("DOMContentLoaded", () => {
  const limitUsername = byId("limitUsername");
  try {
    const lastProfile = localStorage.getItem(LAST_PROFILE_KEY);
    if (limitUsername && lastProfile) {
      limitUsername.textContent = `@${lastProfile}`;
    }
  } catch (e) {
    console.error("Erro ao carregar último perfil:", e);
  }
});