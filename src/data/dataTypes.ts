// 真实数据类型定义 - 对应 data/build/*.json 的结构

// 修为记录
// 修为记录 - 兼容 V2 和 V3
export interface CultivationLog {
    chapter?: string;
    clean_chapter?: string;
    state?: string;
    // V3 fields
    path?: string;
    realm?: string;
    realm_name?: string;
    stage?: string;
    notes?: string;
}

// 关系数据
export interface RelationData {
    type: string[];
    strength: number;
    evidence: { chapter: string; text: string }[];
}

// 语录
export interface QuoteData {
    content: string;
    context: string;
    chapter: string;
}

// 人物数据 (来自 characters.json)
export interface CultivationLevelLog {
    chapter: string;
    chapter_id: string;
    level: string;
    order: number;
}

export interface CharacterData {
    name: string;
    aliases?: string[];
    bio_summary: string;
    bio?: string; // Full bio
    realm?: string; // Legacy/lite realm label
    cultivation_log?: CultivationLog[]; // Legacy V2 support
    cultivation: CultivationLog[] | string[] | string; // Support old logs, new string array, or simple string (lite)
    appearance?: {
        facial: string;
        physique: string;
        attire: string;
        aura: string;
    };
    factions: string[];
    tags: string[];
    quotes?: QuoteData[];
    relations?: Record<string, RelationData>;
    avatar?: string;
    title?: string;
    relationCount?: number;
    quotes_count?: number;
    aliases_count?: number;
    wudao_log?: CultivationLevelLog[]; // Keep for compatibility if needed, or deprecate
    lianqi_log?: CultivationLevelLog[];
    techniques?: {
        name: string;
        type: string;
        category: string;
        description: string;
    }[];
}

// 法宝/物品数据 (来自 items.json - AI Cleaned)
export enum ItemGrade {
    FanWu = "凡物",
    LingQi = "灵器",
    FaBao = "法宝",
    BanXianBing = "半仙兵",
    XianBing = "仙兵",
    ShenQi = "神器",
    Unknown = "未知"
}

export enum ItemStatus {
    Active = "活跃",
    Destroyed = "损毁",
    Lost = "遗失",
    Consumed = "消耗",
    Unknown = "未知"
}

export interface ItemData {
    name: string;
    type: string;
    subtype?: string; // New field
    description: string;
    grade: ItemGrade | string;   // 品秩
    status: ItemStatus | string;  // 状态
    icon?: string; // 物品图标路径
    aliases: string[]; // 别名列表
    ownership_log: { chapter: string; owner: string }[];
    // New enriched fields
    rank_potential?: string;
    supernatural_ability?: string;
    evolution?: {
        current_form?: string;
        materials_consumed?: string[];
        potential_evolution?: string;
    };
    visual?: {
        static?: string;
        active?: string;
    };
    provenance?: {
        origin?: string;
        karma_link?: string;
    };
    enriched?: boolean;
    holder?: string;
    holder_relation?: string;
    previous_holders?: {
        name: string;
        relation: string;
    }[];
}

export interface ItemDataLite {
    name: string;
    grade: ItemGrade | string;
    type: string;
    subtype?: string;
    status: string; // Add status
    description: string; // Add truncated description
    icon?: string; // Add icon if available
    current_owner: string; // Pre-calculated
    ownership_count: number;
}

export type ItemsLiteDB = Record<string, ItemDataLite>;

// 势力数据 (来自 factions.json)
export interface FactionData {
    name: string;
    type: string;
    description: string;
    // 构建时预计算字段
    members?: string[];
    memberCount?: number;
    member_count?: number;  // 构建时计算的成员数
    score?: number;         // 构建时计算的排序评分
    location?: string;
    region?: string;        // 所属区域 (如 "浩然天下 > 东宝瓶洲 > 大骊王朝")
    power_score?: number;   // 实力值（成员境界指数加权求和）
}

// 地点数据 (来自 locations.json)
export interface LocationData {
    name: string;
    type: string;
    description: string;
    parent: string;
    aliases?: string[];
    hierarchy?: string[];
}

// 时间线事件 (来自 timeline.json)
export interface TimelineEventData {
    year?: string;
    event: string;
    description?: string;
    // Legacy fields if needed, or remove if unused
    name?: string;
    type?: string;
    participants?: string[];
    source_chapter?: string;
    chapter_id?: string;
}

// 搜索索引 (来自 search_index.json)
export interface SearchIndexEntry {
    type: 'character' | 'item' | 'location' | 'faction';
    id: string;
    weight?: number;
}

// 数据库类型
export type CharactersDB = Record<string, CharacterData>;
export type ItemsDB = Record<string, ItemData>;
export type FactionsDB = Record<string, FactionData>;
export type LocationsDB = Record<string, LocationData>;
export type SearchIndexDB = Record<string, SearchIndexEntry>;
