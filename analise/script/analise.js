    (() => {
      const ACTOR_ID = "coderx/instagram-profile-scraper-api";
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
        const url = `${API_BASE}/acts/${encodeURIComponent(ACTOR_ID)}/runs?token=${encodeURIComponent(APIFY_TOKEN)}&waitForFinish=120`;
        const run = await requestJson(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usernames })
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
        const cleanUrl = String(url).replace(/^\/\//, "https://");
        return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}`;
      };

      const mapProfile = async (item, fallbackHandle) => {
        const base = item || {};
        const user = base.user || base.owner || base.profile || {};
        const handle = String(pickValue(base.username, base.userName, base.handle, user.username, user.userName, user.handle, fallbackHandle, "usuario"))
          .replace(/^@+/, "")
          .toLowerCase();
        const name = pickValue(base.fullName, base.name, base.full_name, user.fullName, user.name, user.full_name, "");
        const bio = pickValue(base.biography, base.bio, base.biografia, user.biography, user.bio, user.biografia, "");
        const followers = pickValue(
          base.followersCount,
          base.followers,
          base.followers_count,
          base.followerCount,
          base.followedByCount,
          base.edge_followed_by?.count,
          base.edgeFollowedBy?.count,
          user.followersCount,
          user.followers,
          user.followers_count,
          user.edge_followed_by?.count,
          user.edgeFollowedBy?.count
        );
        const following = pickValue(
          base.followingCount,
          base.following,
          base.following_count,
          base.followsCount,
          base.follows,
          base.edge_follow?.count,
          base.edgeFollow?.count,
          user.followingCount,
          user.following,
          user.following_count,
          user.edge_follow?.count,
          user.edgeFollow?.count
        );
        const posts = pickValue(base.postsCount, base.posts, base.posts_count, base.mediaCount, base.media_count, user.postsCount, user.posts, user.posts_count);
        let isPrivate = pickValue(base.isPrivate, base.is_private, base.private, user.isPrivate, user.is_private, user.private, false);
        const avatarRaw = pickValue(
          base.profilePicUrlHd,
          base.profilePicUrlHD,
          base.profilePicUrl,
          base.profile_pic_url_hd,
          base.profile_pic_url,
          base.profile_picture,
          base.profilePic,
          base.profileImage,
          base.profile_image,
          base.profileImageUrl,
          base.profile_image_url,
          base.avatarUrl,
          base.avatar_url,
          base.imageUrl,
          base.image_url,
          user.profilePicUrlHd,
          user.profilePicUrlHD,
          user.profilePicUrl,
          user.profile_pic_url_hd,
          user.profile_pic_url,
          user.profile_picture,
          user.profilePic,
          user.profileImage,
          user.profile_image,
          user.profileImageUrl,
          user.profile_image_url,
          user.avatarUrl,
          user.avatar_url,
          user.imageUrl,
          user.image_url,
          ""
        );
        const avatarUrl = buildProxyUrl(avatarRaw);
        const rawPosts = item.latestPosts || item.posts || item.postsList || item.latestMedia || item.edge_owner_to_timeline_media?.edges || [];
        const postsList = Array.isArray(rawPosts)
          ? rawPosts
              .map((post) => {
                const p = post || {};
                const likes = [
                  p.likesCount,
                  p.likes,
                  p.likeCount,
                  p.edge_media_preview_like?.count,
                  p.edge_liked_by?.count,
                  p.edgeLikedBy?.count,
                  p.node?.edge_media_preview_like?.count,
                  p.node?.edge_liked_by?.count,
                  p.node?.edge_media_preview_like?.count
                ].find(v => v !== undefined && v !== null && v !== "" && v !== 0) ?? 0;

                const comments = [
                  p.commentsCount,
                  p.comments,
                  p.commentCount,
                  p.edge_media_to_comment?.count,
                  p.edgeMediaToComment?.count,
                  p.node?.edge_media_to_comment?.count,
                  p.node?.edge_media_to_comment?.count
                ].find(v => v !== undefined && v !== null && v !== "" && v !== 0) ?? 0;

                const image = pickValue(
                  p.image,
                  p.imageUrl,
                  p.thumbnailUrl,
                  p.displayUrl,
                  p.thumbnail_src,
                  p.node?.display_url,
                  p.node?.thumbnail_src,
                  p.node?.thumbnail_resources?.[0]?.src
                );

                return {
                  image: buildProxyUrl(image),
                  likes: getNumber(likes) || 0,
                  comments: getNumber(comments) || 0
                };
              })
              .filter((post) => post.image)
          : [];

        if (!isPrivate && getNumber(posts) > 0 && postsList.length === 0) {
          isPrivate = true;
        }

        const engagementRate = item.engagementRate ?? item.engagement_rate ?? null;
        return {
          handle,
          name,
          bio,
          followers: getNumber(followers),
          following: getNumber(following),
          posts: getNumber(posts),
          isPrivate: !!isPrivate,
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
