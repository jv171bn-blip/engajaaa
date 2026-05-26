

// Função para gerar CPF válido (mod11)
const generateValidCPF = () => {
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  const calculateDigit = (numbers) => {
    let sum = 0;
    let weight = numbers.length + 1;
    for (let num of numbers) {
      sum += num * weight;
      weight--;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const cpf = [];
  for (let i = 0; i < 9; i++) cpf.push(randomInt(0, 9));
  
  const digit1 = calculateDigit(cpf);
  cpf.push(digit1);
  
  const digit2 = calculateDigit(cpf);
  cpf.push(digit2);
  
  return cpf.join('');
};

// Função para gerar email único
const generateUniqueEmail = (name) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const cleanName = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  return `${cleanName || 'cliente'}.${timestamp}.${random}@temp.engaja.com`;
};

// Função para gerar referência única
const generateUniqueReference = () => {
  return `ENG-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

document.addEventListener("DOMContentLoaded", () => {
  const profile = JSON.parse(sessionStorage.getItem("engajaProfile") || localStorage.getItem("engajaProfileSnapshot") || "{}");
  const fmt = new Intl.NumberFormat("pt-BR");
  
  // Configurações da API ParadisePags
  const PIX_CONFIG = {
    API_URL: 'https://multi.paradisepags.com/api/v1/transaction.php',
    API_KEY: 'sk_6dfc60ecc38cb17c97db4289f4905e112907862899c828c47efb76eb3d23fbcb',
    PRODUCT_HASH: 'prod_1695f01a6a1a1afa',
    AMOUNT_CENTS: 3790, // R$ 37,90 (ajuste conforme seu plano)
    DESCRIPTION: 'Engaja+ Premium'
  };
  
  let currentTransactionId = null;
  let paymentPollingInterval = null;
  let expirationTimerInterval = null;
  let expirationTimeLeft = 0; // segundos
  
  // SRCs originais das imagens
  const ORIGINAL_BANNER_SRC = '../assets/img/7bf7b808-14b7-441d-939e-f0c8023f741f.png';
  const ORIGINAL_TUTORIAL_SRC = '../assets/img/12bb9b63-7a03-4f56-94b3-7290173d7580.png';

  const formatCount = (value) => {
    const num = Number(value);
    return Number.isFinite(num) && num >= 0 ? fmt.format(num) : "0";
  };
  
  if (profile.handle) {
    // Header
    const usernameHeader = document.querySelector(".username-header");
    const realAvatars = document.querySelectorAll(".real-avatar");
    const placeholders = document.querySelectorAll(".placeholder-avatar");
    
    if (usernameHeader) usernameHeader.textContent = `@${profile.handle}`;
    
    if (profile.avatarUrl) {
      realAvatars.forEach(img => {
        img.src = profile.avatarUrl;
        img.style.display = "block";
      });
      placeholders.forEach(div => {
        div.style.display = "none";
      });
    }

    // Profile Stats Comparison - Cache elements
    const $ = (id) => document.getElementById(id);
    const beforePosts = $("before-posts");
    const beforeFollowers = $("before-followers");
    const beforeFollowing = $("before-following");
    const afterPosts = $("after-posts");
    const afterFollowers = $("after-followers");
    const afterFollowing = $("after-following");
    const growthValue = $("growth-value");

    // Instagram-style Profile Card Elements
    const igAfterPosts = $("ig-after-posts");
    const igAfterFollowers = $("ig-after-followers");
    const igAfterFollowing = $("ig-after-following");
    const igAfterName = $("ig-after-name");
    const igAfterBio = $("ig-after-bio");

    // Populate Before (Current)
    if (beforePosts) beforePosts.textContent = formatCount(profile.posts);
    if (beforeFollowers) beforeFollowers.textContent = formatCount(profile.followers);
    if (beforeFollowing) beforeFollowing.textContent = formatCount(profile.following);

    // Populate After (Boosted)
    if (afterPosts) afterPosts.textContent = formatCount(profile.posts);
    if (afterFollowers) {
      const count = profile.followersBoosted || profile.followers;
      afterFollowers.textContent = formatCount(count);
      
      // Calculate new followers gained
      if (profile.addFollowers && growthValue) {
        growthValue.textContent = `+${formatCount(profile.addFollowers)} seguidores`;
      } else if (profile.followers && profile.followersBoosted) {
        const gained = profile.followersBoosted - profile.followers;
        if (gained > 0 && growthValue) {
          growthValue.textContent = `+${formatCount(gained)} seguidores`;
        }
      }
    }
    if (afterFollowing) afterFollowing.textContent = formatCount(profile.following);

    // Populate Instagram After
    if (igAfterPosts) igAfterPosts.textContent = formatCount(profile.posts);
    if (igAfterFollowers) {
      const count = profile.followersBoosted || profile.followers;
      igAfterFollowers.textContent = formatCount(count);
      
      // Calculate and show added followers badge
      const gained = profile.addFollowers || (profile.followersBoosted && profile.followers ? profile.followersBoosted - profile.followers : 0);
      if (gained > 0 && igAfterFollowers.parentElement) {
        const badge = document.createElement("div");
        badge.className = "added-followers-badge-ig";
        badge.textContent = `+${formatCount(gained)}`;
        badge.style.cssText = `
          position: absolute;
          top: -12px;
          right: 0;
          background: transparent;
          color: #22c55e;
          font-size: 12px;
          font-weight: 900;
          padding: 0;
          z-index: 10;
        `;
        igAfterFollowers.parentElement.style.position = "relative";
        igAfterFollowers.parentElement.appendChild(badge);
      }
    }
    if (igAfterFollowing) igAfterFollowing.textContent = formatCount(profile.following);
    if (igAfterName) igAfterName.textContent = profile.name || profile.handle;
    if (igAfterBio) {
      igAfterBio.textContent = profile.bio || "";
    }

    // Show verified badge only if profile is verified
    const verifiedBadge = document.querySelector(".ig-verified-badge");
    if (verifiedBadge && profile.isVerified) {
      verifiedBadge.style.display = "inline";
    }

    // Final CTA
    const finalUsername = document.querySelector(".final-username");
    if (finalUsername) finalUsername.textContent = `@${profile.handle}`;
  }

  // Smooth scroll to plans
  const scrollToPlans = (e) => {
    e.preventDefault();
    const plansSection = document.getElementById("engaja-trimestral");
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const heroScrollBtn = document.querySelector('.hero-checkout .btn-main');
  if (heroScrollBtn) {
    heroScrollBtn.parentElement.addEventListener('click', scrollToPlans);
  }

  // FAQ Toggle
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(item => {
    const question = item.querySelector(".faq-question");
    question.addEventListener("click", () => {
      const isActive = item.classList.contains("active");
      
      // Close all
      faqItems.forEach(i => i.classList.remove("active"));
      
      // Open current if it was not active
      if (!isActive) {
        item.classList.add("active");
      }
    });
  });

  // Phone Mask Function
  const applyPhoneMask = (input) => {
    input.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      if (value.length > 11) value = value.slice(0, 11);
      
      if (value.length > 6) {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
      } else if (value.length > 2) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      } else if (value.length > 0) {
        value = `(${value.slice(0, 2)}`;
      }
      
      e.target.value = value;
    });
  };

  // Apply mask to phone input
  const phoneInput = document.getElementById("checkout-whatsapp");
  if (phoneInput) applyPhoneMask(phoneInput);

  // Plan selection (Modal Logic)
  const modal = document.getElementById("checkout-modal");
  const modalBackAbove = document.getElementById("modal-back-above");
  const planBtns = document.querySelectorAll(".plan-action-btn");
  
  // Checkout Steps
  const stepCustomer = document.getElementById("step-customer-data");
  const stepPaymentSelection = document.getElementById("step-payment-selection");
  const stepPaymentPix = document.getElementById("step-payment-pix");
  const stepSuccess = document.getElementById("step-success");
  
  // Forms & Buttons
  const btnGeneratePix = document.getElementById("btn-generate-pix");
  const btnCopyPix = document.getElementById("btn-copy-pix");
  const btnAccessPlatform = document.getElementById("btn-access-platform");
  const btnMobileAction = document.getElementById("btn-mobile-action");
  const mobileFooterCta = document.getElementById("mobile-checkout-cta");

  const showStep = (stepId) => {
    const bannerImg = document.getElementById('img-banner');
    
    // In the new model, stepCustomer and stepPaymentSelection are always active or transition
    if (stepId === "step-customer-data") {
        stepCustomer.classList.add("active");
        stepPaymentSelection.classList.add("active");
        stepPaymentPix.classList.remove("active");
        stepSuccess.classList.remove("active");
        stopExpirationTimer();
        // Restaurar banner original
        if (bannerImg) bannerImg.src = ORIGINAL_BANNER_SRC;
    } else if (stepId === "step-payment-pix") {
        stepCustomer.classList.remove("active");
        stepPaymentSelection.classList.remove("active");
        stepPaymentPix.classList.add("active");
        stepSuccess.classList.remove("active");
        // Iniciar contador de expiração (7 minutos = 420 segundos)
        startExpirationTimer(420);
        // Mudar banner para tutorial
        if (bannerImg) bannerImg.src = ORIGINAL_TUTORIAL_SRC;
    } else if (stepId === "step-success") {
        stepCustomer.classList.remove("active");
        stepPaymentSelection.classList.remove("active");
        stepPaymentPix.classList.remove("active");
        stepSuccess.classList.add("active");
        stopExpirationTimer();
    }
    
    // Scrollar o modal para o topo (aplicar depois que o DOM atualizar)
    setTimeout(() => {
      const modalOverlay = document.querySelector('.modal-overlay');
      const modalContent = document.querySelector('.modal-content');
      if (modalOverlay) {
        modalOverlay.scrollTop = 0;
        modalOverlay.scrollTo(0, 0);
      }
      if (modalContent) {
        modalContent.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
      // Segunda tentativa para garantir
      setTimeout(() => {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) {
          overlay.scrollTop = 0;
        }
      }, 100);
    }, 50);
    
    // Update mobile button text based on step
    if (btnMobileAction) {
      if (stepId === "step-customer-data") {
        btnMobileAction.textContent = "GERAR PIX";
      } else if (stepId === "step-payment-pix") {
        btnMobileAction.textContent = "COPIAR CÓDIGO PIX";
      } else {
        mobileFooterCta.style.display = "none";
      }
    }
  };

  planBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (modal) {
        modal.classList.add("active");
        document.body.classList.add("modal-open");
        // Scrollar o modal para o topo ao abrir
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay) {
          modalOverlay.scrollTop = 0;
        }
        showStep("step-customer-data");
        if (modalBackAbove) {
          modalBackAbove.style.display = "flex";
        }
      }
    });
  });



  if (modalBackAbove) {
    modalBackAbove.addEventListener("click", () => {
      modal.classList.remove("active");
      document.body.classList.remove("modal-open");
      modalBackAbove.style.display = "none";
      // Parar polling e contador ao fechar modal
      if (paymentPollingInterval) {
        clearInterval(paymentPollingInterval);
        paymentPollingInterval = null;
      }
      stopExpirationTimer();
    });
  }

  // Função para formatar o tempo em MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Função para iniciar o contador de expiração
  const startExpirationTimer = (totalSeconds = 420) => {
    expirationTimeLeft = totalSeconds;
    const timerElement = document.getElementById('pix-expiration-timer');
    
    if (timerElement) {
      timerElement.textContent = `Faltam ${formatTime(expirationTimeLeft)} minutos para o pix expirar...`;
      timerElement.style.color = '#fbbf24';
    }

    if (expirationTimerInterval) clearInterval(expirationTimerInterval);

    expirationTimerInterval = setInterval(() => {
      expirationTimeLeft--;
      
      if (expirationTimeLeft <= 0) {
        clearInterval(expirationTimerInterval);
        expirationTimerInterval = null;
        if (timerElement) {
          timerElement.textContent = 'O Pix expirou! Gere um novo código.';
          timerElement.style.color = '#ef4444';
        }
        return;
      }

      if (timerElement) {
        timerElement.textContent = `Faltam ${formatTime(expirationTimeLeft)} minutos para o pix expirar...`;
      }
    }, 1000);
  };

  // Função para parar o contador de expiração
  const stopExpirationTimer = () => {
    if (expirationTimerInterval) {
      clearInterval(expirationTimerInterval);
      expirationTimerInterval = null;
    }
  };

  // Função para verificar status do pagamento
  const checkPaymentStatus = async (transactionId) => {
    try {
      const response = await fetch(`https://multi.paradisepags.com/api/v1/query.php?action=get_transaction&id=${transactionId}`, {
        method: 'GET',
        headers: {
          'X-API-Key': PIX_CONFIG.API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return null;
    }
  };

  // Generate Pix Action
  const handleGeneratePix = async () => {
    const name = document.getElementById("checkout-name").value;
    const whatsapp = document.getElementById("checkout-whatsapp").value;

    if (!name || !whatsapp) {
      alert("Por favor, preencha todos os campos para continuar.");
      return;
    }

    // Validate complete phone number
    const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
    if (!phoneRegex.test(whatsapp)) {
      alert("Por favor, digite um telefone válido no formato (11) 99999-9999.");
      return;
    }

    // Limpar telefone para enviar apenas números
    const cleanPhone = whatsapp.replace(/\D/g, '');
    
    // Gerar dados automáticos
    const email = generateUniqueEmail(name);
    const cpf = generateValidCPF();
    const reference = generateUniqueReference();

    // Simulate loading
    const originalText = btnGeneratePix.textContent;
    btnGeneratePix.innerHTML = '<div class="spinner-sm" style="margin: 0 auto;"></div>';
    btnGeneratePix.style.pointerEvents = "none";

    try {
      // Criar payload da transação
      const payload = {
        amount: PIX_CONFIG.AMOUNT_CENTS,
        description: PIX_CONFIG.DESCRIPTION,
        reference: reference,
        productHash: PIX_CONFIG.PRODUCT_HASH,
        customer: {
          name: name,
          email: email,
          phone: cleanPhone,
          document: cpf
        }
      };

      // Chamar API para criar transação
      const response = await fetch(PIX_CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': PIX_CONFIG.API_KEY
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      console.log('Resposta completa da API:', data);

      if (!response.ok || data.status !== 'success') {
        throw new Error(data.error || 'Falha ao gerar PIX');
      }

      // Salvar ID da transação
      currentTransactionId = data.transaction_id;

      // Atualizar QR Code e código PIX na interface
      const qrCodeImg = document.getElementById('qr-code-img');
      const pixCodeText = document.getElementById('pix-code-text');
      
      console.log('Elemento QR Code:', qrCodeImg);
      console.log('qr_code_base64:', data.qr_code_base64);
      console.log('qr_code:', data.qr_code);
      
      if (qrCodeImg) {
        // Garantir dimensões
        qrCodeImg.style.width = '200px';
        qrCodeImg.style.height = '200px';
        qrCodeImg.style.display = 'block';
        qrCodeImg.style.margin = '0 auto';
        
        if (data.qr_code_base64) {
          const imgSrc = data.qr_code_base64.startsWith('data:image') 
            ? data.qr_code_base64 
            : `data:image/png;base64,${data.qr_code_base64}`;
          console.log('Definindo src do QR Code (base64):', imgSrc);
          qrCodeImg.src = imgSrc;
        } else if (data.qr_code) {
          // Fallback: gerar QR Code via API se não vier base64
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.qr_code)}`;
          console.log('Definindo src do QR Code (fallback):', qrUrl);
          qrCodeImg.src = qrUrl;
        }
      }
      
      if (pixCodeText && data.qr_code) {
        pixCodeText.textContent = data.qr_code;
        pixCodeText.style.wordBreak = 'break-all';
        console.log('Código PIX definido:', data.qr_code);
      }

      // Mudar para etapa do QR Code
      showStep("step-payment-pix");
      
      // Scrollar o modal para o topo imediatamente
      const modalOverlay = document.querySelector('.modal-overlay');
      if (modalOverlay) {
        modalOverlay.scrollTop = 0;
        modalOverlay.scrollTo(0, 0);
      }
      // Garantir novamente após 100ms
      setTimeout(() => {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) {
          overlay.scrollTop = 0;
        }
      }, 100);
      
      // Iniciar polling para verificar pagamento
      if (paymentPollingInterval) clearInterval(paymentPollingInterval);
      
      paymentPollingInterval = setInterval(async () => {
        const statusData = await checkPaymentStatus(currentTransactionId);
        
        if (statusData && statusData.status === 'approved') {
          clearInterval(paymentPollingInterval);
          paymentPollingInterval = null;
          showStep("step-success");
        }
      }, 3000); // Verificar a cada 3 segundos
      
    } catch (error) {
      console.error('Erro:', error);
      alert(`Ocorreu um erro: ${error.message}`);
    } finally {
      btnGeneratePix.textContent = originalText;
      btnGeneratePix.style.pointerEvents = "auto";
    }
  };

  if (btnGeneratePix) btnGeneratePix.addEventListener("click", handleGeneratePix);
  if (btnMobileAction) {
    btnMobileAction.addEventListener("click", () => {
      if (stepCustomer.classList.contains("active")) {
        handleGeneratePix();
      } else if (stepPayment.classList.contains("active")) {
        handleCopyPix();
      }
    });
  }

  // Copy Pix Action
  const handleCopyPix = () => {
    const code = document.getElementById("pix-code-text").textContent;
    navigator.clipboard.writeText(code).then(() => {
      const originalText = btnCopyPix.innerHTML;
      btnCopyPix.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> CÓDIGO COPIADO!';
      setTimeout(() => {
        btnCopyPix.innerHTML = originalText;
      }, 2000);
    });
  };

  if (btnCopyPix) btnCopyPix.addEventListener("click", handleCopyPix);

  if (btnAccessPlatform) {
    btnAccessPlatform.addEventListener("click", () => {
      alert("Redirecionando para a plataforma Engaja+...");
      window.location.href = "./analise/index.html"; // Exemplo de redirecionamento
    });
  }

  // Summary Toggle Logic
  const summaryToggle = document.getElementById("summary-toggle");
  const summaryCard = document.getElementById("summary-card");

  if (summaryToggle && summaryCard) {
    summaryToggle.addEventListener("click", () => {
      summaryCard.classList.toggle("is-collapsed");
    });
  }

  // Reveal animations on scroll
  const observerOptions = {
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-enter");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll(".testimonial-card, .section-title, .step-item, .feature-item, .benefits-banner").forEach(el => {
    el.style.opacity = "0";
    observer.observe(el);
  });

  // Live Notifications System
  const notifications = [
    { name: "Mariana L.", city: "São Paulo", time: "há 1 minuto" },
    { name: "Ricardo G.", city: "Rio de Janeiro", time: "há 3 minutos" },
    { name: "Ana Paula", city: "Belo Horizonte", time: "há 5 minutos" },
    { name: "Bruno M.", city: "Curitiba", time: "há 2 minutos" },
    { name: "Lucas F.", city: "Salvador", time: "há 4 minutos" },
    { name: "Juliana K.", city: "Porto Alegre", time: "há 1 minuto" }
  ];

  const notificationEl = document.getElementById('live-notification');
  const notiMessage = document.getElementById('noti-message');
  const notiAvatar = document.getElementById('noti-avatar');

  function showNotification() {
    if (!notificationEl || !notiMessage || !notiAvatar) return;
    const rand = Math.floor(Math.random() * notifications.length);
    const data = notifications[rand];
    
    notiMessage.innerHTML = `<strong>${data.name}</strong> (${data.city}) acabou de ativar a otimização!`;
    notiAvatar.src = `https://i.pravatar.cc/100?u=${data.name}`;
    
    notificationEl.classList.add('show');
    
    setTimeout(() => {
      notificationEl.classList.remove('show');
    }, 5000);
  }

  // Show first notification after 3 seconds
  setTimeout(() => {
    showNotification();
    // Then every 12-20 seconds
    setInterval(showNotification, 12000 + Math.random() * 8000);
  }, 3000);

  // DM Carousel Logic
  const dmSlides = document.querySelectorAll('.dm-slide');
  const dmDots = document.querySelectorAll('.dm-dot');
  const dmPrevBtn = document.querySelector('.dm-carousel-nav.prev');
  const dmNextBtn = document.querySelector('.dm-carousel-nav.next');
  
  let currentDmIndex = 0;
  const totalDmSlides = dmSlides.length;

  const updateDmCarousel = (index) => {
    dmSlides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    
    dmDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    
    currentDmIndex = index;
  };

  const nextDmSlide = () => {
    const nextIndex = (currentDmIndex + 1) % totalDmSlides;
    updateDmCarousel(nextIndex);
  };

  const prevDmSlide = () => {
    const prevIndex = (currentDmIndex - 1 + totalDmSlides) % totalDmSlides;
    updateDmCarousel(prevIndex);
  };

  if (dmNextBtn) {
    dmNextBtn.addEventListener('click', nextDmSlide);
  }

  if (dmPrevBtn) {
    dmPrevBtn.addEventListener('click', prevDmSlide);
  }

  dmDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const index = parseInt(dot.getAttribute('data-index'));
      updateDmCarousel(index);
    });
  });
});
