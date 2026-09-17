import { useState, useEffect, useMemo } from 'react';
import Taro from '@tarojs/taro';
import type {
    CharactersDB,
    ItemsLiteDB,
    FactionsDB,
    FactionData,
    LocationsDB,
    TimelineEventData,
    SearchIndexDB,
    CharacterData,
    ItemData,
    ItemDataLite,
    LocationData
} from './dataTypes';

// API 基础地址（dev 模式下通过 config/dev.ts defineConstants 覆盖）
// process.env.API_BASE 由 Taro defineConstants 在编译时做文本替换，运行时不存在
const API_BASE = process.env.API_BASE || 'https://shushu.host/jianlai/data';

// 默认头像 - 使用一个简洁的占位符
export const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=3a6ea6&color=fff&name=';

// 本地头像映射 (线上兜底资源包)
const ASSET_BASE = 'https://shushu.host/jianlai';

const LOCAL_AVATARS: Record<string, string> = {
    '陈平安': `${ASSET_BASE}/img/avatars/陈平安头像.webp`,
    '宁姚': `${ASSET_BASE}/img/avatars/宁姚头像.webp`,
    '刘羡阳': `${ASSET_BASE}/img/avatars/刘羡阳头像.webp`,
    '宋集薪': `${ASSET_BASE}/img/avatars/宋集薪头像.webp`,
    '崔东山': `${ASSET_BASE}/img/avatars/崔东山头像.webp`,
    '崔瀺': `${ASSET_BASE}/img/avatars/崔瀺头像.webp`,
    '朱敛': `${ASSET_BASE}/img/avatars/朱敛头像.webp`,
    '稚圭': `${ASSET_BASE}/img/avatars/稚圭头像.webp`,
    '裴钱': `${ASSET_BASE}/img/avatars/裴钱头像.webp`,
    '刘志茂': `${ASSET_BASE}/img/avatars/刘志茂头像.webp`,
    '刘灞桥': `${ASSET_BASE}/img/avatars/刘灞桥头像.webp`,
    '宋长镜': `${ASSET_BASE}/img/avatars/宋长镜头像.webp`,
    '搬山猿': `${ASSET_BASE}/img/avatars/搬山猿头像.webp`,
    '李二': `${ASSET_BASE}/img/avatars/李二头像.webp`,
    '杨老头': `${ASSET_BASE}/img/avatars/杨老头头像.webp`,
    '王朱': `${ASSET_BASE}/img/avatars/王朱头像.webp`,
    '老道人': `${ASSET_BASE}/img/avatars/老道人头像.webp`,
    '苻南华': `${ASSET_BASE}/img/avatars/苻南华头像.webp`,
    '蔡金简': `${ASSET_BASE}/img/avatars/蔡金简头像.webp`,
    '贺小凉': `${ASSET_BASE}/img/avatars/贺小凉头像.webp`,
    '赵繇': `${ASSET_BASE}/img/avatars/赵繇头像.webp`,
    '郑大风': `${ASSET_BASE}/img/avatars/郑大风头像.webp`,
    '阮秀': `${ASSET_BASE}/img/avatars/阮秀头像.webp`,
    '阮邛': `${ASSET_BASE}/img/avatars/阮邛头像.webp`,
    '陆沉': `${ASSET_BASE}/img/avatars/陆沉头像.webp`,
    '马苦玄': `${ASSET_BASE}/img/avatars/马苦玄头像.webp`,
    '齐静春': `${ASSET_BASE}/img/avatars/齐静春头像.webp`,
    '魏晋': `${ASSET_BASE}/img/avatars/魏晋头像.webp`,
    '高大女子': `${ASSET_BASE}/img/avatars/高大女子头像.webp`,
    '老妪': `${ASSET_BASE}/img/avatars/老妪头像.webp`,
    '阿良': `${ASSET_BASE}/img/avatars/阿良头像.webp`,
    '朱鹿': `${ASSET_BASE}/img/avatars/朱鹿头像.webp`,
    '李宝瓶': `${ASSET_BASE}/img/avatars/李宝瓶头像.webp`,
    '董水井': `${ASSET_BASE}/img/avatars/董水井头像.webp`,
    '林守一': `${ASSET_BASE}/img/avatars/林守一头像.webp`,
    '朱河': `${ASSET_BASE}/img/avatars/朱河头像.webp`,
    '李槐': `${API_BASE.replace('/data', '')}/img/avatars/李槐头像.webp`,
    '吴鸢': `${API_BASE.replace('/data', '')}/img/avatars/吴鸢头像.webp`,
    '于禄': `${API_BASE.replace('/data', '')}/img/avatars/于禄头像.webp`,
    '宋和': `${API_BASE.replace('/data', '')}/img/avatars/宋和头像.webp`,
    '曹峻': `${API_BASE.replace('/data', '')}/img/avatars/曹峻头像.webp`,
    '李希圣': `${API_BASE.replace('/data', '')}/img/avatars/李希圣头像.webp`,
    '李柳': `${API_BASE.replace('/data', '')}/img/avatars/李柳头像.webp`,
    '杨花': `${API_BASE.replace('/data', '')}/img/avatars/杨花头像.webp`,
    '粉裙女童': `${API_BASE.replace('/data', '')}/img/avatars/粉裙女童头像.webp`,
    '老秀才': `${API_BASE.replace('/data', '')}/img/avatars/老秀才头像.webp`,
    '茅小冬': `${API_BASE.replace('/data', '')}/img/avatars/茅小冬头像.webp`,
    '许弱': `${API_BASE.replace('/data', '')}/img/avatars/许弱头像.webp`,
    '谢谢': `${API_BASE.replace('/data', '')}/img/avatars/谢谢头像.webp`,
    '青衣小童': `${API_BASE.replace('/data', '')}/img/avatars/青衣小童头像.webp`,
    '魏檗': `${API_BASE.replace('/data', '')}/img/avatars/魏檗头像.webp`,
};

