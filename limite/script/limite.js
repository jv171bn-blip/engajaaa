const byId = (id) => document.getElementById(id);
const normalizeHandle = (value) => String(value || "").trim().replace(/^@+/, "").toLowerCase();
const LAST_PROFILE_KEY = "engaja_last_profile_v2";

document.addEventListener("DOMContentLoaded", () => {
  const limitUsername = byId("limitUsername");
  const limitAvatarImg = byId("limitAvatarImg");
  try {
    const lastProfileRaw = localStorage.getItem(LAST_PROFILE_KEY);
    if (lastProfileRaw) {
      const profileData = JSON.parse(lastProfileRaw);
      if (limitUsername && profileData.handle) {
        limitUsername.textContent = `@${profileData.handle}`;
      }
      if (limitAvatarImg && profileData.avatarUrl) {
        limitAvatarImg.src = profileData.avatarUrl;
        limitAvatarImg.style.display = "block";
        const placeholder = document.querySelector(".limit-avatar-placeholder");
        if (placeholder) {
          placeholder.style.display = "none";
        }
      }
    }
  } catch (e) {
    console.error("Erro ao carregar último perfil:", e);
  }
});