const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Rota raiz - redireciona para a página principal
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

const ACTOR_ID = "coderx/instagram-profile-scraper-api";
const API_BASE = "https://api.apify.com/v2";
const APIFY_TOKEN = process.env.APIFY_TOKEN;

// Proxy para rodar o actor do Apify
app.post('/api/run-actor', async (req, res) => {
  try {
    const { usernames } = req.body;
    const url = `${API_BASE}/acts/${encodeURIComponent(ACTOR_ID)}/runs?token=${encodeURIComponent(APIFY_TOKEN)}&waitForFinish=120`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames })
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `request_failed_${response.status}`);
    }
    
    const data = await response.json();
    res.json(data.data || data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Proxy para pegar itens do dataset
app.get('/api/dataset/:datasetId', async (req, res) => {
  try {
    const { datasetId } = req.params;
    const url = `${API_BASE}/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(APIFY_TOKEN)}&clean=1`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `dataset_failed_${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor proxy rodando em http://localhost:${PORT}`);
  console.log(`Para acessar o analise: http://localhost:${PORT}/analise/index.html`);
});
