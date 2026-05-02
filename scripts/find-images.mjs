import fs from "fs";

(async () => {
  const s = async (query) => {
    const p = new URLSearchParams({q: query + " site:wotofo.com filetype:jpg OR filetype:png"});
    const r = await fetch("https://html.duckduckgo.com/html/?q=" + p.get("q"));
    const t = await r.text();
    const urls = t.match(/https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi) || [];
    return [...new Set(urls)].filter(u => u.includes('cdn') || u.includes('wotofo'))[0];
  };

  console.log("NexPod 15k KIT:", await s("wotofo nexpod 15000 kit transparent"));
  console.log("NexPod Refillo KIT:", await s("wotofo nexpod refillo transparent"));
  console.log("NexPod Capsule 5000:", await s("wotofo nexpod 5000 capsule"));
  console.log("NexPod Capsule 15000:", await s("wotofo nexpod 15000 capsule"));
})();
