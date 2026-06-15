    (() => {
      const ACTOR_ID = "vulnv/instagram-profile-scraper";
      const API_BASE = "https://api.apify.com/v2";
      const APIFY_TOKEN = "apify_api_AIgFMgZHgVcH3PAO8PV1kw3Zyam1oO0CKnYP";

      const requestJson = async (url, options = {}) => {
        const response = await fetch(url, options);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `request_failed_${response.status}`);
        }
        return response.json();
      };

      const runActor = async (usernames) => {
        if (!APIFY_TOKEN) throw new Error("missing_token");
        const urls = usernames.map(u => `https://www.instagram.com/${u}/`);
        const url = `${API_BASE}/acts/${encodeURIComponent(ACTOR_ID)}/runs?token=${encodeURIComponent(APIFY_TOKEN)}&waitForFinish=120`;
        const run = await requestJson(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls })
        });
        return run.data || run;
      };

      const getDatasetItems = async (datasetId) => {
        const url = `${API_BASE}/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(APIFY_TOKEN)}&clean=1`;
        const response = await fetch(url);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `dataset_failed_${response.status}`);
        }
        return response.json();
      };

      const pickValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

      const getNumber = (value) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
      };

      const buildProxyUrl = (url) => {
        if (!url) return "";
        let cleanUrl = String(url).trim();
        // Remover backticks (`), espaços e aspas no início e fim
        cleanUrl = cleanUrl.replace(/^[\s`"']+|[\s`"']+$/g, "");
        // Garantir que comece com https://
        if (cleanUrl.startsWith("//")) {
          cleanUrl = "https:" + cleanUrl;
        } else if (cleanUrl.startsWith("http://")) {
          cleanUrl = cleanUrl.replace("http://", "https://");
        } else if (!cleanUrl.startsWith("https://")) {
          cleanUrl = "https://" + cleanUrl;
        }
        console.log("URL limpa:", cleanUrl);
        // Usar proxy para contornar CORS
        const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&default=redirect&output=jpg`;
        console.log("URL com proxy:", proxyUrl);
        return proxyUrl;
      };

      const mapProfile = async (item, fallbackHandle) => {
        console.log("Dados recebidos do actor:", item); // Para debug
        
        // Verificar se o item é um array (se o actor retorna um array de perfis?)
        let profileData = Array.isArray(item) && item.length > 0 ? item[0] : item;
        
        if (Array.isArray(profileData) && profileData.length > 0) {
            profileData = profileData[0];
        }

        // Extrair campos diretamente do actor "vulnv/instagram-profile-scraper"
        const account = profileData?.account || fallbackHandle;
        const handle = String(account || fallbackHandle || "usuario").replace(/^@+/, "").toLowerCase();
        const name = profileData?.full_name || profileData?.profile_name || handle;
        const bio = profileData?.biography || "";
        
        const followers = profileData?.followers;
        const following = profileData?.following;
        const totalPosts = profileData?.posts_count;
        const isPrivate = !!profileData?.is_private;
        const avatarRaw = profileData?.profile_image_link;
        
        let avatarUrl = "";
        if (avatarRaw) {
          avatarUrl = buildProxyUrl(avatarRaw);
        }
        
        const engagementRate = profileData?.avg_engagement;
        
        // Processar posts
        const rawPosts = profileData?.posts || [];
        const postsList = Array.isArray(rawPosts)
          ? rawPosts
              .map((post) => {
                console.log("Processando post:", post); // Para debug
                const likes = post?.likes || 0;
                const comments = post?.comments || 0;
                const image = post?.image_url || "";
                
                const postImageUrl = image ? buildProxyUrl(image) : "";
                console.log("Post image URL:", postImageUrl);
                
                return {
                  image: postImageUrl,
                  likes: getNumber(likes) || 0,
                  comments: getNumber(comments) || 0
                };
              })
              .filter((post) => post.image)
              .slice(0, 12)
          : [];

        console.log("Posts processados:", postsList); // Para debug
        console.log("Dados do perfil:", { handle, name, bio, followers, following, totalPosts, isPrivate, avatarUrl, engagementRate, postsList });
        
        return {
          handle,
          name,
          bio,
          followers: getNumber(followers),
          following: getNumber(following),
          posts: getNumber(totalPosts),
          isPrivate: isPrivate,
          avatarUrl,
          postsList,
          engagementRate
        };
      };

      const fetchProfile = async (handle) => {
        const run = await runActor([handle]);
        const datasetId = run.defaultDatasetId;
        if (!datasetId) throw new Error("missing_dataset");
        const items = await getDatasetItems(datasetId);
        const item = Array.isArray(items) ? items[0] : null;
        if (!item) throw new Error("empty_dataset");
        return await mapProfile(item, handle);
      };

      window.engajaApi = { fetchProfile };
    })();

    const trustCountEl = document.getElementById("trustCount");
    const trustDayEl = document.getElementById("trustDay");
    if (trustCountEl) {
      const fmt = new Intl.NumberFormat("pt-BR");
      const saved = parseInt(localStorage.getItem("engaja_trust_count") || "", 10);
      let count = Number.isFinite(saved) && saved > 0 ? saved : 10027;
      trustCountEl.textContent = fmt.format(count);
      setInterval(() => {
        count += Math.floor(5 + Math.random() * 6);
        trustCountEl.textContent = fmt.format(count);
        localStorage.setItem("engaja_trust_count", String(count));
      }, 2000);
    }
    if (trustDayEl) {
      trustDayEl.textContent = new Date().toLocaleDateString("pt-BR", { weekday: "long" }).toLowerCase();
    }

    document.addEventListener("DOMContentLoaded", () => {
      const line1 = document.getElementById("twLine1");
      const line2 = document.getElementById("twLine2");
      const subtitle = document.getElementById("twSubtitle");
      const reveals = document.querySelectorAll(".reveal-after");

      const typeWriter = async (el, parts, speed = 40) => {
        el.classList.add("typewriter-text", "active");
        for (const part of parts) {
          const span = document.createElement("span");
          if (part.class) span.className = part.partClass || part.class;
          el.appendChild(span);
          
          for (let i = 0; i < part.text.length; i++) {
            span.textContent += part.text[i];
            await new Promise(r => setTimeout(r, speed));
          }
        }
        el.classList.remove("active");
      };

      const startTypewriter = async () => {
        await typeWriter(line1, [
          { text: "Seu " },
          { text: "Engajamento", class: "hl-purple" },
          { text: " caiu" }
        ], 68);
        
        await typeWriter(line2, [
          { text: "e o " },
          { text: "motivo", class: "hl-red" },
          { text: " pode não ser seu " },
          { text: "conteúdo", class: "hl-purple" }
        ], 68);

        await typeWriter(subtitle, [
          { text: "Analise seu " },
          { text: "perfil", class: "hl-purple" },
          { text: " e descubra se ainda é possível recuperar seu " },
          { text: "alcance", class: "hl-purple" },
          { text: "." }
        ], 40);

        reveals.forEach(el => el.classList.add("visible"));
      };

      startTypewriter();
    });
