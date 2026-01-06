import { useState, useEffect, useMemo } from 'react';
import Taro from '@tarojs/taro';
import type {
    CharactersDB,
    ItemsDB,
    FactionsDB,
    FactionData,
    LocationsDB,
    TimelineEventData,
    SearchIndexDB,
    CharacterData,
    ItemData,
    LocationData
} from './dataTypes';

// API 基础地址
const API_BASE = 'https://shushu.host/jianlai/data';

// 默认头像 - 使用一个简洁的占位符
export const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=3a6ea6&color=fff&name=';

// 本地头像映射 (WebP 格式)
const LOCAL_AVATARS: Record<string, string> = {
    '陈平安': `${API_BASE.replace('/data', '')}/img/avatars/陈平安头像.webp`,
    '宁姚': `${API_BASE.replace('/data', '')}/img/avatars/宁姚头像.webp`,
    '刘羡阳': `${API_BASE.replace('/data', '')}/img/avatars/刘羡阳头像.webp`,
    '宋集薪': `${API_BASE.replace('/data', '')}/img/avatars/宋集薪头像.webp`,
    '崔东山': `${API_BASE.replace('/data', '')}/img/avatars/崔东山头像.webp`,
    '崔瀺': `${API_BASE.replace('/data', '')}/img/avatars/崔瀺头像.webp`,
    '朱敛': `${API_BASE.replace('/data', '')}/img/avatars/朱敛头像.webp`,
    '稚圭': `${API_BASE.replace('/data', '')}/img/avatars/稚圭头像.webp`,
    '裴钱': `${API_BASE.replace('/data', '')}/img/avatars/裴钱头像.webp`,
    '刘志茂': `${API_BASE.replace('/data', '')}/img/avatars/刘志茂头像.webp`,
    '刘灞桥': `${API_BASE.replace('/data', '')}/img/avatars/刘灞桥头像.webp`,
    '宋长镜': `${API_BASE.replace('/data', '')}/img/avatars/宋长镜头像.webp`,
    '搬山猿': `${API_BASE.replace('/data', '')}/img/avatars/搬山猿头像.webp`,
    '李二': `${API_BASE.replace('/data', '')}/img/avatars/李二头像.webp`,
    '杨老头': `${API_BASE.replace('/data', '')}/img/avatars/杨老头头像.webp`,
    '王朱': `${API_BASE.replace('/data', '')}/img/avatars/王朱头像.webp`,
    '老道人': `${API_BASE.replace('/data', '')}/img/avatars/老道人头像.webp`,
    '苻南华': `${API_BASE.replace('/data', '')}/img/avatars/苻南华头像.webp`,
    '蔡金简': `${API_BASE.replace('/data', '')}/img/avatars/蔡金简头像.webp`,
    '贺小凉': `${API_BASE.replace('/data', '')}/img/avatars/贺小凉头像.webp`,
    '赵繇': `${API_BASE.replace('/data', '')}/img/avatars/赵繇头像.webp`,
    '郑大风': `${API_BASE.replace('/data', '')}/img/avatars/郑大风头像.webp`,
    '阮秀': `${API_BASE.replace('/data', '')}/img/avatars/阮秀头像.webp`,
    '阮邛': `${API_BASE.replace('/data', '')}/img/avatars/阮邛头像.webp`,
    '陆沉': `${API_BASE.replace('/data', '')}/img/avatars/陆沉头像.webp`,
    '马苦玄': `${API_BASE.replace('/data', '')}/img/avatars/马苦玄头像.webp`,
    '齐静春': `${API_BASE.replace('/data', '')}/img/avatars/齐静春头像.webp`,
    '魏晋': `${API_BASE.replace('/data', '')}/img/avatars/魏晋头像.webp`,
    '高大女子': `${API_BASE.replace('/data', '')}/img/avatars/高大女子头像.webp`,
    '老妪': `${API_BASE.replace('/data', '')}/img/avatars/老妪头像.webp`,
    '阿良': `${API_BASE.replace('/data', '')}/img/avatars/阿良头像.webp`,
    '朱鹿': `${API_BASE.replace('/data', '')}/img/avatars/朱鹿头像.webp`,
    '李宝瓶': `${API_BASE.replace('/data', '')}/img/avatars/李宝瓶头像.webp`,
    '董水井': `${API_BASE.replace('/data', '')}/img/avatars/董水井头像.webp`,
    '林守一': `${API_BASE.replace('/data', '')}/img/avatars/林守一头像.webp`,
    '朱河': `${API_BASE.replace('/data', '')}/img/avatars/朱河头像.webp`,
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

// 通用数据加载函数 (使用 Taro.request 替代 fetch)
async function loadData<T>(filename: string): Promise<T> {
    if (dataCache[filename]) {
        return dataCache[filename] as T;
    }

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
        dataCache[filename] = data;
        return data;
    } catch (error) {
        console.error(`Error loading ${filename}:`, error);
        throw error;
    }
}

// 获取人物头像
export function getAvatar(character: CharacterData): string {
    // 1. 优先使用本地高清头像
    if (LOCAL_AVATARS[character.name]) {
        return LOCAL_AVATARS[character.name];
    }
    // 2. 其次使用数据中的头像链接
    if (character.avatar) {
        return character.avatar;
    }
    // 3. 最后使用 UI Avatars 服务生成基于名字的头像
    return DEFAULT_AVATAR + encodeURIComponent(character.name);
}

