// 真实数据类型定义 - 对应 data/build/*.json 的结构

// 修为记录
export interface CultivationLog {
    chapter: string;
    clean_chapter: string;
    state: string;
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
    aliases: string[];
    bio_summary: string;
    cultivation_log: CultivationLog[];
    wudao_log?: CultivationLevelLog[];
    lianqi_log?: CultivationLevelLog[];
    factions: string[];
    tags: string[];
    quotes: QuoteData[];
    relations: Record<string, RelationData>;
    // 可选的手动添加字段
    avatar?: string;
    title?: string;
    // Lite 版本字段
    relationCount?: number;
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
    description: string;
    grade: ItemGrade | string;   // 品秩
    status: ItemStatus | string;  // 状态
    icon?: string; // 物品图标路径
    aliases: string[]; // 别名列表
    ownership_log: { chapter: string; owner: string }[];
}

// 势力数据 (来自 factions.json)
export interface FactionData {
    name: string;
    type: string;
    description: string;
    // Runtime computed fields
    members?: string[];
    memberCount?: number;
    location?: string;
}

// 地点数据 (来自 locations.json)
export interface LocationData {
    name: string;
    type: string;
    description: string;
    parent: string;
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
