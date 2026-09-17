// SVG icon definitions for ink-wash (水墨风) design system
// All icons use stroke-based, thin, elegant lines
// stroke-width: 1.5, stroke-linecap: round, stroke-linejoin: round

const svgWrapper = (path: string, viewBox = '0 0 24 24') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

export const ICONS: Record<string, string> = {
  // === Navigation & Actions ===
  search: svgWrapper('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>'),
  arrowRight: svgWrapper('<path d="m9 18 6-6-6-6"/>'),
  arrowLeft: svgWrapper('<path d="m15 18-6-6 6-6"/>'),
  close: svgWrapper('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  chevronDown: svgWrapper('<path d="m6 9 6 6 6-6"/>'),
  chevronUp: svgWrapper('<path d="m18 15-6-6-6 6"/>'),
  plus: svgWrapper('<path d="M12 5v14"/><path d="M5 12h14"/>'),
  help: svgWrapper('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'),
  share: svgWrapper('<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>'),

  // === Home Grid Category Icons ===
  // 宗派势力 - Mountain peak
  mountain: svgWrapper('<path d="m8 3 4 8 5-5 5 15H2L8 3z"/><path d="m5 21 5-10"/>'),
  // 宝物图鉴 - Sword
  sword: svgWrapper('<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="m16 16 4 4"/><path d="m19 21 2-2"/>'),
  // 地点图鉴 - Map
  map: svgWrapper('<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>'),
  // 世界观 - Scroll
  scroll: svgWrapper('<path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/>'),

  // === Search Type Icons ===
  // 人物
  person: svgWrapper('<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  // 法宝 - Sparkle/Diamond
  sparkle: svgWrapper('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>'),
  // 地点
  mapPin: svgWrapper('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'),

  // === Cultivation Icons ===
  // 武道 - Crossed swords
  swords: svgWrapper('<path d="m14.5 17.5 3 3a1.5 1.5 0 0 0 2.12-2.12l-3-3"/><path d="M2.5 2.5 5 5l4-1 7.5 7.5"/><path d="m9.5 6.5 3 3"/><path d="m6 2 5.5 5.5"/><path d="m14 17.5-7.5-7.5L5 11l-3 3 7 7 3-3-1-1.5z"/>'),
  // 练气士 - Qi/Energy (flame-like)
  qi: svgWrapper('<path d="M12 12c-2-2.67-4-4-4-6a4 4 0 0 1 8 0c0 2-2 3.33-4 6z"/><path d="M12 21a8 8 0 0 0 4-15"/><path d="M12 21a8 8 0 0 1-4-15"/>'),

  // === Location Type Icons ===
  // 天下/大洲 - Globe
  globe: svgWrapper('<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>'),
  // 王朝 - Flag
  flag: svgWrapper('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'),
  // 宗门 - Same as mountain
  // 城市/城镇 - Building
  building: svgWrapper('<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>'),
  // 村落 - Home
  home: svgWrapper('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
  // 山脉 - Peak
  peak: svgWrapper('<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>'),
  // 建筑/殿堂 - Landmark
  landmark: svgWrapper('<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>'),
  // 店铺 - Store
  store: svgWrapper('<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>'),
  // 水域 - Waves
  waves: svgWrapper('<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>'),
  // 渡口 - Anchor
  anchor: svgWrapper('<circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>'),
  // 遗迹 - Ruin/Archive
  ruin: svgWrapper('<path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.65 5H8.35a2 2 0 0 0-1.85 1.3L5 10 3 8"/><path d="m7 16 5 5 5-5"/><path d="M7 21H3"/><path d="M21 21h-4"/><path d="M12 3v10"/>'),

  // === World Page Profession Icons ===
  // 纯粹武夫 - Fist
  fist: svgWrapper('<path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 13"/>'),
  // 符箓师 - FileText/Talisman
  talisman: svgWrapper('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'),
  // 阵师 - Grid/Web
  grid: svgWrapper('<path d="M12 3v18"/><path d="M3 12h18"/><rect x="3" y="3" width="18" height="18" rx="2"/>'),

  // === World Page Resource/Economy Icons ===
  // 王朝供奉 - Crown
  crown: svgWrapper('<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M3 20h18"/>'),
  // 宗门反哺 - Cycle/Refresh
  cycle: svgWrapper('<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>'),

  // === Currency Icons ===
  // 雪花钱 - Snowflake
  snowflake: svgWrapper('<line x1="12" y1="2" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/><line x1="2" y1="12" x2="22" y2="12"/>'),
  // 小暑钱 - Sun
  sun: svgWrapper('<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'),
  // 谷雨钱 - Cloud Rain
  rain: svgWrapper('<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/>'),

  // === Meta Icons ===
  // 👥 Participants
  users: svgWrapper('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  // 📚 Source/Book
  book: svgWrapper('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
  // ✍️ Edit/Pen
  pen: svgWrapper('<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>'),

  // === Faction Type Icons ===
  // 家族 - Family tree
  family: svgWrapper('<path d="M17 21v-2a4 4 0 0 0-4-4H5"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  // 地方势力 - Shield with location
  shield: svgWrapper('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
  // 官方机构 - Official seal / stamp
  official: svgWrapper('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/>'),
  // 江湖门派 - Martial arts (crossing staffs)
  jianghu: svgWrapper('<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>'),
  // 教派 - Yin-yang / doctrine
  doctrine: svgWrapper('<circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 0 0 10 7 7 0 0 1 0 10"/><circle cx="12" cy="8.5" r="1.5"/><circle cx="12" cy="15.5" r="1.5"/>'),
  // 军事组织 - Military banner
  military: svgWrapper('<path d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h12c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18"/><path d="M4 12h16"/><path d="M12 2v10"/>'),
  // 跨界组织 - Connected circles
  crossworld: svgWrapper('<circle cx="8" cy="12" r="5"/><circle cx="16" cy="12" r="5"/>'),
  // 商业组织 - Coins/commerce
  commerce: svgWrapper('<circle cx="12" cy="12" r="8"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'),
  // 神道势力 - Temple/shrine
  shrine: svgWrapper('<path d="M18 22H6"/><path d="M6 18V10"/><path d="M18 18V10"/><path d="m2 10 10-8 10 8"/><path d="M12 14v4"/>'),
  // 书院 - Academy/book open
  academy: svgWrapper('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'),
  // 妖族势力 - Beast/demon
  beast: svgWrapper('<path d="M8 2c-1.5 2-3 3.5-3 6 0 3.5 2.5 6 7 6s7-2.5 7-6c0-2.5-1.5-4-3-6"/><path d="M9 18c0 2 1.5 4 3 4s3-2 3-4"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/>'),
  // 组织 - Generic org
  org: svgWrapper('<circle cx="12" cy="5" r="3"/><path d="M6.5 14a3 3 0 1 0 0 .01"/><path d="M17.5 14a3 3 0 1 0 0 .01"/><path d="M12 8v3"/><path d="M6.5 14 12 11l5.5 3"/>'),
};

// Helper to generate encoded SVG data URI with color injection
export function getSvgDataUri(iconName: string, color = '#333333'): string {
  const svg = ICONS[iconName];
  if (!svg) return '';
  const colored = svg.replace(/currentColor/g, color);
  return `data:image/svg+xml,${encodeURIComponent(colored)}`;
}
