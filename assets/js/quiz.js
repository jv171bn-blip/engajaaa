window.engajaMatrix = true;

const byId = (id) => document.getElementById(id);
const fmt = new Intl.NumberFormat("pt-BR");

const seedFromString = (str) => {
  let h = 2166136261;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const rngFromSeed = (seed) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const palette = ["#4a37b6", "#ab58f4", "#1f8ef1", "#f43f5e", "#f59e0b", "#10b981"];

const gradientFromSeed = (seed) => {
  const rand = rngFromSeed(seed);
  const c1 = palette[Math.floor(rand() * palette.length)];
  const c2 = palette[Math.floor(rand() * palette.length)];
  return `linear-gradient(135deg, ${c1}, ${c2})`;
};

const buildProfile = (handle) => {
  const clean = String(handle || "").replace(/^@+/, "").toLowerCase();
  const seed = seedFromString(clean || "perfil");
  const rand = rngFromSeed(seed);
  return {
    handle: clean || "perfil",
    name: clean ? clean.replace(/[_\.]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()) : "Perfil analisado",
    followers: Math.floor(350 + rand() * 5200),
    following: Math.floor(80 + rand() * 820),
    seed
  };
};

const steps = Array.from({ length: 5 }, (_, i) => ({ id: i }));

const questionBlocks = [
  {
    title: "Você percebe algum desses sinais no seu perfil?",
    prompt: "Qual desses sinais você já percebe no seu perfil?"
  },
  {
    title: "Você sente que está ficando para trás no Instagram?",
    prompt: "Selecione a opção que mais representa seu perfil agora."
  },
  {
    title: "Se o algoritmo voltasse a impulsionar seu perfil, o que você faria com esse crescimento?",
    prompt: "Qual seria seu principal objetivo com esse crescimento?"
  },
  {
    title: "Você já tentou fazer seu perfil crescer mas nada funcionou?",
    prompt: "O que você já tentou para fazer seu perfil crescer?"
  },
  {
    title: "Se existisse uma forma segura de reativar o engajamento do seu perfil, você testaria?",
    prompt: "Qual dessas opções mais combina com você?"
  }
];

const optionSets = [
  [
    { icon: "📉", title: "Alcance em queda", lines: ["O conteúdo deixa de ser distribuído para novos usuários.", "Mesmo postando, quase ninguém recebe ou interage."] },
    { icon: "👁️", title: "Visibilidade limitada", lines: ["O perfil sai das recomendações.", "Apenas seguidores antigos continuam vendo."] },
    { icon: "💀", title: "Engajamento morto", lines: ["O post aparece, mas não ativa reação.", "Curtidas e comentários começam a desaparecer."] },
    { icon: "🔒", title: "Crescimento bloqueado", lines: ["Seguidores não entram.", "O perfil estagna, mesmo com esforço constante."] }
  ],
  [
    { icon: "📉", title: "Eles postam menos e crescem mais que eu.", lines: ["Perfis menores avançam e o meu continua parado."] },
    { icon: "😤", title: "Eu me esforço, mas não sou reconhecido", lines: ["Posto, estudo, tento melhorar… e nada muda."] },
    { icon: "👀", title: "Sinto que o algoritmo favorece outros perfis, não o meu", lines: ["Meu conteúdo é bom, mas não ganha visibilidade."] },
    { icon: "🤐", title: "Já pensei em desistir várias vezes", lines: ["Cansa produzir e não ver retorno."] }
  ],
  [
    { icon: "💰", title: "Monetizar meu perfil", lines: ["Vendas, parcerias, autoridade."] },
    { icon: "🚀", title: "Crescer seguidores de forma consistente", lines: ["Quero ver meu perfil evoluindo todo mês."] },
    { icon: "🔥", title: "Virar referência no meu nicho", lines: ["Quero que meu nome tenha peso."] },
    { icon: "🏆", title: "Provar que meu conteúdo funciona", lines: ["Mostrar que consigo crescer de verdade."] }
  ],
  [
    { icon: "🧠", title: "Já testei estratégias diferentes", lines: ["Mudei horários, formato, hashtags… e nada mudou de verdade."] },
    { icon: "📚", title: "Já comprei curso ou mentoria", lines: ["Aprendi técnicas, mas o alcance não voltou como antes."] },
    { icon: "🎥", title: "Tentei melhorar o conteúdo", lines: ["Caprichei mais nos posts, mas o engajamento continuou fraco."] },
    { icon: "🤷", title: "Nunca soube exatamente o que ajustar", lines: ["Sinto que estou tentando no escuro."] }
  ],
  [
    { icon: "🚀", title: "Sim, se for algo automatizado", lines: ["Quero algo que atue no perfil sem depender só de mim."] },
    { icon: "🔥", title: "Sim, se realmente acelerar o engajamento", lines: ["Preciso que o algoritmo volte a responder."] },
    { icon: "🧠", title: "Sim, desde que seja seguro e discreto", lines: ["Não quero arriscar meu perfil."] },
    { icon: "❓", title: "Depende de como funciona", lines: ["Quero entender como isso reativa o alcance."] }
  ]
];

const statusMessages = [
  "Selecione o que mais representa seu perfil agora",
  "Selecione o que mais representa seu perfil agora",
  "Selecione seu principal objetivo no Instagram",
  "Selecione o que você já tentou",
  "Selecione uma opção"
];

const progressInner = byId("progressInner");
const progressPct = byId("progressPct");
const startWrap = byId("startWrap");
const btnStart = byId("btnStart");
const questionText = byId("questionText");
const answers = byId("answers");
const btnPrev = byId("btnPrev");
const btnNext = byId("btnNext");
const stepWrap = byId("stepWrap");
const microNoteEl = byId("microNote");

const simOverlay = byId("simOverlay");
const simLoading = byId("simLoading");
const simBar = byId("simBar");
const simTitle = byId("simTitle");
const simPercent = byId("simPercent");
const simLogs = byId("simLogs");
const diagResult = byId("diagResult");
const engRate = byId("engRate");
const engCurrent = byId("engCurrent");
const engNicheVal = byId("engNicheVal");
const barCurrentFill = byId("barCurrentFill");
const barNicheFill = byId("barNicheFill");
const lossPct = byId("lossPct");
const btnSimulateStart = byId("btnSimulateStart");
const simHandleWrap = byId("simHandleWrap");
const quizSimForm = byId("quizSimForm");
const qsUname = byId("qsUname");
const simSummary = byId("simSummary");
const qsAvatar = byId("qsAvatar");
const qsName = byId("qsName");
const qsHandle = byId("qsHandle");
const qsFollowers = byId("qsFollowers");
const qsFollowing = byId("qsFollowing");
const qsFeed = byId("qsFeed");
const btnProject = byId("btnProject");
const projWrap = byId("projWrap");
const projFollowers = byId("projFollowers");
const projLikes = byId("projLikes");
const projComments = byId("projComments");
const projEngagement = byId("projEngagement");
const solutionWrap = byId("solutionWrap");
const trustCount = byId("trustCount");
const trustDay = byId("trustDay");

let idx = 0;
const sel = new Array(steps.length).fill(null);

const updateProgress = () => {
  const pct = Math.round((idx / steps.length) * 100);
  if (progressInner) progressInner.style.width = `${pct}%`;
  if (progressPct) progressPct.textContent = `${pct}%`;
};

const vibrate = (ms) => {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch (_e) {
    return;
  }
};

const animateStep = (dir) => {
  if (!stepWrap) return;
  stepWrap.classList.remove("enter", "leave");
  stepWrap.classList.add(dir === "out" ? "leave" : "enter");
};

const renderStatusBelow = (message) => {
  if (!stepWrap) return;
  let statusBelow = byId("statusBelow");
  if (!statusBelow) {
    statusBelow = document.createElement("div");
    statusBelow.id = "statusBelow";
    statusBelow.className = "diag-status bottom";
  }
  statusBelow.innerHTML = `<span class="dot"></span><span>${message}</span><span class="dots"><i></i><i></i><i></i></span>`;
  const cta = stepWrap.querySelector(".cta-actions");
  if (cta) {
    if (statusBelow.parentElement !== stepWrap || statusBelow.nextSibling !== cta) {
      stepWrap.insertBefore(statusBelow, cta);
    }
  } else if (statusBelow.parentElement !== stepWrap) {
    stepWrap.appendChild(statusBelow);
  }
};

const renderStep = () => {
  if (questionText) {
    const block = questionBlocks[idx] || questionBlocks[0];
    questionText.innerHTML = `<div class="diag-title">${block.title}</div><div class="diag-prompt">${block.prompt}</div>`;
  }
  if (answers) {
    answers.innerHTML = "";
    const options = optionSets[idx] || [];
    options.forEach((opt, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "diag-opt";
      b.innerHTML = `
        <div class="opt-row">
          <span class="opt-icon">${opt.icon}</span>
          <span class="opt-title">${opt.title}</span>
        </div>
        <div class="opt-desc">
          <span class="opt-line">${opt.lines[0]}</span>
          ${opt.lines[1] ? `<span class="opt-line">${opt.lines[1]}</span>` : ""}
        </div>
      `;
      if (sel[idx] === i) b.classList.add("selected");
      b.addEventListener("click", () => {
        sel[idx] = i;
        Array.from(answers.children).forEach((el) => el.classList.remove("selected"));
        b.classList.add("tap", "selected");
        vibrate(12);
        btnNext.disabled = false;
        btnNext.style.opacity = "";
        btnNext.style.filter = "";
        btnNext.style.pointerEvents = "";
        btnNext.textContent = idx < steps.length - 1 ? "Avançar" : "Continuar análise";
      });
      answers.appendChild(b);
    });
    answers.classList.add("diag-list");
  }
  renderStatusBelow(statusMessages[idx] || statusMessages[0]);
  if (btnPrev) btnPrev.style.display = idx === 0 ? "none" : "";
  if (btnNext) {
    const enabled = sel[idx] != null;
    btnNext.disabled = !enabled;
    btnNext.style.opacity = enabled ? "" : 0.5;
    btnNext.style.filter = enabled ? "" : "grayscale(24%)";
    btnNext.style.pointerEvents = enabled ? "" : "none";
    btnNext.textContent = idx < steps.length - 1 ? "Avançar" : "Continuar análise";
  }
  updateProgress();
  if (microNoteEl) {
    microNoteEl.textContent = "";
    microNoteEl.className = "micro-note";
  }
};

const runOverlay = () => {
  if (simOverlay) simOverlay.classList.remove("hidden");
  if (simLoading) simLoading.classList.remove("hidden");
  let pct = 0;
  let i = 0;
  const msgs = [
    "Cruzando padrões de entrega…",
    "Avaliando consistência de sinais sociais…",
    "Calculando taxa estimada de engajamento…",
    "Medindo nível atual de impulso algorítmico…",
    "Detectando limitações de recomendação…",
    "Identificando potencial de recuperação…"
  ];
  const tick = () => {
    pct = Math.min(100, pct + 8 + Math.random() * 10);
    if (simBar) simBar.style.width = `${pct}%`;
    if (simPercent) simPercent.textContent = `${Math.round(pct)}%`;
    if (simTitle) simTitle.textContent = msgs[i % msgs.length];
    if (simLogs) {
      const line = document.createElement("div");
      line.className = "sim-log";
      line.textContent = `✓ ${msgs[i % msgs.length]}`;
      simLogs.appendChild(line);
      simLogs.scrollTop = simLogs.scrollHeight;
    }
    i += 1;
    if (pct < 100) {
      setTimeout(tick, 320);
    } else {
      if (simOverlay) simOverlay.classList.add("hidden");
      if (simLoading) simLoading.classList.add("hidden");
      showResult();
    }
  };
  tick();
};

const calculateQuizRates = () => {
  // Similar profiles (atentado para a promessa SaaS: 84% - 94%)
  const seed = seedFromString(sel.join(""));
  const rand = rngFromSeed(seed);
  const healthy = 84 + (rand() * 10);
  
  // Current profile: starts at 45%, decreases based on selections
  let current = 42;
  
  // Question 1 (Sinais): Impacto forte no score
  const q1Weights = [10, 8, 15, 9];
  current -= q1Weights[sel[0]] || 5;
  
  // Question 2 (Sentimento): Impacto médio
  const q2Weights = [6, 5, 8, 12];
  current -= q2Weights[sel[1]] || 4;
  
  // Question 4 (Tentativas): Impacto leve
  const q4Weights = [3, 5, 4, 6];
  current -= q4Weights[sel[3]] || 3;
  
  // Adiciona uma pequena variação aleatória baseada no seed para não ser fixo demais
  current += (rand() * 4 - 2);

  // Garante que o valor final seja realista para um perfil "com problemas" (entre 18% e 35%)
  // E sempre muito menor que o healthy
  current = Math.max(18.4, Math.min(36.2, current));
  
  return {
    eng: parseFloat(current.toFixed(1)),
    healthy: parseFloat(healthy.toFixed(1))
  };
};

const showResult = () => {
  if (diagResult) diagResult.classList.remove("hidden");
  const rates = calculateQuizRates();
  const eng = rates.eng;
  const healthy = rates.healthy;
  
  if (engRate) engRate.textContent = `${eng.toFixed(1)}%`;
  if (engCurrent) engCurrent.textContent = `${eng.toFixed(1)}%`;
  if (engNicheVal) engNicheVal.textContent = `${healthy.toFixed(1)}%`;
  if (barCurrentFill) barCurrentFill.style.width = `${Math.min(100, eng)}%`;
  if (barNicheFill) barNicheFill.style.width = `${Math.min(100, healthy)}%`;
  if (lossPct) {
    const loss = healthy - eng;
    lossPct.textContent = `Seu perfil está operando com ${loss.toFixed(1)}% abaixo do potencial máximo`;
  }
};

if (btnStart) {
  btnStart.addEventListener("click", () => {
    if (startWrap) startWrap.style.display = "none";
    if (stepWrap) stepWrap.style.display = "grid";
    const progressEl = byId("progress");
    if (progressEl) progressEl.style.display = "";
    const header = byId("quizIntroHeader");
    if (header) {
      header.classList.add("hidden");
      header.style.display = "none";
    }
    animateStep("in");
    renderStep();
  });
}

if (btnNext) {
  btnNext.addEventListener("click", () => {
    if (sel[idx] == null) return;
    if (idx < steps.length - 1) {
      animateStep("out");
      setTimeout(() => {
        idx += 1;
        renderStep();
        animateStep("in");
        if (stepWrap) stepWrap.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 180);
    } else {
      const rates = calculateQuizRates();
      const profileData = {
        engRate: rates.eng,
        similarRate: rates.healthy
      };
      localStorage.setItem("quiz_analysis_data", JSON.stringify(profileData));
      
      const dest = "../analise/";
      window.location.href = dest;
    }
  });
}

if (btnPrev) {
  btnPrev.addEventListener("click", () => {
    if (idx > 0) {
      animateStep("out");
      setTimeout(() => {
        idx -= 1;
        renderStep();
        animateStep("in");
      }, 180);
    }
  });
}

if (btnSimulateStart) {
  btnSimulateStart.addEventListener("click", () => {
    if (simHandleWrap) simHandleWrap.classList.remove("hidden");
    if (simHandleWrap) simHandleWrap.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

if (quizSimForm && qsUname) {
  quizSimForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const profile = buildProfile(qsUname.value);
    if (simSummary) simSummary.classList.remove("hidden");
    if (projWrap) projWrap.classList.add("hidden");
    if (solutionWrap) solutionWrap.classList.add("hidden");
    if (qsAvatar) qsAvatar.style.backgroundImage = gradientFromSeed(profile.seed);
    if (qsName) qsName.textContent = profile.name;
    if (qsHandle) qsHandle.textContent = `@${profile.handle}`;
    if (qsFollowers) qsFollowers.textContent = fmt.format(profile.followers);
    if (qsFollowing) qsFollowing.textContent = fmt.format(profile.following);
    if (qsFeed) {
      qsFeed.innerHTML = "";
      for (let i = 0; i < 3; i++) {
        const post = document.createElement("div");
        post.className = "ig-post";
        const thumb = document.createElement("div");
        thumb.className = "thumb";
        thumb.style.backgroundImage = gradientFromSeed(profile.seed + i);
        post.appendChild(thumb);
        qsFeed.appendChild(post);
      }
    }
  });
}

if (btnProject) {
  btnProject.addEventListener("click", () => {
    if (projWrap) projWrap.classList.remove("hidden");
    if (solutionWrap) solutionWrap.classList.add("hidden");
    if (projFollowers) projFollowers.textContent = fmt.format(Math.floor(6000 + Math.random() * 18000));
    if (projLikes) projLikes.textContent = fmt.format(Math.floor(380 + Math.random() * 1500));
    if (projComments) projComments.textContent = fmt.format(Math.floor(30 + Math.random() * 140));
    if (projEngagement) projEngagement.textContent = `${(Math.random() * 2.2 + 2.2).toFixed(1)}%`;
    setTimeout(() => {
      if (solutionWrap) solutionWrap.classList.remove("hidden");
    }, 600);
  });
}

if (trustCount) {
  const saved = parseInt(localStorage.getItem("engaja_trust_count") || "", 10);
  let count = Number.isFinite(saved) && saved > 0 ? saved : 10027;
  trustCount.textContent = fmt.format(count);
  const update = () => {
    count += Math.floor(5 + Math.random() * 6);
    trustCount.textContent = fmt.format(count);
    localStorage.setItem("engaja_trust_count", String(count));
  };
  setInterval(update, 2000);
}

if (trustDay) {
  trustDay.textContent = new Date().toLocaleDateString("pt-BR", { weekday: "long" });
}