// 获取物品图标
import itemImages from './itemImages';

const SITE_BASE = 'https://shushu.host';

export function getItemIcon(item: ItemData): string {
    // 优先使用 itemImages 中定义的远程 URL
    if (itemImages[item.name]) {
        return itemImages[item.name];
    }
    // 如果数据中有 icon 字段（以 /jianlai/ 开头的路径）
    if (item.icon) {
        return `${SITE_BASE}${item.icon}`;
    }
    // Fallback: 使用远程图片路径
    return `${SITE_BASE}/jianlai/images/items/${encodeURIComponent(item.name)}.png`;
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
        return Object.values(data) as CharacterData[];
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
                const countA = a.relationCount ?? Object.keys(a.relations || {}).length;
                const countB = b.relationCount ?? Object.keys(b.relations || {}).length;

                const scoreA = countA * 10 + a.quotes.length + a.aliases.length;
                const scoreB = countB * 10 + b.quotes.length + b.aliases.length;
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
        loadData<CharacterData>(`chars/${name}.json`)
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
    "半仙兵": 80,
    "法宝": 70,
    "灵器": 60,
    "凡物": 50,
    "未知": 0
};

// Hook: 加载法宝数据
export function useItems() {
    const [data, setData] = useState<ItemsDB | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        loadData<ItemsDB>('items.json')
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

    const itemList = useMemo(() => {
        if (!data) return [];
        return (Object.values(data) as ItemData[]).sort((a, b) => {
            const gradeA = GRADE_WEIGHTS[a.grade as string] || 0;
            const gradeB = GRADE_WEIGHTS[b.grade as string] || 0;
            if (gradeA !== gradeB) return gradeB - gradeA;

            const activeA = a.ownership_log?.length || 0;
            const activeB = b.ownership_log?.length || 0;
            if (activeA !== activeB) return activeB - activeA;

            return a.name.localeCompare(b.name, "zh-CN");
        });
    }, [data]);

    // ... (existing useItems)
    return { data, itemList, loading, error };
}

// Hook: 获取单个法宝
export function useItem(name: string) {
    const { itemList, loading, error } = useItems();
    const item = useMemo(() => {
        return itemList.find(i => i.name === name) || null;
    }, [itemList, name]);
    return { item, loading, error };
}

// Hook: 加载势力数据
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

    const { characterList } = useCharacters();

    const factionList = useMemo(() => {
        if (!data || !characterList.length) return [];

        const factionScores: Record<string, number> = {};
        const factionMembers: Record<string, string[]> = {};

        characterList.forEach(char => {
            const charScore = Object.keys(char.relations).length * 10
                + char.quotes.length
                + char.aliases.length;

            char.factions.forEach(fac => {
                factionScores[fac] = (factionScores[fac] || 0) + charScore;
                if (!factionMembers[fac]) factionMembers[fac] = [];
                factionMembers[fac].push(char.name);
            });
        });

        return (Object.values(data) as FactionData[])
            .map(f => ({
                ...f,
                members: factionMembers[f.name] || [],
                memberCount: (factionMembers[f.name] || []).length
            }))
            .sort((a, b) => {
                const scoreA = factionScores[a.name] || 0;
                const scoreB = factionScores[b.name] || 0;
                return scoreB - scoreA;
            });
    }, [data, characterList]);

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
import relationsData from './relations.json';

// Hook: 加载关系图谱数据
export function useRelations() {
    // In migrated Taro version, we bundle the graph data to avoid 404 on remote
    return { data: relationsData, loading: false, error: null };
}

// Hook: 搜索功能
export function useSearch() {
    const [index, setIndex] = useState<SearchIndexDB | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData<SearchIndexDB>('search_index.json')
            .then(setIndex)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const search = (query: string, limit = 20) => {
        if (!index || !query.trim()) return [];

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
        const results: { name: string; type: string; id: string; weight: number; score: number }[] = [];

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

                results.push({ ...item, score });
            }
        }

        results.sort((a, b) => b.score - a.score);

        return results.slice(0, limit);
    };

    return { search, loading };
}

// Hook: 随机金句
export function useRandomQuote() {
    const { characterList, loading } = useCharacters();

    const randomQuotes = useMemo(() => {
        if (!characterList.length) return [];

        // 1. 收集所有金句
        const allQuotes: { content: string; author: string; id: string }[] = [];
        characterList.forEach(char => {
            if (char.quotes && char.quotes.length > 0) {
                char.quotes.forEach((q, idx) => {
                    if (q.content) {
                        allQuotes.push({
                            content: q.content,
                            author: char.name,
                            id: `${char.name}-${idx}`
                        });
                    }
                });
            }
        });

        // 2. 随机打乱 (Fisher-Yates Shuffle)
        for (let i = allQuotes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allQuotes[i], allQuotes[j]] = [allQuotes[j], allQuotes[i]];
        }

        return allQuotes;
    }, [characterList]);

    return { quotes: randomQuotes, loading };
}