// 数据缓存
const dataCache: Record<string, unknown> = {};

// 数据缓存
interface CacheItem<T> {
    data: T;
    timestamp: number;
}
const CACHE_KEY_PREFIX = 'jianlai_data_v3_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// 通用数据加载函数 (带缓存)
async function loadData<T>(filename: string, strategy: 'cache-first' | 'network-first' = 'cache-first'): Promise<T> {
    const cacheKey = `${CACHE_KEY_PREFIX}${filename}`;

    // 1. Memory Cache
    if (dataCache[filename]) {
        return dataCache[filename] as T;
    }

    // 2. Storage Cache (If strategy is cache-first)
    if (strategy === 'cache-first') {
        try {
            const cached = Taro.getStorageSync(cacheKey) as CacheItem<T>;
            if (cached && cached.data && cached.timestamp) {
                const age = Date.now() - cached.timestamp;
                if (age < CACHE_DURATION) {
                    dataCache[filename] = cached.data; // Sync to memory
                    // Silently update if older than 1 hour? Optional.
                    // For now, adhere to "cache for 1 day".
                    return cached.data;
                }
            }
        } catch (e) {
            console.error('Cache read error', e);
        }
    }

    // 3. Network Fetch
    try {
        const response = await Taro.request({
            url: `${API_BASE}/${filename}`,
            method: 'GET',
            dataType: 'json',
            timeout: 30000,
        });

        if (response.statusCode !== 200) {
            throw new Error(`Failed to load ${filename}: ${response.statusCode}`);
        }

        const data = response.data as T;

        // Update Memory
        dataCache[filename] = data;

        // Update Storage
        try {
            Taro.setStorage({
                key: cacheKey,
                data: {
                    data,
                    timestamp: Date.now()
                }
            });
        } catch (e) {
            console.warn('Cache write failed (quota exceeded?)', e);
            // Optionally clear old cache here if needed
        }

        return data;
    } catch (error) {
        console.error(`Error loading ${filename}:`, error);

        // Fallback: If network fails, try to return expired cache if exists
        try {
            const cached = Taro.getStorageSync(cacheKey) as CacheItem<T>;
            if (cached && cached.data) {
                console.warn('Network failed, using expired cache for', filename);
                return cached.data;
            }
        } catch (e) { }

        throw error;
    }
}

// 预加载所有核心数据 (渐进式分批，避免与首屏争抢带宽)
export function preloadAllData() {
    console.log('Starting silent preload...');

    // batch1: 搜索索引优先（用户最可能立即使用搜索）
    setTimeout(() => {
        loadData('search_index.json').catch(err => console.warn('Preload batch 1 failed', err));
    }, 1000);

    // batch2: 人物 + 势力列表页数据
    setTimeout(() => {
        Promise.all([
            loadData('characters_lite.json'),
            loadData('factions.json'),
        ]).catch(err => console.warn('Preload batch 2 failed', err));
    }, 2000);

    // batch3: 次要列表页数据
    setTimeout(() => {
        Promise.all([
            loadData('items_lite.json'),
            loadData('locations.json'),
        ]).catch(err => console.warn('Preload batch 3 failed', err));
    }, 4000);
}

