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

// Função para gerar nome aleatório
const generateRandomName = () => {
  const firstNames = [
    "João", "Maria", "Pedro", "Ana", "Carlos", "Mariana", "Lucas", "Juliana",
    "Mateus", "Beatriz", "Gustavo", "Camila", "Ricardo", "Fernanda", "Daniel", "Amanda"
  ];
  const lastNames = [
    "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Almeida", "Costa",
    "Gomes", "Martins", "Araújo", "Barbosa", "Pereira", "Lima", "Carvalho", "Ribeiro"
  ];
  
  const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return `${randomFirstName} ${randomLastName}`;
};

// Função para gerar telefone aleatório formatado
const generateRandomPhone = () => {
  const ddds = ["11", "12", "13", "14", "15", "16", "17", "18", "19", "21", "22", "24", "27", "28", "31", "32", "33", "34", "35", "37", "38", "41", "42", "43", "44", "45", "46", "47", "48", "49", "51", "53", "54", "55", "61", "62", "63", "64", "65", "66", "67", "68", "69", "71", "73", "74", "75", "77", "79", "81", "82", "83", "84", "85", "86", "87", "88", "89", "91", "92", "93", "94", "95", "96", "97", "98", "99"];
  const randomDDD = ddds[Math.floor(Math.random() * ddds.length)];
  const firstPart = "9" + Math.floor(Math.random() * 90000 + 10000);
  const secondPart = Math.floor(Math.random() * 9000 + 1000);
  
  return `(${randomDDD}) ${firstPart}-${secondPart}`;
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
  return `ENG-PROT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

document.addEventListener("DOMContentLoaded", () => {
  const profile = JSON.parse(sessionStorage.getItem("engajaProfile") || localStorage.getItem("engajaProfileSnapshot") || "{}");
  
  if (profile.handle) {
    const realAvatars = document.querySelectorAll(".real-avatar");
    const placeholders = document.querySelectorAll(".placeholder-avatar");
    
    // Danger box profile
    const dangerUsername = document.querySelector(".danger-username");
    if (dangerUsername) dangerUsername.textContent = `@${profile.handle}`;
    
    if (profile.avatarUrl) {
      realAvatars.forEach(img => {
        img.src = profile.avatarUrl;
        img.style.display = "block";
      });
      placeholders.forEach(div => {
        div.style.display = "none";
      });
    }
  }
  
  // Configurações da API ParadisePags para o upsell
  const PIX_CONFIG = {
    API_URL: 'https://multi.paradisepags.com/api/v1/transaction.php',
    API_KEY: 'sk_6dfc60ecc38cb17c97db4289f4905e112907862899c828c47efb76eb3d23fbcb',
    PRODUCT_HASH: 'prod_4f4f9e2c89d39e0e', // Hash do upsell fornecido
    AMOUNT_CENTS: 2990, // R$ 29,90
    DESCRIPTION: 'Proteção Engaja+'
  };
  
  let currentTransactionId = null;
  let paymentPollingInterval = null;
  let expirationTimerInterval = null;
  let expirationTimeLeft = 0; // segundos
  let purchaseEventFired = false; // Flag para garantir que o evento Purchase dispare apenas uma vez
  
  // SRCs originais das imagens
  const ORIGINAL_BANNER_SRC = '../assets/img/7bf7b808-14b7-441d-939e-f0c8023f741f.png';
  const ORIGINAL_TUTORIAL_SRC = '../assets/img/12bb9b63-7a03-4f56-94b3-7290173d7580.png';

  // FAQ Accordion
  document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
      const faqItem = button.parentElement;
      const answer = faqItem.querySelector('.faq-answer');
      const isActive = faqItem.classList.contains('active');
      
      // Close all other FAQ items
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
        const itemAnswer = item.querySelector('.faq-answer');
        if (itemAnswer) {
          itemAnswer.style.maxHeight = null;
        }
      });
      
      // Open clicked item if it wasn't active
      if (!isActive) {
        faqItem.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // Timer functionality with persistence
  function startTimer(durationMinutes) {
    const STORAGE_KEY = 'engajaBanTimerEnd';
    
    // Get or set the end time
    let endTime = localStorage.getItem(STORAGE_KEY);
    
    if (!endTime) {
      // First time, set end time to now + duration
      endTime = Date.now() + (durationMinutes * 60 * 1000);
      localStorage.setItem(STORAGE_KEY, endTime);
    }
    
    const dangerMinutesElement = document.getElementById('danger-minutes');
    const dangerSecondsElement = document.getElementById('danger-seconds');
    
    const updateTimer = () => {
      const now = Date.now();
      const remainingMs = endTime - now;
      
      if (remainingMs <= 0) {
        // Timer ended
        if (dangerMinutesElement) dangerMinutesElement.textContent = '00';
        if (dangerSecondsElement) dangerSecondsElement.textContent = '00';
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      
      const totalSeconds = Math.floor(remainingMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      
      // Update displays with leading zeros
      if (dangerMinutesElement) dangerMinutesElement.textContent = minutes.toString().padStart(2, '0');
      if (dangerSecondsElement) dangerSecondsElement.textContent = seconds.toString().padStart(2, '0');
    };
    
    // Update immediately
    updateTimer();
    
    // Update every second
    const timerInterval = setInterval(() => {
      updateTimer();
      
      // Check if timer ended
      const now = Date.now();
      if (endTime - now <= 0) {
        clearInterval(timerInterval);
        localStorage.removeItem(STORAGE_KEY);
      }
    }, 1000);
  }

  // Start timer when page loads (7 minutes duration)
  startTimer(7);

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
        value = `(${value.slice(0, 2)})`;
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
  const activateProtectionBtn = document.getElementById("activate-protection");
  
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

  activateProtectionBtn.addEventListener("click", () => {
    if (modal) {
      modal.classList.add("active");
      document.body.classList.add("modal-open");
      
      // Preencher campos com dados do localStorage ou gerar aleatórios
      const savedName = localStorage.getItem('engajaCustomerName');
      const savedWhatsapp = localStorage.getItem('engajaCustomerWhatsapp');
      
      const nameInput = document.getElementById('checkout-name');
      const whatsappInput = document.getElementById('checkout-whatsapp');
      
      if (nameInput) {
        nameInput.value = savedName || generateRandomName();
      }
      
      if (whatsappInput) {
        whatsappInput.value = savedWhatsapp || generateRandomPhone();
      }
      
      // Ocultar o formulário de dados pessoais
      if (stepCustomer) {
        stepCustomer.style.display = 'none';
      }
      
      // Scrollar o modal para o topo ao abrir
      const modalOverlay = document.querySelector('.modal-overlay');
      if (modalOverlay) {
        modalOverlay.scrollTop = 0;
      }
      
      // Manter a etapa de pagamento visível (mas não exibir a etapa de dados)
      stepPaymentSelection.classList.add("active");
      
      if (modalBackAbove) {
        modalBackAbove.style.display = "flex";
      }
    }
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
    let whatsapp = document.getElementById("checkout-whatsapp").value;

    // Se por algum motivo os campos estiverem vazios, gerar dados aleatórios
    if (!name) {
      document.getElementById("checkout-name").value = generateRandomName();
    }
    if (!whatsapp) {
      document.getElementById("checkout-whatsapp").value = generateRandomPhone();
      whatsapp = document.getElementById("checkout-whatsapp").value;
    }

    // Validate complete phone number (se não for válido, gerar um novo)
    const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
    if (!phoneRegex.test(whatsapp)) {
      const newPhone = generateRandomPhone();
      document.getElementById("checkout-whatsapp").value = newPhone;
      whatsapp = newPhone;
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
        
        if (statusData && statusData.status === 'approved' && !purchaseEventFired) {
          purchaseEventFired = true;
          clearInterval(paymentPollingInterval);
          paymentPollingInterval = null;
          
          // Disparar evento Purchase do Meta Pixel
          if (typeof fbq !== 'undefined') {
            fbq('track', 'Purchase', {
              value: (PIX_CONFIG.AMOUNT_CENTS / 100).toFixed(2),
              currency: 'BRL'
            });
            console.log('Meta Pixel: Evento Purchase disparado com sucesso');
          } else {
            console.warn('Meta Pixel (fbq) não está disponível');
          }
          
          // Redirecionar para a página principal ou agradecimento
          window.location.href = '../';
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
      } else if (stepPaymentPix.classList.contains("active")) {
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
      window.location.href = '../'; // Redirecionar para a página principal
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
});
