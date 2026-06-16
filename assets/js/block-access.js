document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('engaja_upsell_paid') === 'true') {
    document.body.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          background: linear-gradient(135deg, #0a0a1a 0%, #14142b 50%, #1a1a38 100%);
          color: #f8fafc;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .blocked-container {
          max-width: 600px;
          text-align: center;
        }
        
        .icon {
          font-size: 5rem;
          margin-bottom: 24px;
        }
        
        .title {
          font-size: 2.75rem;
          font-weight: 900;
          margin-bottom: 20px;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #f87171 0%, #f97373 50%, #fca5a5 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .message {
          font-size: 1.2rem;
          line-height: 1.7;
          color: #cbd5e1;
        }
      </style>
      
      <div class="blocked-container">
        <div class="icon">🚫</div>
        <h1 class="title">Acesso Bloqueado</h1>
        <p class="message">
          Seu acesso foi bloqueado temporariamente por comportamento incomum detectado em sua conta.
        </p>
      </div>
    `;
  }
});