// 获取人物头像
export function getAvatar(character: CharacterData): string {
    // 1. V3 Data Priority
    if (character.avatar) {
        return character.avatar;
    }
    // 2. Fallback to Local Avatars (Legacy)
    if (LOCAL_AVATARS[character.name]) {
        return LOCAL_AVATARS[character.name];
    }
    // 3. 最后使用 UI Avatars 服务生成基于名字的头像
    return DEFAULT_AVATAR + encodeURIComponent(character.name);
}

// 获取物品图标
import itemImages from './itemImages';

const SITE_BASE = 'https://shushu.host';

export function getItemIcon(item: ItemData | ItemDataLite): string {
    // 1. 优先使用 itemImages 中定义的特殊映射 (如果有)
    if (itemImages[item.name]) {
        return itemImages[item.name];
    }
    // 2. 如果数据中有 icon 字段（强制覆盖）
    if (item.icon) {
        return `${SITE_BASE}${item.icon}`;
    }

    // 3. 默认使用生成的 WebP 图片
    // Sanitize name: replace / with _ to match file system
    const safeName = item.name.replace(/\//g, '_');
    return `${SITE_BASE}/jianlai/img/items/${encodeURIComponent(safeName)}.webp`;
}

// Hook: 加载首页热门人物 (Top版 - 仅7KB)
export function useTopCharacters() {
    const [data, setData] = useState<CharactersDB | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        loadData<CharactersDB>('characters_top.json')
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

    const characterList = useMemo(() => {
        if (!data) return [];
        return (Object.values(data) as CharacterData[])
            .sort((a, b) => {
                // Pin "陈平安" to the top
                if (a.name === '陈平安') return -1;
                if (b.name === '陈平安') return 1;

                const countA = a.relationCount ?? 0;
                const countB = b.relationCount ?? 0;
                // Sort by Relation Count primarily (Weight 1000)
                const scoreA = countA * 1000 + (a.quotes_count || 0) + (a.aliases_count || 0);
                const scoreB = countB * 1000 + (b.quotes_count || 0) + (b.aliases_count || 0);
                return scoreB - scoreA;
            });
    }, [data]);

    return { data, characterList, loading, error };
}

// Hook: 加载人物数据 (Lite版)
export function useCharacters() {
    const [data, setData] = useState<CharactersDB | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        loadData<CharactersDB>('characters_lite.json')
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

    // 转换为数组并排序
    const characterList = useMemo(() => {
        if (!data) return [];
        return (Object.values(data) as CharacterData[])
            .sort((a, b) => {
                // Pin "陈平安" to the top
                if (a.name === '陈平安') return -1;
                if (b.name === '陈平安') return 1;

                const countA = a.relationCount ?? Object.keys(a.relations || {}).length;
                const countB = b.relationCount ?? Object.keys(b.relations || {}).length;

                // Sort by Relation Count primarily (Weight 1000)
                const scoreA = countA * 1000 + (a.quotes_count ?? a.quotes?.length ?? 0) + (a.aliases_count ?? a.aliases?.length ?? 0);
                const scoreB = countB * 1000 + (b.quotes_count ?? b.quotes?.length ?? 0) + (b.aliases_count ?? b.aliases?.length ?? 0);
                return scoreB - scoreA;
            });
    }, [data]);

    return { data, characterList, loading, error };
}

// Hook: 获取单个人物
export function useCharacter(name: string) {
    const { data: liteData } = useCharacters();
    const [fullCharacter, setFullCharacter] = useState<CharacterData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const liteCharacter = liteData?.[name] ?? null;

    useEffect(() => {
        if (!name) return;

        setLoading(true);
        loadData<CharacterData>(`chars/${encodeURIComponent(name)}.json`)
            .then(setFullCharacter)
            .catch(err => {
                console.warn(`Failed to load full data for ${name}, falling back to lite data`, err);
                if (liteCharacter) setFullCharacter(liteCharacter);
                else setError(err);
            })
            .finally(() => setLoading(false));
    }, [name, liteCharacter]);

    const character = fullCharacter || liteCharacter;

    return { character, loading: loading && !character, error };
}

// 品秩权重映射
const GRADE_WEIGHTS: Record<string, number> = {
    "神器": 100,
    "仙兵": 90,
    "仙剑": 88,
    "半仙兵": 80,
    "法宝": 70,
    "灵器": 60,
    "灵物": 60,
    "方寸物": 55,
    "典籍": 50,
    "货币": 50,
    "凡物": 40,
    "未知": 0
};

// Hook: 加载法宝数据 (Lite版)
export function useItems() {
    const [data, setData] = useState<ItemsLiteDB | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        loadData<ItemsLiteDB>('items_lite.json')
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

    const itemList = useMemo(() => {
        if (!data) return [];
        return (Object.values(data) as ItemDataLite[]).sort((a, b) => {
            const gradeA = GRADE_WEIGHTS[a.grade as string] || 0;
            const gradeB = GRADE_WEIGHTS[b.grade as string] || 0;
            if (gradeA !== gradeB) return gradeB - gradeA;

            // Use simplified ownership count
            const activeA = a.ownership_count || 0;
            const activeB = b.ownership_count || 0;
            if (activeA !== activeB) return activeB - activeA;

            return a.name.localeCompare(b.name, "zh-CN");
        });
    }, [data]);

    return { data, itemList, loading, error };
}

// Hook: 获取单个法宝 (Full Detail, with lite fallback)
export function useItem(name: string) {
    const [item, setItem] = useState<ItemData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Try lite list first for immediate display (same pattern as useCharacter)
    const { data: itemsLite } = useItems();
    const liteItem = itemsLite?.[name] ? { ...itemsLite[name], name } as unknown as ItemData : null;

    useEffect(() => {
        if (!name) return;
        setLoading(true);
        const safeName = name.replace(/\//g, '_');
        const encodedName = encodeURIComponent(safeName);

        loadData<ItemData>(`items/${encodedName}.json`)
            .then(setItem)
            .catch((err) => {
                // Full data failed, but lite may still be available
                if (!liteItem) setError(err);
            })
            .finally(() => setLoading(false));
    }, [name]);

    const resolved = item || liteItem;
    return { item: resolved, loading: loading && !resolved, error };
}

// Hook: 加载势力数据（使用构建时预计算的 score 排序，无需加载 characters）
export function useFactions() {
    const [data, setData] = useState<FactionsDB | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        loadData<FactionsDB>('factions.json')
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

    const factionList = useMemo(() => {
        if (!data) return [];

        return (Object.values(data) as FactionData[])
            .sort((a, b) => {
                const scoreA = a.score || 0;
                const scoreB = b.score || 0;
                if (scoreA !== scoreB) return scoreB - scoreA;
                return a.name.localeCompare(b.name, 'zh-CN');
            });
    }, [data]);

    return { data, factionList, loading, error };
}

// Hook: 获取单个宗派
export function useFaction(name: string) {
    const { factionList, loading, error } = useFactions();
    const faction = useMemo(() => {
        return factionList.find(f => f.name === name) || null;
    }, [factionList, name]);
    return { faction, loading, error };
}

// Hook: 加载地点数据
export function useLocations() {
    const [data, setData] = useState<LocationsDB | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        loadData<LocationsDB>('locations.json')
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

    const locationList = useMemo(() => {
        if (!data) return [];

        const TYPE_WEIGHTS: Record<string, number> = {
            "天下": 100,
            "洲": 90,
            "王朝": 80,
            "宗门": 75,
            "福地": 70,
            "洞天": 70,
            "城池": 60,
            "城镇": 60,
            "街道": 50,
            "山峰": 40,
            "建筑": 30
        };

        return (Object.values(data) as LocationData[]).sort((a, b) => {
            const weightA = TYPE_WEIGHTS[a.type] || 0;
            const weightB = TYPE_WEIGHTS[b.type] || 0;
            if (weightA !== weightB) return weightB - weightA;

            return a.name.localeCompare(b.name, "zh-CN");
        });
    }, [data]);

    return { data, locationList, loading, error };
}

// Hook: 获取单个地点
export function useLocation(name: string) {
    const { locationList, loading, error } = useLocations();
    const location = useMemo(() => {
        return locationList.find(l => l.name === name) || null;
    }, [locationList, name]);
    return { location, loading, error };
}

// Hook: 加载时间线数据
export function useTimeline() {
    const [data, setData] = useState<TimelineEventData[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        loadData<TimelineEventData[]>('timeline.json')
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

    return { data, loading, error };
}

// Import local graph data
// Imports removed to reduce bundle size
// import relationsData from './relations.json';
// import itemsEnrichedData from './items_enriched.json';

// Hook: 加载关系图谱数据
// Hook: 加载关系图谱数据
export function useRelations() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        loadData('relations.json')
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

    return { data, loading, error };
}

// Hook: 搜索功能
// Hook: 搜索功能
export function useSearch() {
    const [index, setIndex] = useState<SearchIndexDB | null>(null);
    const [factions, setFactions] = useState<FactionsDB | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const p1 = loadData<SearchIndexDB>('search_index.json');
        const p2 = loadData<FactionsDB>('factions.json');

        Promise.allSettled([p1, p2])
            .then(([indexResult, factionsResult]) => {
                if (indexResult.status === 'fulfilled') setIndex(indexResult.value);
                else console.error('search_index.json load failed:', indexResult.reason);
                if (factionsResult.status === 'fulfilled') setFactions(factionsResult.value);
                else console.error('factions.json load failed (search will still work):', factionsResult.reason);
            })
            .finally(() => setLoading(false));
    }, []);

    const search = (query: string, limit = 20) => {
        if ((!index && !factions) || !query.trim()) return [];

        const calculateScore = (item: { name: string; id: string; weight: number }, queryLower: string) => {
            const nameLower = item.name.toLowerCase();
            let score = item.weight || 0;

            if (nameLower === queryLower) {
                score += 100000000;
            } else if (nameLower.startsWith(queryLower)) {
                score += 10000000;
            } else {
                const idx = nameLower.indexOf(queryLower);
                score -= idx * 1000;
            }

            if (item.name === item.id) {
                score += 5000000;
            }

            return score;
        };

        const lowerQuery = query.toLowerCase();
        // Use a Map to deduplicate by id+type
        const resultsMap = new Map<string, { name: string; type: string; id: string; weight: number; score: number }>();

        // 1. Search in Index
        if (index) {
            for (const name of Object.keys(index)) {
                if (name.toLowerCase().includes(lowerQuery)) {
                    const entry = index[name];
                    const item = {
                        name,
                        type: entry.type,
                        id: entry.id,
                        weight: entry.weight || 0
                    };
                    const score = calculateScore(item, lowerQuery);
                    resultsMap.set(`${item.type}-${item.id}`, { ...item, score });
                }
            }
        }

        // 2. Search in Factions (Patch for missing factions in index)
        if (factions) {
            for (const name of Object.keys(factions)) {
                if (name.toLowerCase().includes(lowerQuery)) {
                    const item = {
                        name,
                        type: 'faction', // Enforce type
                        id: name, // Faction ID is usually its name
                        weight: 80 // Default weight for patched factions
                    };
                    const score = calculateScore(item, lowerQuery);

                    // If this faction is already in results (from index), we keep the one with higher score?
                    // Or just overwrite? Since index might have wrong type (Location), we should ALLOW adding 'faction' type even if 'location' type exists.
                    // The Map key is `${item.type}-${item.id}`, so "faction-落魄山" and "location-落魄山" will coexist. Correct.
                    resultsMap.set(`${item.type}-${item.id}`, { ...item, score });
                }
            }
        }

        const results = Array.from(resultsMap.values());
        results.sort((a, b) => b.score - a.score);

        return results.slice(0, limit);
    };

    return { search, loading };
}

