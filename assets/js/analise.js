window.engajaMatrix = true;

document.addEventListener("DOMContentLoaded", () => {
const byId = (id) => document.getElementById(id);
const fmt = new Intl.NumberFormat("pt-BR");

const normalizeHandle = (value) => String(value || "").trim().replace(/^@+/, "").toLowerCase();

const buildProfileShell = (handle) => {
  const clean = normalizeHandle(handle || "");
  return {
    handle: clean || "usuario",
    name: "",
    bio: "",
    followers: null,
    following: null,
    posts: null,
    avatarUrl: "",
    avatarBg: "",
    isPrivate: false,
    postsList: []
  };
};

const CACHE_KEY = "engaja_profile_cache";
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 horas
const LIMIT_KEY = "engaja_used_limit_v4";
const LAST_PROFILE_KEY = "engaja_last_profile_v4";

const getProfileCache = () => {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  } catch (e) {
    console.error("Erro ao ler cache:", e);
    return {};
  }
};

const saveProfileToCache = (profile) => {
  if (!profile || !profile.handle) return;
  try {
    const cache = getProfileCache();
    cache[profile.handle] = {
      data: profile,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error("Erro ao salvar no cache:", e);
  }
};

const getCachedProfile = (handle) => {
  const clean = normalizeHandle(handle);
  const cache = getProfileCache();
  const entry = cache[clean];
  if (entry && Date.now() - entry.timestamp < CACHE_EXPIRATION_MS) {
    const data = entry.data;
    
    // Invalida cache se campos essenciais novos estiverem faltando
    if (!("isPrivate" in data)) return null;

    // Se o perfil cacheado não tiver curtidas nos posts (pode ser dado antigo), ignora o cache
    if (Array.isArray(data.postsList) && data.postsList.length > 0) {
      const firstPost = data.postsList[0];
      if (firstPost.likes === undefined || firstPost.likes === 0) {
        // Se o primeiro post tiver 0 likes, pode ser dado antigo sem o campo, tenta buscar de novo
        // Mas apenas se o perfil for famoso, senão 0 pode ser real.
        // Simplificando: se o campo 'likes' não existir, invalida.
        if (!("likes" in firstPost)) return null;
      }
    }
    return entry.data;
  }
  return null;
};

const fetchProfileFromApi = async (handle) => {
  const cached = getCachedProfile(handle);
  if (cached) {
    console.log(`Perfil ${handle} recuperado do cache.`);
    return cached;
  }

  const api = window.engajaApi;
  let profileData;
  if (!api || typeof api.fetchProfile !== "function") {
    profileData = buildProfileShell(handle);
  } else {
    const data = await api.fetchProfile(handle);
    if (!data || typeof data !== "object") {
      profileData = buildProfileShell(handle);
    } else {
      profileData = { ...buildProfileShell(handle), ...data, handle: data.handle || handle };
    }
  }
  
  saveProfileToCache(profileData);
  return profileData;
};

const simForm = byId("simForm");
const simUsername = byId("simUsername");
const simActivate = byId("simActivate");
const confirmModal = byId("confirmModal");
const confirmUsername = byId("confirmUsername");
const confirmPosts = byId("confirmPosts");
const confirmFollowers = byId("confirmFollowers");
const confirmFollowing = byId("confirmFollowing");
const confirmName = byId("confirmName");
const confirmBio = byId("confirmBio");
const confirmAvatar = byId("confirmAvatar");
const privateAlert = byId("privateAlert");
const confirmWarning = byId("confirmWarning");
const confirmActions = byId("confirmActions");
const btnFixUname = byId("btnFixUname");
const btnConfirmUname = byId("btnConfirmUname");
const analysisOverlay = byId("analysisOverlay");
const analysisCard = byId("analysisCard");
const analysisDiagnosis = byId("analysisDiagnosis");
const analysisPct = byId("analysisPct");
const analysisProgressBar = byId("analysisProgressBar");
const analysisLogs = byId("analysisLogs");
const analysisSystemTitle = byId("analysisSystemTitle");
const statusConnection = byId("statusConnection");
const statusData = byId("statusData");
const statusEngagement = byId("statusEngagement");
const analysisScoreText = byId("analysisScoreText");
const analysisScoreFill = byId("analysisScoreFill");

let currentProfile = null;
let analysisTimer = null;
let logTimers = [];
let isAdmin = false;

const checkAdmin = () => {
  const urlParams = new URLSearchParams(window.location.search);
  isAdmin = urlParams.get('admin') === 'true';
  return isAdmin;
};

const hasUsedLimit = () => {
  if (isAdmin) return false;
  try {
    return localStorage.getItem(LIMIT_KEY) === 'true';
  } catch (e) {
    return false;
  }
};

const markLimitUsed = (handle, avatarUrl = '') => {
  if (isAdmin) return;
  try {
    localStorage.setItem(LIMIT_KEY, 'true');
    const profileData = {
      handle: normalizeHandle(handle),
      avatarUrl: avatarUrl
    };
    localStorage.setItem(LAST_PROFILE_KEY, JSON.stringify(profileData));
  } catch (e) {
    console.error("Erro ao salvar limite:", e);
  }
};

const redirectToLimitPage = () => {
  window.location.href = "../limite/index.html";
};

const ensureButtonInner = () => {
  if (!simActivate) return;
  if (!simActivate.querySelector(".btn-inner")) {
    simActivate.innerHTML = `
      <span class="btn-inner">
        <svg class="btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M23 4v6h-6"></path>
          <path d="M1 20v-6h6"></path>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
        <span class="btn-label">&gt;</span>
      </span>`;
  }
};

const clearSimLoading = () => {
  if (!simActivate) return;
  simActivate.classList.remove("is-loading");
  simActivate.disabled = false;
  simActivate.removeAttribute("aria-busy");
  simActivate.style.width = "";
  ensureButtonInner();
  const label = simActivate.querySelector(".btn-label");
  if (label) label.textContent = ">";
};

const setSimLoading = () => {
  if (!simActivate || !simUsername) return;
  const raw = normalizeHandle(simUsername.value);
  if (!raw || !/^[a-z0-9._]{1,30}$/i.test(raw)) {
    clearSimLoading();
    return;
  }
  ensureButtonInner();
  const width = simActivate.offsetWidth;
  simActivate.style.width = `${width}px`;
  simActivate.classList.add("is-loading");
  simActivate.disabled = true;
  simActivate.setAttribute("aria-busy", "true");
  const label = simActivate.querySelector(".btn-label");
  if (label) label.textContent = ">";
};

const safeText = (value) => {
  const text = String(value || "").trim();
  return text ? text : "—";
};

const safeBioText = (value) => {
  const text = String(value || "").trim();
  return text;
};

const setAvatarImage = (el, url, fallback) => {
  if (!el) return;
  if (url) {
    el.style.setProperty("--avatar-image", `url("${url}")`);
    return;
  }
  if (fallback) {
    el.style.backgroundImage = fallback;
    el.style.removeProperty("--avatar-image");
    return;
  }
  el.style.removeProperty("--avatar-image");
  el.style.backgroundImage = "";
};

const formatCount = (value) => {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? fmt.format(num) : "—";
};

const showConfirm = (profile) => {
  if (!confirmModal) return;
  if (confirmUsername) confirmUsername.textContent = `@${profile.handle}`;
  if (confirmPosts) confirmPosts.textContent = formatCount(profile.posts);
  if (confirmFollowers) confirmFollowers.textContent = formatCount(profile.followers);
  if (confirmFollowing) confirmFollowing.textContent = formatCount(profile.following);
  if (confirmName) confirmName.textContent = safeText(profile.name);
  if (confirmBio) confirmBio.textContent = safeBioText(profile.bio);
  if (confirmAvatar) {
    setAvatarImage(confirmAvatar, profile.avatarUrl, profile.avatarBg);
  }

  // Lógica para perfil privado
  if (profile.isPrivate) {
    if (privateAlert) privateAlert.style.display = "flex";
    if (confirmWarning) confirmWarning.style.display = "none";
    if (confirmActions) confirmActions.style.display = "none";
  } else {
    if (privateAlert) privateAlert.style.display = "none";
    if (confirmWarning) confirmWarning.style.display = "flex";
    if (confirmActions) confirmActions.style.display = "flex";
  }

  confirmModal.classList.remove("hidden");
};

const hideConfirm = () => {
  if (confirmModal) confirmModal.classList.add("hidden");
  if (typeof clearSimLoading === "function") {
    clearSimLoading();
  }
};

const clearLogTimers = () => {
  logTimers.forEach((t) => clearTimeout(t));
  logTimers = [];
};

const appendLog = (text, type = "ok") => {
  if (!analysisLogs) return;
  const line = document.createElement("div");
  line.className = `analysis-log ${type}`;
  line.textContent = text;
  analysisLogs.appendChild(line);
  analysisLogs.scrollTop = analysisLogs.scrollHeight;
};

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const getProgress = (elapsed, total) => {
  const t1 = total * 0.55;
  const t2 = total * 0.75;
  const t3 = total * 0.88;
  if (elapsed <= t1) return 85 * easeOut(elapsed / t1);
  if (elapsed <= t2) return 85 + 8 * easeInOut((elapsed - t1) / (t2 - t1));
  if (elapsed <= t3) return 93 + 2 * easeInOut((elapsed - t2) / (t3 - t2));
  return 95 + 5 * easeOut((elapsed - t3) / (total - t3));
};

const captureProfileData = () => {
  if (!currentProfile) return;
  const hasPostsCount = Number(currentProfile.posts || 0) > 0;
  const hasNoPostsList = !currentProfile.postsList || currentProfile.postsList.length === 0;

  const snapshot = {
    handle: currentProfile.handle,
    name: currentProfile.name,
    followers: currentProfile.followers,
    following: currentProfile.following,
    posts: currentProfile.posts,
    bio: currentProfile.bio,
    isPrivate: !!(currentProfile.isPrivate || currentProfile.private) || (hasPostsCount && hasNoPostsList),
    avatarUrl: currentProfile.avatarUrl || "",
    avatarBg: currentProfile.avatarBg || "",
    postsList: Array.isArray(currentProfile.postsList) ? currentProfile.postsList : []
  };
  try {
    sessionStorage.setItem("engajaProfile", JSON.stringify(snapshot));
  } catch (_e) {
    return;
  }
  try {
    localStorage.setItem("engajaProfileSnapshot", JSON.stringify(snapshot));
  } catch (_e) {
    return;
  }
};

const startAnalysis = () => {
  if (!analysisOverlay || !analysisCard || !analysisDiagnosis) return;
  
  if (analysisTimer) {
    clearInterval(analysisTimer);
    analysisTimer = null;
  }
  clearLogTimers();
  document.body.classList.add("hide-sim-seal", "hide-sim-metrics");
  captureProfileData();
  analysisOverlay.classList.remove("hidden");
  analysisOverlay.classList.add("is-fixed");
  analysisCard.classList.remove("hidden");
  analysisCard.style.display = "";
  analysisDiagnosis.classList.add("hidden");
  analysisDiagnosis.style.display = "none";
  if (analysisLogs) analysisLogs.innerHTML = "";
  if (analysisPct) analysisPct.textContent = "0%";
  if (statusConnection) statusConnection.textContent = "INICIANDO";
  if (statusData) statusData.textContent = "AGUARDANDO";
  if (statusEngagement) {
    statusEngagement.textContent = "PROCESSANDO";
    statusEngagement.classList.remove("is-critical");
  }
  document.body.style.overflow = "hidden";
  const handleText = currentProfile ? `@${currentProfile.handle}` : "@usuario";
  if (analysisSystemTitle) {
    analysisSystemTitle.innerHTML = `STATUS DO PERFIL: <span class="profile-handle">${handleText}</span>`;
  }
  const ctaEl = document.querySelector(".analysis-cta-btn");
  if (ctaEl) {
    const clean = currentProfile ? currentProfile.handle : "usuario";
    ctaEl.href = `../resultado-analise/index.html?username=${encodeURIComponent(clean)}`;
  }
  const logs = [
    { t: 200, text: `✓ Conectando ao perfil ${handleText}`, type: "ok", status: () => { if (statusConnection) statusConnection.textContent = "ESTÁVEL"; } },
    { t: 900, text: "✓ Coletando dados públicos", type: "ok", status: () => { if (statusData) statusData.textContent = "OK"; } },
    { t: 1700, text: "✓ Identificando posts recentes", type: "ok" },
    { t: 2600, text: "✓ Calculando média de curtidas", type: "ok" },
    { t: 3400, text: "✓ Calculando média de comentários", type: "ok" },
    { t: 4300, text: "✓ Estimando taxa de engajamento", type: "ok" },
    { t: 5600, text: "✓ Comparando com perfis semelhantes", type: "ok" },
    { t: 7100, text: "✓ Detectando padrões de alcance", type: "ok" },
    { t: 8600, text: "⚠ Analisando possíveis restrições...", type: "warn" },
    { t: 12600, text: "⚠ RESTRIÇÃO ENCONTRADA...", type: "error", status: () => { if (statusEngagement) { statusEngagement.textContent = "CRÍTICO"; statusEngagement.classList.add("is-critical"); } } }
  ];
  logs.forEach((log) => {
    const timer = setTimeout(() => {
      appendLog(log.text, log.type);
      if (log.status) log.status();
    }, log.t);
    logTimers.push(timer);
  });
  const totalDuration = 14000;
  const startAt = Date.now();
  if (analysisProgressBar) analysisProgressBar.style.width = "0%";
  analysisTimer = setInterval(() => {
    const elapsed = Date.now() - startAt;
    const pct = Math.min(100, Math.max(0, getProgress(elapsed, totalDuration)));
    if (analysisProgressBar) analysisProgressBar.style.width = `${pct.toFixed(1)}%`;
    if (analysisPct) analysisPct.textContent = `${Math.round(pct)}%`;
    if (elapsed >= totalDuration) {
      clearInterval(analysisTimer);
      analysisTimer = null;
      if (analysisProgressBar) analysisProgressBar.style.width = "100%";
      if (analysisPct) analysisPct.textContent = "100%";
      analysisCard.classList.add("hidden");
      analysisCard.style.display = "none";
      analysisDiagnosis.classList.remove("hidden");
      analysisDiagnosis.style.display = "";

      // Atualiza o score dinâmico baseado no quiz
      try {
        const quizDataRaw = localStorage.getItem("quiz_analysis_data");
        if (quizDataRaw) {
          const quizData = JSON.parse(quizDataRaw);
          if (quizData && quizData.engRate) {
            // Converte a taxa de engajamento (26-38) em um score (ex: 26-38)
            const score = Math.round(quizData.engRate);
            if (analysisScoreText) analysisScoreText.textContent = `Score do Perfil: ${score} / 100`;
            if (analysisScoreFill) analysisScoreFill.style.width = `${score}%`;
          }
        }
      } catch (e) {
        console.error("Erro ao carregar score do quiz:", e);
      }
    }
  }, 120);
};

if (simActivate) {
  simActivate.addEventListener("click", () => {
    if (simActivate.classList.contains("is-loading")) return;
    setTimeout(setSimLoading, 0);
  });
}

if (simForm && simUsername) {
  simForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (simActivate && simActivate.classList.contains("is-loading")) return;
    
    // Check limit before proceeding
    if (hasUsedLimit()) {
      redirectToLimitPage();
      return;
    }
    
    setTimeout(setSimLoading, 0);
    const handle = normalizeHandle(simUsername.value);
    if (!handle) {
      clearSimLoading();
      return;
    }
    try {
      currentProfile = await fetchProfileFromApi(handle);
    } catch (_e) {
      currentProfile = buildProfileShell(handle);
    }
    clearSimLoading();
    showConfirm(currentProfile);
  });
}

if (btnFixUname) {
  btnFixUname.addEventListener("click", () => {
    hideConfirm();
    clearSimLoading();
    if (simUsername) simUsername.focus();
  });
}

if (btnConfirmUname) {
  btnConfirmUname.addEventListener("click", () => {
    hideConfirm();
    setTimeout(startAnalysis, 0);
  });
}

  window.scrollTo(0, 0);
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  
  // Check admin status
  checkAdmin();
  
  // Check if limit is already used
  if (hasUsedLimit()) {
    redirectToLimitPage();
  }
});
