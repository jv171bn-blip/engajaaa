
document.addEventListener("DOMContentLoaded", () => {
const byId = (id) => document.getElementById(id);
const fmt = new Intl.NumberFormat("pt-BR");

const LIMIT_KEY = "engaja_used_limit_v9";
const LAST_PROFILE_KEY = "engaja_last_profile_v9";
const OPTIMIZATION_STATE_KEY = "engaja_optimization_state_v9";

const checkAdmin = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('admin') === 'true';
};

const markLimitUsed = (handle, avatarUrl = '') => {
  if (checkAdmin()) return;
  try {
    localStorage.setItem(LIMIT_KEY, 'true');
    const profileData = {
      handle: handle,
      avatarUrl: avatarUrl
    };
    localStorage.setItem(LAST_PROFILE_KEY, JSON.stringify(profileData));
  } catch (e) {
    console.error("Erro ao salvar limite:", e);
  }
};

const safeText = (value) => {
  const text = String(value || "").trim();
  return text ? text : "—";
};

const formatCount = (value) => {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? fmt.format(num) : "—";
};

const animateValue = (element, start, end, duration, suffix = "") => {
  if (!element) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const current = (progress * (end - start) + start);
    
    if (suffix) {
      element.textContent = `${current.toFixed(1)}${suffix}`;
    } else {
      element.textContent = fmt.format(Math.floor(current));
    }
    
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
};

const getUsernameFromUrl = () => {
  try {
    const url = new URL(window.location.href);
    return (url.searchParams.get("username") || url.searchParams.get("user") || url.searchParams.get("handle") || "").trim();
  } catch {
    return "";
  }
};

const loadProfile = () => {
  try {
    const fromSession = sessionStorage.getItem("engajaProfile");
    const fromStorage = localStorage.getItem("engajaProfileSnapshot") || localStorage.getItem("engaja_profile_snapshot");
    const quizDataRaw = localStorage.getItem("quiz_analysis_data");
    let quizData = null;
    
    try {
      quizData = quizDataRaw ? JSON.parse(quizDataRaw) : null;
    } catch (e) {
      console.error("Erro ao processar quizData:", e);
    }
    
    let data = {};
    try {
      data = (fromSession || fromStorage) ? JSON.parse(fromSession || fromStorage) : {};
    } catch (e) {
      console.error("Erro ao processar profile data:", e);
    }
    
    const clean = String(data.handle || data.username || getUsernameFromUrl() || "usuario").replace(/^@+/, "").toLowerCase();
    
    let engagementRate = data.engagementRate ?? data.rateCurrent ?? null;
    let recoveryEstimate = data.recoveryEstimate ?? data.recoveryPercent ?? null;
    
    if (quizData && quizData.engRate) {
      engagementRate = quizData.engRate;
      recoveryEstimate = (quizData.similarRate - quizData.engRate) / quizData.engRate * 100;
    }

    const postsList = Array.isArray(data.postsList) ? data.postsList : [];
    const postsCount = Number.isFinite(Number(data.posts || data.postsCount)) ? Number(data.posts || data.postsCount) : null;
    
    const isPrivate = !!(data.isPrivate || data.private) || (postsCount > 0 && postsList.length === 0);

    return {
      handle: clean,
      name: data.name || data.fullName || "",
      bio: data.bio || data.biography || "",
      followers: Number.isFinite(Number(data.followers || data.followersCount)) ? Number(data.followers || data.followersCount) : null,
      following: Number.isFinite(Number(data.following || data.followsCount)) ? Number(data.following || data.followsCount) : null,
      posts: postsCount,
      avatarUrl: data.avatarUrl || "",
      avatarBg: data.avatarBg || "",
      isPrivate: isPrivate,
      postsList: postsList,
      engagementRate: engagementRate,
      recoveryEstimate: recoveryEstimate,
      similarRate: quizData ? quizData.similarRate : null
    };
  } catch {
    return {
      handle: "usuario",
      name: "",
      bio: "",
      followers: null,
      following: null,
      posts: null,
      avatarUrl: "",
      avatarBg: "",
      postsList: [],
      engagementRate: null,
      recoveryEstimate: null
    };
  }
};

const profile = loadProfile();

const profileAvatar = byId("profileAvatar");
const profileName = byId("profileName");
const headerProfileName = byId("headerProfileName");
const profileBio = byId("profileBio");
const metricFollowers = byId("metricFollowers");
const metricFollowing = byId("metricFollowing");
const metricPosts = byId("metricPosts");
const postsGrid = byId("postsGrid");
const postsEmpty = byId("postsEmpty");
const rateCurrent = byId("rateCurrent");
const rateSimilar = byId("rateSimilar");
const rateCurrentVar = byId("rateCurrentVar");
const rateSimilarVar = byId("rateSimilarVar");
const simulateBtn = byId("simulateBtn");
const simNote = byId("simNote");
const finalIndicator = byId("finalIndicator");
const ctaAvatarImg = byId("ctaAvatarImg");
const ctaHandle = byId("ctaHandle");

const loadMoreBtn = byId("loadMoreBtn");

if (profileAvatar) {
  if (profile.avatarUrl) {
    profileAvatar.style.backgroundImage = `url("${profile.avatarUrl}")`;
  } else if (profile.avatarBg) {
    profileAvatar.style.backgroundImage = profile.avatarBg;
  } else {
    profileAvatar.style.backgroundImage = "";
  }
}

if (ctaAvatarImg) {
  if (profile.avatarUrl) {
    ctaAvatarImg.src = profile.avatarUrl;
  } else if (profile.avatarBg) {
    ctaAvatarImg.style.background = profile.avatarBg;
  }
}

if (ctaHandle) {
  ctaHandle.textContent = `@${profile.handle}`;
}
if (profileName) profileName.textContent = safeText(profile.name);
if (headerProfileName) headerProfileName.textContent = `@${profile.handle}`;
if (profileBio) profileBio.textContent = safeText(profile.bio);
if (metricFollowers) metricFollowers.textContent = formatCount(profile.followers);
if (metricFollowing) metricFollowing.textContent = formatCount(profile.following);
if (metricPosts) metricPosts.textContent = formatCount(profile.posts);

const renderPosts = (optimizedState = null) => {
  if (!postsGrid) return;
  postsGrid.innerHTML = "";
  const list = Array.isArray(profile.postsList) ? profile.postsList : [];
  const total = list.length;
  
  const updatePerformanceBar = (score = null) => {
    const perfScoreEl = byId("perfScore");
    const perfBarFill = byId("perfBarFill");
    if (!perfScoreEl || !perfBarFill) return;

    let finalScore = score;
    if (finalScore === null) {
      if (total > 0) {
        if (profile.engagementRate) {
          finalScore = Math.floor(profile.engagementRate);
        } else {
          const handle = profile.handle || "usuario";
          let hash = 0;
          for (let i = 0; i < handle.length; i++) {
            hash = (hash << 5) - hash + handle.charCodeAt(i);
            hash |= 0;
          }
          const seed = Math.abs(hash);
          const baseScore = 25 + (seed % 15);
          finalScore = baseScore;
        }
      } else {
        finalScore = 0;
      }
    }

    setTimeout(() => {
      perfScoreEl.textContent = finalScore;
      perfBarFill.style.width = `${finalScore}%`;
      if (optimizedState) {
        perfBarFill.style.background = "linear-gradient(90deg, #22c55e, #4ade80)";
        perfBarFill.style.boxShadow = "0 0 25px rgba(34, 197, 94, 0.6)";
        const perfValueText = document.querySelector(".perf-value");
        if (perfValueText) {
          perfValueText.style.color = "#4ade80";
          perfValueText.style.textShadow = "0 0 10px rgba(74, 222, 128, 0.5)";
        }
      }
    }, 800);
  };

  if (optimizedState && optimizedState.perfScore) {
    updatePerformanceBar(optimizedState.perfScore);
  } else {
    updatePerformanceBar();
  }
  
  if (!total) {
    if (postsEmpty) {
      postsEmpty.style.display = "flex";
      
      if (profile.isPrivate) {
        const perfContainer = document.getElementById("perfContainer");
        const perfBenchmark = document.querySelector(".perf-benchmark");
        const privateAlert = document.getElementById("privateAlert");
        
        if (perfContainer) perfContainer.style.display = "none";
        if (perfBenchmark) perfBenchmark.style.display = "none";
        if (privateAlert) privateAlert.style.display = "flex";

        postsEmpty.innerHTML = `
          <div class="private-account-view">
            <div class="private-lock-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="5" y="11" width="14" height="10" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h3 class="private-title">Esta conta é privada</h3>
            <p class="private-text">Deixe sua conta pública para uma análise certeira.</p>
          </div>
        `;
        postsEmpty.style.border = "none";
        postsEmpty.style.background = "transparent";
        postsEmpty.style.padding = "20px";
      } else {
        postsEmpty.innerHTML = `
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </div>
          <h3 class="empty-text">Ainda não há nenhum post</h3>
        `;
      }
    }
    if (loadMoreBtn) loadMoreBtn.style.display = "none";
    return;
  }
  
  if (postsEmpty) postsEmpty.style.display = "none";
  
  const postsWithEng = list.map((p, idx) => {
    const l = p.likes ?? p.likesCount ?? p.likeCount ?? 0;
    const c = p.comments ?? p.commentsCount ?? p.commentCount ?? 0;
    return {
      index: idx,
      eng: l + (c * 3),
      likes: l,
      comments: c
    };
  });

  const sortedByEng = [...postsWithEng].sort((a, b) => b.eng - a.eng);
  const maxEng = sortedByEng.length > 0 ? sortedByEng[0].eng : 1;
  const minEng = sortedByEng.length > 0 ? sortedByEng[sortedByEng.length - 1].eng : 0;
  const bestPostIdx = sortedByEng.length > 0 ? sortedByEng[0].index : 0;

  if (total > 3) {
    if (loadMoreBtn) {
      loadMoreBtn.style.display = "block";
      loadMoreBtn.textContent = "Ver Mais";
      loadMoreBtn.onclick = () => {
        if (postsGrid.classList.contains("is-collapsed")) {
          postsGrid.classList.remove("is-collapsed");
          postsGrid.classList.add("is-expanded");
          postsGrid.style.maxHeight = "2000px"; 
          loadMoreBtn.textContent = "Ver Menos";
        } else {
          postsGrid.classList.add("is-collapsed");
          postsGrid.classList.remove("is-expanded");
          postsGrid.style.maxHeight = "280px";
          loadMoreBtn.textContent = "Ver Mais";
          postsGrid.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      };
    }
  } else {
    if (loadMoreBtn) loadMoreBtn.style.display = "none";
    if (postsGrid) postsGrid.classList.remove("is-collapsed");
  }

  for (let i = 0; i < total; i++) {
    const sortedPost = sortedByEng[i];
    const postData = list[sortedPost.index] || {};
    const pEng = sortedPost;
    const post = document.createElement("div");
    
    const isBest = i === 0;
    post.className = `post-card ${isBest ? "is-best" : "is-other"}`;

    const thumbContainer = document.createElement("div");
    thumbContainer.className = "post-thumb-container";

    if (isBest) {
      const badge = document.createElement("div");
      badge.className = "best-badge";
      badge.textContent = "🏆 Melhor Conteúdo";
      thumbContainer.appendChild(badge);
    }

    const thumb = document.createElement("div");
    thumb.className = "post-thumb";
    const imgUrl = postData.image || postData.imageUrl || postData.thumb || "";
    
    if (imgUrl) {
      const img = new Image();
      img.onload = () => {
        thumb.style.backgroundImage = `url("${imgUrl}")`;
        thumb.style.opacity = "1";
      };
      img.onerror = () => {
        thumb.style.background = "linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.1))";
        thumb.innerHTML = '<div style="display:grid;place-items:center;height:100%;color:rgba(255,255,255,0.2);font-size:10px;">Indisponível</div>';
      };
      thumb.style.opacity = "0";
      thumb.style.transition = "opacity 0.3s ease";
      img.src = imgUrl;
    }
    
    thumbContainer.appendChild(thumb);

    const metrics = document.createElement("div");
    metrics.className = "post-metrics";
    
    let likesCount, commentsCount, perfScore;
    
    if (optimizedState && optimizedState.postLikes && optimizedState.postComments && optimizedState.postPerfs) {
      likesCount = optimizedState.postLikes[i] || pEng.likes;
      commentsCount = optimizedState.postComments[i] || pEng.comments;
      perfScore = optimizedState.postPerfs[i] || 0;
    } else {
      likesCount = pEng.likes;
      commentsCount = pEng.comments;
      
      const rangeEng = maxEng - minEng || 1;
      const normalized = (pEng.eng - minEng) / rangeEng;
      const baseEng = profile.engagementRate ? Number(profile.engagementRate) : 32;
      
      if (isBest) {
        perfScore = Math.floor(baseEng * (1.2 + (normalized * 0.3)));
        perfScore = Math.min(65, perfScore);
      } else {
        perfScore = Math.floor(baseEng * (0.6 + (normalized * 0.5)));
        perfScore = Math.min(Math.floor(baseEng * 1.1), perfScore);
      }
      
      perfScore = Math.max(15, perfScore);
    }
    
    metrics.innerHTML = `
      <span class="post-likes-val" data-val="${likesCount}" style="font-size:13px; font-weight:800; color:#fff; text-shadow:0 1px 4px rgba(0,0,0,0.5); display:flex; align-items:center; gap:4px;">❤️ ${formatCount(likesCount)}</span>
      <span class="post-comments-val" data-val="${commentsCount}" style="font-size:13px; font-weight:800; color:#fff; text-shadow:0 1px 4px rgba(0,0,0,0.5); display:flex; align-items:center; gap:4px;">💬 ${formatCount(commentsCount)}</span>
    `;
    thumbContainer.appendChild(metrics);
    post.appendChild(thumbContainer);

    const footer = document.createElement("div");
    footer.className = "post-perf-footer";

    const labelText = "PERFORMANCE";
    const perfIcon = optimizedState ? "✅" : "⚠️";

    footer.innerHTML = `
      <div class="post-perf-label">${labelText}</div>
      <div class="post-perf-row">
        <div class="post-perf-bar-bg">
          <div class="post-perf-bar-fill post-perf-fill-el" style="width: ${perfScore}%"></div>
        </div>
        <div class="post-perf-num post-perf-val-el" data-val="${perfScore}" style="display:flex; align-items:center; gap:2px;">
          ${perfScore}% <span style='font-size:10px;'>${perfIcon}</span>
        </div>
      </div>
    `;
    
    post.appendChild(footer);
    postsGrid.appendChild(post);
  }
};

const rateValue = profile.engagementRate;
const simValue = profile.similarRate;

const dropValue = (simValue - rateValue).toFixed(1);
const growthPotential = (dropValue * 1.15).toFixed(1);
const currentLoss = (dropValue * 0.92).toFixed(1);

if (rateCurrent) {
  if (Number.isFinite(Number(rateValue))) {
    rateCurrent.textContent = `${Number(rateValue).toFixed(1)}%`;
    if (rateCurrentVar) {
      rateCurrentVar.textContent = `▼ -${currentLoss}%`;
    }
  } else {
    rateCurrent.textContent = "—";
  }
}

if (rateSimilar) {
  if (Number.isFinite(Number(simValue))) {
    rateSimilar.textContent = `${Number(simValue).toFixed(1)}%`;
    if (rateSimilarVar) {
      rateSimilarVar.textContent = `▲ +${growthPotential}%`;
    }
  } else {
    rateSimilar.textContent = "—";
  }
}

const initReveal = () => {
  const items = Array.from(document.querySelectorAll(".reveal"));
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { 
      threshold: 0.01,
      rootMargin: "0px 0px -20px 0px"
    }
  );
  items.forEach((el) => obs.observe(el));
};

const startProcessing = () => {
  const modal = byId("processingModal");
  const spinnerFill = byId("spinnerFill");
  const percentageText = byId("percentageText");
  const statusMain = byId("statusMain");
  const statusSub = byId("statusSub");
  const carouselTrack = byId("modalCarouselTrack");
  const modalCarousel = document.querySelector(".modal-carousel");
  
  if (!modal) return;

  if (profile.isPrivate) {
    if (modalCarousel) modalCarousel.style.display = "none";
  } else if (carouselTrack) {
    if (modalCarousel) modalCarousel.style.display = "block";
    carouselTrack.innerHTML = "";
    const labels = ["Conteúdo analisado", "Engajamento avaliado", "Performance calculada", "Potencial identificado"];
    
    // Garantir que sempre tenha pelo menos 6 itens para animação
    let postsToUse = [...profile.postsList];
    if (postsToUse.length < 3) {
      // Adicionar posts falsos se não houver suficientes
      const fakePosts = [
        { image: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=200&h=200&fit=crop" },
        { image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=200&fit=crop" },
        { image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop" },
        { image: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=200&h=200&fit=crop" },
        { image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200&fit=crop" },
        { image: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=200&h=200&fit=crop" }
      ];
      postsToUse = [...postsToUse, ...fakePosts].slice(0, 6);
    }
    
    const displayList = [...postsToUse, ...postsToUse];
    
    displayList.forEach((post, i) => {
      const item = document.createElement("div");
      item.className = "carousel-item";
      const imgUrl = post.image || post.imageUrl || post.thumb || "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=200&h=200&fit=crop";
      const label = labels[i % labels.length];
      
      item.innerHTML = `
        <img src="${imgUrl}" alt="Post">
        <div class="carousel-item-label">${label}</div>
      `;
      carouselTrack.appendChild(item);
    });
  }

  modal.classList.add("is-active");

  const duration = 8000 + Math.random() * 4000;
  const startTime = Date.now();
  
  const statusUpdates = profile.isPrivate ? [
    { pct: 0, main: "Sincronizando dados...", sub: "Conectando aos servidores de análise" },
    { pct: 15, main: "Verificando restrições...", sub: "Validando limitações do perfil privado" },
    { pct: 30, main: "Processando perfil...", sub: "Avaliando metadados e autoridade" },
    { pct: 50, main: "Analisando padrões...", sub: "Identificando gargalos de performance" },
    { pct: 70, main: "Comparando nichos...", sub: "Validando contra perfis similares ativos" },
    { pct: 85, main: "Calculando potencial...", sub: "Gerando projeção de recuperação" },
    { pct: 95, main: "Finalizando...", sub: "Preparando relatório de simulação" }
  ] : [
    { pct: 0, main: "Sincronizando dados...", sub: "Conectando aos servidores de análise" },
    { pct: 15, main: "Verificando métricas...", sub: "Acessando dados públicos de engajamento" },
    { pct: 30, main: "Processando conteúdos...", sub: "Analisando posts e interações recentes" },
    { pct: 50, main: "Analisando padrões...", sub: "Identificando gargalos de performance" },
    { pct: 70, main: "Comparando nichos...", sub: "Validando contra perfis similares ativos" },
    { pct: 85, main: "Calculando potencial...", sub: "Gerando projeção de recuperação" },
    { pct: 95, main: "Finalizando...", sub: "Preparando relatório de simulação" }
  ];

  const steps = profile.isPrivate ? [
    { pct: 25, id: "step1" },
    { pct: 50, id: "step2" },
    { pct: 75, id: "step3" },
    { pct: 98, id: "step4" }
  ] : [
    { pct: 25, id: "step1" },
    { pct: 50, id: "step2" },
    { pct: 75, id: "step3" },
    { pct: 98, id: "step4" }
  ];

  if (profile.isPrivate) {
    const step2 = byId("step2");
    if (step2) {
      const span = step2.querySelector("span");
      if (span) span.textContent = "Autoridade de perfil validada";
    }
  } else {
    const step2 = byId("step2");
    if (step2) {
      const span = step2.querySelector("span");
      if (span) span.textContent = "Conteúdos processados";
    }
  }

  const update = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const currentPct = Math.floor(progress * 100);

    if (percentageText) percentageText.textContent = `${currentPct}%`;
    if (spinnerFill) {
      const offset = 283 - (283 * progress);
      spinnerFill.style.strokeDashoffset = offset;
    }

    const currentStatus = [...statusUpdates].reverse().find(s => currentPct >= s.pct);
    if (currentStatus) {
      if (statusMain) statusMain.textContent = currentStatus.main;
      if (statusSub) statusSub.textContent = currentStatus.sub;
    }

    steps.forEach(step => {
      const el = byId(step.id);
      if (el) {
        if (currentPct >= step.pct) {
          el.classList.add("is-completed");
          el.classList.remove("is-active");
        } else if (currentPct >= step.pct - 20) {
          el.classList.add("is-active");
        }
      }
    });

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      setTimeout(() => {
        modal.classList.remove("is-active");
        
        const ctaWrap = document.querySelector(".cta-wrap");
        if (ctaWrap) {
          ctaWrap.remove();
        }

        const compareRows = document.querySelectorAll(".compare-row");
        if (compareRows.length > 1) {
          compareRows[1].remove();
        }

        const header = document.querySelector(".header");
        if (header) {
          header.innerHTML = `
            <div class="reveal is-visible" style="animation: fadeIn 0.8s ease-out forwards;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 12px;">
                <span style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 12px #22c55e; animation: statusPulse 2s infinite;"></span>
                <span style="color: #22c55e; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em;">SIMULAÇÃO DE PERFORMANCE CONCLUÍDA</span>
              </div>
              <p style="margin: 0 0 16px; color: #94a3b8; font-size: 15px; font-weight: 500;">
                Impacto estimado para o perfil <span style="color: #ffffff; font-weight: 700;">@${profile.handle}</span> após a ativação da tecnologia <span style="color: #ffffff; font-weight: 700;">ENGAJA+</span>.
              </p>
              <h1 style="margin: 0; font-size: 28px; color: #ffffff; font-weight: 900; letter-spacing: -0.02em; line-height: 1.2;">
                 Esse é o seu perfil em: <span style="color: #8b5cf6;">7 Dias</span>
               </h1>
            </div>
          `;
        }

        const compareSection = document.querySelector(".card.compare");
        if (compareSection) {
          const activationCard = document.createElement("div");
          activationCard.className = "card activation-card reveal is-visible";
          activationCard.style.cssText = `
            margin-top: 24px;
            padding: 32px 24px;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(10, 13, 20, 0.95) 100%);
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(139, 92, 246, 0.1);
            animation: fadeIn 1s ease-out forwards;
          `;
          
          activationCard.innerHTML = `
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; padding: 6px 16px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 999px; color: #4ade80; font-size: 12px; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 16px;">
                 TECNOLOGIA DISPONÍVEL
               </div>
               <h2 style="margin: 0; font-size: 22px; color: #ffffff; font-weight: 800; letter-spacing: -0.02em;">Seu perfil está pronto para ativar essa otimização</h2>
               <div style="margin-top: 20px; display: flex; flex-direction: column; align-items: center; gap: 12px;">
                 <div style="width: 140px; height: 140px; border-radius: 50%; border: 4px solid #8b5cf6; padding: 4px; background: rgba(139, 92, 246, 0.1); box-shadow: 0 0 30px rgba(139, 92, 246, 0.4);">
                   <img src="${profile.avatarUrl}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
                 </div>
                 <div style="font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em; opacity: 0.9;">
                   @${profile.handle}
                 </div>
               </div>
             </div>

            <div style="background: rgba(255, 255, 255, 0.03); border-radius: 18px; padding: 20px; margin-bottom: 28px; border: 1px solid rgba(255, 255, 255, 0.05);">
              <h3 style="margin: 0 0 16px 0; font-size: 13px; color: #a78bfa; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; text-align: center;">O que acontece após a ativação:</h3>
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 12px; font-size: 14px; color: #e2e8f0; font-weight: 500;">
                  <div style="width: 20px; height: 20px; background: rgba(34, 197, 94, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  Aplicação imediata dos ajustes de algoritmo detectados
                </div>
                <div style="display: flex; align-items: center; gap: 12px; font-size: 14px; color: #e2e8f0; font-weight: 500;">
                  <div style="width: 20px; height: 20px; background: rgba(34, 197, 94, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  Otimização da distribuição para novos seguidores qualificados
                </div>
                <div style="display: flex; align-items: center; gap: 12px; font-size: 14px; color: #e2e8f0; font-weight: 500;">
                  <div style="width: 20px; height: 20px; background: rgba(34, 197, 94, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  Ativação dos sinais de crescimento orgânico constante
                </div>
              </div>
            </div>

            <div style="display: flex; justify-content: center;">
              <a id="goToCheckoutBtn" href="#" style="text-decoration: none; width: 100%; max-width: 300px; display: block;">
                <button class="cta-btn" style="
                  width: 100%; 
                  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 50%, #4c1d95 100%); 
                  box-shadow: 0 20px 50px rgba(139, 92, 246, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.1) inset, inset 0 1px 0 rgba(255, 255, 255, 0.2);
                  height: 72px;
                  border-radius: 999px;
                  position: relative;
                  overflow: hidden;
                  animation: pulse-glow 2.5s infinite ease-in-out;
                  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                  cursor: pointer;
                  border: none;
                  padding: 0 32px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 16px;
                 " onmouseover="this.style.transform='translateY(-6px) scale(1.02)'; this.style.boxShadow='0 30px 70px rgba(139, 92, 246, 0.7), 0 0 0 2px rgba(255, 255, 255, 0.15) inset, inset 0 1px 0 rgba(255, 255, 255, 0.3)';" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 20px 50px rgba(139, 92, 246, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.1) inset, inset 0 1px 0 rgba(255, 255, 255, 0.2)';" onmousedown="this.style.transform='scale(0.97) translateY(2px)';">
                  <div style="
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
                    animation: shine-sweep 2.5s infinite linear;
                  "></div>
                  <div style="
                    position: absolute;
                    inset: -2px;
                    background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.4) 0%, transparent 50%), 
                                radial-gradient(circle at 70% 80%, rgba(216, 180, 254, 0.3) 0%, transparent 50%);
                    pointer-events: none;
                  "></div>
                  <div style="
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1));
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4);
                    z-index: 1;
                  ">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));">
                       <path d="M5 12h14"></path>
                       <path d="m12 5 7 7-7 7"></path>
                     </svg>
                   </div>
                  <span style="
                    font-size: 17px; 
                    font-weight: 900; 
                    letter-spacing: 0.08em; 
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                    text-transform: uppercase;
                    z-index: 1;
                  ">Ativar Otimização</span>
                </button>
              </a>
            </div>
            <p style="text-align: center; margin-top: 16px; font-size: 11px; color: #64748b; font-weight: 500;">
              Sessão segura • Ativação em menos de 2 minutos
            </p>
          `;
          
          compareSection.parentNode.insertBefore(activationCard, compareSection.nextSibling);
          
          // Adicionar evento de clique no botão para marcar o limite
          const goToCheckoutBtn = document.getElementById('goToCheckoutBtn');
          if (goToCheckoutBtn) {
            goToCheckoutBtn.addEventListener('click', (e) => {
              e.preventDefault();
              markLimitUsed(profile.handle, profile.avatarUrl);
              const params = new URLSearchParams(window.location.search);
              let url = '../checkout/';
              if (params.toString()) {
                url += '?' + params.toString();
              }
              window.location.href = url;
            });
          }
        }
        
        const estimate = profile.recoveryEstimate;
        if (simNote && estimate != null) {
          const value = typeof estimate === "string" ? estimate.trim() : `${Number(estimate).toFixed(1)}%`;
          simNote.textContent = `Aumento estimado: +${value} de alcance potencial em até 30 dias.`;
        }
        if (finalIndicator) finalIndicator.classList.add("is-visible");
        
        window.scrollTo({ top: 0, behavior: "smooth" });

        setTimeout(() => {
          const startFollowers = profile.followers || 0;
          const addFollowers = 20000 + Math.floor(Math.random() * 20001);
          const endFollowers = startFollowers + addFollowers;

          const updatedProfile = { ...profile, followersBoosted: endFollowers, addFollowers: addFollowers };
          sessionStorage.setItem("engajaProfile", JSON.stringify(updatedProfile));
          localStorage.setItem("engajaProfileSnapshot", JSON.stringify(updatedProfile));

          const addBadge = document.createElement("div");
          addBadge.className = "added-followers-badge";
          addBadge.textContent = `+${fmt.format(addFollowers)}`;
          addBadge.style.cssText = `
            position: absolute;
            top: -20px;
            right: -10px;
            background: #22c55e;
            color: #fff;
            font-size: 11px;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            z-index: 10;
          `;

          if (metricFollowers && metricFollowers.parentElement) {
            metricFollowers.parentElement.style.position = "relative";
            metricFollowers.parentElement.appendChild(addBadge);
          }

          const ratio = addFollowers / (startFollowers || 1000);
          
          const startLikes = Math.floor(startFollowers * 0.05) || 50;
          const endLikes = Math.floor(endFollowers * 0.08);

          const startComments = Math.floor(startLikes * 0.1) || 5;
          const endComments = Math.floor(endLikes * 0.15);

          const perfEnd = 88 + Math.floor(Math.random() * 8);
          
          const similarVal = parseFloat(rateSimilar ? rateSimilar.textContent : "84.4") || 84.4;
          const targetRateVal = similarVal + 2.5 + (Math.random() * 2.3);
          
          const maxLikes = Math.floor(endFollowers * 0.75);
          const postEndLikes = [];
          const postEndComments = [];
          const postEndPerfs = [];
          
          const postLikes = document.querySelectorAll(".post-likes-val");
          const postComments = document.querySelectorAll(".post-comments-val");
          const postPerfVals = document.querySelectorAll(".post-perf-val-el");

          postLikes.forEach((el, idx) => {
            const start = parseInt(el.getAttribute("data-val") || "0");
            let end;
            if (idx === 0) {
              end = Math.floor(maxLikes * (0.6 + Math.random() * 0.4));
            } else {
              end = Math.floor(Math.random() * maxLikes * 0.7);
              if (end < Math.floor(maxLikes * 0.05)) {
                end = Math.floor(maxLikes * 0.05) + Math.floor(Math.random() * Math.floor(maxLikes * 0.15));
              }
            }
            postEndLikes.push(end);
          });

          postComments.forEach((el, idx) => {
            const start = parseInt(el.getAttribute("data-val") || "0");
            let end;
            if (idx === 0) {
              end = 4000 + Math.floor(Math.random() * 1000);
            } else {
              end = 1000 + Math.floor(Math.random() * 3000);
            }
            postEndComments.push(end);
          });

          postPerfVals.forEach((el, idx) => {
            const start = parseInt(el.getAttribute("data-val") || "0");
            let end;
            if (idx === 0) {
              end = 92 + Math.floor(Math.random() * 8);
            } else {
              end = 82 + Math.floor(Math.random() * 10);
            }
            postEndPerfs.push(end);
          });

          animateValue(metricFollowers, startFollowers, endFollowers, 2500);
          
          setTimeout(() => {
            addBadge.style.opacity = "1";
            addBadge.style.transform = "translateY(0)";
          }, 2600);
          
          const metricLikes = byId("metricLikes") || byId("projLikes");
          const metricComments = byId("metricComments") || byId("projComments");

          if (metricLikes) {
            metricLikes.classList.add("is-boosted");
            animateValue(metricLikes, startLikes, endLikes, 2500);
          }
          if (metricComments) {
            metricComments.classList.add("is-boosted");
            animateValue(metricComments, startComments, endComments, 2500);
          }
          
          if (metricFollowers) metricFollowers.classList.add("is-boosted");

           const perfScoreEl = byId("perfScore");
            const perfBarFill = byId("perfBarFill");
            const perfValueText = document.querySelector(".perf-value");
            if (perfScoreEl) {
              const start = parseInt(perfScoreEl.textContent || "0");
              animateValue(perfScoreEl, start, perfEnd, 2500);
              if (perfBarFill) {
                 perfBarFill.style.width = `${perfEnd}%`;
                 perfBarFill.style.background = "linear-gradient(90deg, #22c55e, #4ade80)";
                 perfBarFill.style.boxShadow = "0 0 25px rgba(34, 197, 94, 0.6)";
             }
             if (perfScoreEl) {
               perfScoreEl.style.color = "#4ade80";
               perfScoreEl.style.textShadow = "0 0 10px rgba(74, 222, 128, 0.5)";
             }
             if (perfValueText) {
               perfValueText.style.color = "#4ade80";
               perfValueText.style.textShadow = "0 0 10px rgba(74, 222, 128, 0.5)";
             }
           }

           let rateCurrentVarText = "";
           if (rateCurrent && rateSimilar) {
             const startVal = parseFloat(rateCurrent.textContent) || 0;
             
             animateValue(rateCurrent, startVal, targetRateVal, 2500, "%");
             
             rateCurrent.style.color = "#22c55e";
             rateCurrent.style.textShadow = "0 0 15px rgba(34, 197, 94, 0.4)";
             
             if (rateCurrentVar) {
               const diff = targetRateVal - startVal;
               rateCurrentVarText = `▲ +${diff.toFixed(1)}%`;
               rateCurrentVar.textContent = rateCurrentVarText;
               rateCurrentVar.style.color = "#22c55e";
               rateCurrentVar.style.background = "rgba(34, 197, 94, 0.12)";
             }

             const firstCompareRow = document.querySelector(".compare-row:first-child");
             if (firstCompareRow) {
               firstCompareRow.style.borderLeftColor = "#22c55e";
               firstCompareRow.style.background = "rgba(34, 197, 94, 0.02)";
               
               const labelSpan = firstCompareRow.querySelector("span");
               if (labelSpan) {
                 labelSpan.textContent = "Perfomance do seu perfil após Otimização ativada";
               }
             }
           }

           postLikes.forEach((el, idx) => {
             const start = parseInt(el.getAttribute("data-val") || "0");
             const end = postEndLikes[idx];
             
             let startTimestamp = null;
             const step = (timestamp) => {
               if (!startTimestamp) startTimestamp = timestamp;
               const progress = Math.min((timestamp - startTimestamp) / 2500, 1);
               const current = Math.floor(progress * (end - start) + start);
               el.innerHTML = `❤️ ${fmt.format(current)}`;
               if (progress < 1) window.requestAnimationFrame(step);
             };
             window.requestAnimationFrame(step);
           });

           postComments.forEach((el, idx) => {
             const start = parseInt(el.getAttribute("data-val") || "0");
             const end = postEndComments[idx];
             
             let startTimestamp = null;
             const step = (timestamp) => {
               if (!startTimestamp) startTimestamp = timestamp;
               const progress = Math.min((timestamp - startTimestamp) / 2500, 1);
               const current = Math.floor(progress * (end - start) + start);
               el.innerHTML = `💬 ${fmt.format(current)}`;
               if (progress < 1) window.requestAnimationFrame(step);
             };
             window.requestAnimationFrame(step);
           });

           postPerfVals.forEach((el, idx) => {
             const start = parseInt(el.getAttribute("data-val") || "0");
             const end = postEndPerfs[idx];
             
             let startTimestamp = null;
             const step = (timestamp) => {
               if (!startTimestamp) startTimestamp = timestamp;
               const progress = Math.min((timestamp - startTimestamp) / 2500, 1);
               const current = Math.floor(progress * (end - start) + start);
               el.innerHTML = `${current}% <span style='font-size:10px;'>✅</span>`;
               if (progress < 1) window.requestAnimationFrame(step);
             };
             window.requestAnimationFrame(step);
           });

           const postPerfBars = document.querySelectorAll(".post-perf-fill-el");
           postPerfBars.forEach((el, idx) => {
             const start = parseInt(el.style.width || "0");
             const end = postEndPerfs[idx];
             
             setTimeout(() => {
               el.style.width = `${end}%`;
               el.style.background = "linear-gradient(90deg, #22c55e, #4ade80)";
               el.style.boxShadow = "0 0 15px rgba(34, 197, 94, 0.5)";
             }, 500);
           });

           // Salvar o estado de otimização depois que as animações terminarem
           setTimeout(() => {
             const optimizationState = {
               handle: profile.handle,
               avatarUrl: profile.avatarUrl,
               followersBoosted: endFollowers,
               addFollowers: addFollowers,
               perfScore: perfEnd,
               rateCurrent: targetRateVal,
               rateCurrentVar: rateCurrentVarText,
               postLikes: postEndLikes,
               postComments: postEndComments,
               postPerfs: postEndPerfs
             };
             saveOptimizationState(optimizationState);
           }, 3000);
        }, 800);
      }, 500);
    }
  };

  update();
};

const saveOptimizationState = (state) => {
  try {
    localStorage.setItem(OPTIMIZATION_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Erro ao salvar estado de otimização:", e);
  }
};

const getOptimizationState = () => {
  try {
    const raw = localStorage.getItem(OPTIMIZATION_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Erro ao carregar estado de otimização:", e);
    return null;
  }
};

const applyOptimizedState = (state) => {
  if (!state) return;

  // Primeiro renderizar os posts com o estado otimizado
  renderPosts(state);

  // Alterar o header
  const header = document.querySelector(".header");
  if (header) {
    header.innerHTML = `
      <div class="reveal is-visible" style="animation: fadeIn 0.8s ease-out forwards;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 12px;">
          <span style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 12px #22c55e; animation: statusPulse 2s infinite;"></span>
          <span style="color: #22c55e; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em;">SIMULAÇÃO DE PERFORMANCE CONCLUÍDA</span>
        </div>
        <p style="margin: 0 0 16px; color: #94a3b8; font-size: 15px; font-weight: 500;">
          Impacto estimado para o perfil <span style="color: #ffffff; font-weight: 700;">@${profile.handle}</span> após a ativação da tecnologia <span style="color: #ffffff; font-weight: 700;">ENGAJA+</span>.
        </p>
        <h1 style="margin: 0; font-size: 28px; color: #ffffff; font-weight: 900; letter-spacing: -0.02em; line-height: 1.2;">
           Esse é o seu perfil em: <span style="color: #8b5cf6;">7 Dias</span>
         </h1>
      </div>
    `;
  }

  // Remover o processing modal e o cta wrap
  const modal = byId("processingModal");
  if (modal) modal.classList.add("hidden");
  
  const ctaWrap = document.querySelector(".cta-wrap");
  if (ctaWrap) ctaWrap.remove();

  const compareRows = document.querySelectorAll(".compare-row");
  if (compareRows.length > 1) {
    compareRows[1].remove();
  }

  // Criar o activation card
  const compareSection = document.querySelector(".card.compare");
  if (compareSection) {
    const activationCard = document.createElement("div");
    activationCard.className = "card activation-card reveal is-visible";
    activationCard.style.cssText = `
      margin-top: 24px;
      padding: 32px 24px;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(10, 13, 20, 0.95) 100%);
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 24px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(139, 92, 246, 0.1);
      animation: fadeIn 1s ease-out forwards;
    `;

    activationCard.innerHTML = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; padding: 6px 16px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 999px; color: #4ade80; font-size: 12px; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 16px;">
           TECNOLOGIA DISPONÍVEL
         </div>
         <h2 style="margin: 0; font-size: 22px; color: #ffffff; font-weight: 800; letter-spacing: -0.02em;">Seu perfil está pronto para ativar essa otimização</h2>
         <div style="margin-top: 20px; display: flex; flex-direction: column; align-items: center; gap: 12px;">
           <div style="width: 140px; height: 140px; border-radius: 50%; border: 4px solid #8b5cf6; padding: 4px; background: rgba(139, 92, 246, 0.1); box-shadow: 0 0 30px rgba(139, 92, 246, 0.4);">
             <img src="${state.avatarUrl || profile.avatarUrl}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
           </div>
           <div style="font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em; opacity: 0.9;">
             @${state.handle || profile.handle}
           </div>
         </div>
       </div>

      <div style="background: rgba(255, 255, 255, 0.03); border-radius: 18px; padding: 20px; margin-bottom: 28px; border: 1px solid rgba(255, 255, 255, 0.05);">
        <h3 style="margin: 0 0 16px 0; font-size: 13px; color: #a78bfa; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; text-align: center;">O que acontece após a ativação:</h3>
        <div style="display: grid; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px; font-size: 14px; color: #e2e8f0; font-weight: 500;">
            <div style="width: 20px; height: 20px; background: rgba(34, 197, 94, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            Aplicação imediata dos ajustes de algoritmo detectados
          </div>
          <div style="display: flex; align-items: center; gap: 12px; font-size: 14px; color: #e2e8f0; font-weight: 500;">
            <div style="width: 20px; height: 20px; background: rgba(34, 197, 94, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            Otimização da distribuição para novos seguidores qualificados
          </div>
          <div style="display: flex; align-items: center; gap: 12px; font-size: 14px; color: #e2e8f0; font-weight: 500;">
            <div style="width: 20px; height: 20px; background: rgba(34, 197, 94, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            Ativação dos sinais de crescimento orgânico constante
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: center;">
        <a id="goToCheckoutBtn" href="#" style="text-decoration: none; width: 100%; max-width: 300px; display: block;">
          <button class="cta-btn" style="
            width: 100%; 
            background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 50%, #4c1d95 100%); 
            box-shadow: 0 20px 50px rgba(139, 92, 246, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.1) inset, inset 0 1px 0 rgba(255, 255, 255, 0.2);
            height: 72px;
            border-radius: 999px;
            position: relative;
            overflow: hidden;
            animation: pulse-glow 2.5s infinite ease-in-out;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
            border: none;
            padding: 0 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
           " onmouseover="this.style.transform='translateY(-6px) scale(1.02)'; this.style.boxShadow='0 30px 70px rgba(139, 92, 246, 0.7), 0 0 0 2px rgba(255, 255, 255, 0.15) inset, inset 0 1px 0 rgba(255, 255, 255, 0.3)';" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 20px 50px rgba(139, 92, 246, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.1) inset, inset 0 1px 0 rgba(255, 255, 255, 0.2)';" onmousedown="this.style.transform='scale(0.97) translateY(2px)';">
            <div style="
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
              animation: shine-sweep 2.5s infinite linear;
            "></div>
            <div style="
              position: absolute;
              inset: -2px;
              background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.4) 0%, transparent 50%), 
                          radial-gradient(circle at 70% 80%, rgba(216, 180, 254, 0.3) 0%, transparent 50%);
              pointer-events: none;
            "></div>
            <div style="
              background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1));
              width: 44px;
              height: 44px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4);
              z-index: 1;
            ">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));">
                 <path d="M5 12h14"></path>
                 <path d="m12 5 7 7-7 7"></path>
               </svg>
             </div>
            <span style="
              font-size: 17px; 
              font-weight: 900; 
              letter-spacing: 0.08em; 
              text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
              text-transform: uppercase;
              z-index: 1;
            ">ATIVAR AGORA</span>
          </button>
        </a>
      </div>
      <p style="text-align: center; margin-top: 16px; font-size: 11px; color: #64748b; font-weight: 500;">
        Sessão segura • Ativação em menos de 2 minutos
      </p>
    `;

    compareSection.parentNode.insertBefore(activationCard, compareSection.nextSibling);

    // Adicionar evento de clique no botão
    const goToCheckoutBtn = document.getElementById('goToCheckoutBtn');
    if (goToCheckoutBtn) {
      goToCheckoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        markLimitUsed(profile.handle, profile.avatarUrl);
        const params = new URLSearchParams(window.location.search);
        let url = '../checkout/';
        if (params.toString()) {
          url += '?' + params.toString();
        }
        window.location.href = url;
      });
    }
  }

  // Aplicar os valores otimizados
  if (metricFollowers) metricFollowers.textContent = fmt.format(state.followersBoosted);
  if (metricFollowers) metricFollowers.classList.add("is-boosted");

  // Adicionar o badge de seguidores
  if (metricFollowers && metricFollowers.parentElement && state.addFollowers) {
    metricFollowers.parentElement.style.position = "relative";
    const addBadge = document.createElement("div");
    addBadge.className = "added-followers-badge";
    addBadge.textContent = `+${fmt.format(state.addFollowers)}`;
    addBadge.style.cssText = `
      position: absolute;
      top: -20px;
      right: -10px;
      background: #22c55e;
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
      opacity: 1;
      transform: translateY(0);
      z-index: 10;
    `;
    metricFollowers.parentElement.appendChild(addBadge);
  }

  // Aplicar o score
  const perfScoreEl = byId("perfScore");
  const perfBarFill = byId("perfBarFill");
  const perfValueText = document.querySelector(".perf-value");
  if (perfScoreEl && state.perfScore) {
    perfScoreEl.textContent = state.perfScore;
    perfScoreEl.style.color = "#4ade80";
    perfScoreEl.style.textShadow = "0 0 10px rgba(74, 222, 128, 0.5)";
  }
  if (perfBarFill && state.perfScore) {
    perfBarFill.style.width = `${state.perfScore}%`;
    perfBarFill.style.background = "linear-gradient(90deg, #22c55e, #4ade80)";
    perfBarFill.style.boxShadow = "0 0 25px rgba(34, 197, 94, 0.6)";
  }
  if (perfValueText) {
    perfValueText.style.color = "#4ade80";
    perfValueText.style.textShadow = "0 0 10px rgba(74, 222, 128, 0.5)";
  }

  // Aplicar o rate current
  if (rateCurrent && state.rateCurrent) {
    rateCurrent.textContent = `${Number(state.rateCurrent).toFixed(1)}%`;
    rateCurrent.style.color = "#22c55e";
    rateCurrent.style.textShadow = "0 0 15px rgba(34, 197, 94, 0.4)";
  }
  if (rateCurrentVar && state.rateCurrentVar) {
    rateCurrentVar.textContent = state.rateCurrentVar;
    rateCurrentVar.style.color = "#22c55e";
    rateCurrentVar.style.background = "rgba(34, 197, 94, 0.12)";
  }

  // Alterar a primeira linha de comparação
  const firstCompareRow = document.querySelector(".compare-row:first-child");
  if (firstCompareRow) {
    firstCompareRow.style.borderLeftColor = "#22c55e";
    firstCompareRow.style.background = "rgba(34, 197, 94, 0.02)";
    const labelSpan = firstCompareRow.querySelector("span");
    if (labelSpan) {
      labelSpan.textContent = "Perfomance do seu perfil após Otimização ativada";
    }
  }



  // Mostrar o final indicator
  if (finalIndicator) finalIndicator.classList.add("is-visible");
};

  window.scrollTo(0, 0);
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  // Verificar se temos estado de otimização salvo
  const savedState = getOptimizationState();
  if (savedState) {
    // Aplicar o estado salvo diretamente
    applyOptimizedState(savedState);
  } else {
    // Se não tem estado salvo, renderizar posts originais e adicionar listener
    renderPosts();
    if (simulateBtn) {
      simulateBtn.addEventListener("click", startProcessing);
    }
  }

  initReveal();
});