// Hook: 金句加载
// full=false (默认): 双阶段加载，先 quotes_top.json 快速展示，5秒后懒加载完整版（首页用）
// full=true: 直接加载完整版 quotes.json，含 tags 字段（语录列表页用）
export function useQuotes(options?: { full?: boolean }) {
    const full = options?.full ?? false;
    const [data, setData] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (full) {
            // 直接加载完整版金句（含 tags）
            loadData<any[]>('quotes.json')
                .then(quotes => {
                    const shuffled = [...quotes].sort(() => 0.5 - Math.random());
                    setData(shuffled);
                })
                .catch(setError)
                .finally(() => setLoading(false));
            return;
        }

        // 阶段1：加载轻量版金句 (~22KB)，快速展示
        loadData<any[]>('quotes_top.json')
            .then(quotes => {
                const shuffled = [...quotes].sort(() => 0.5 - Math.random());
                setData(shuffled);
            })
            .catch(setError)
            .finally(() => setLoading(false));

        // 阶段2：延迟加载完整版金句，替换数据
        const timer = setTimeout(() => {
            loadData<any[]>('quotes.json')
                .then(quotes => {
                    const shuffled = [...quotes].sort(() => 0.5 - Math.random());
                    setData(shuffled);
                })
                .catch(err => console.warn('Full quotes load failed, using top quotes', err));
        }, 5000);

        return () => clearTimeout(timer);
    }, [full]);

    return { quotes: data || [], loading, error };
}

// Deprecated alias for compatibility
export const useRandomQuote = useQuotes;
