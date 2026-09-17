// Imports removed as interfaces are defined locally

// F6 Graph Data Types
export interface F6Node {
    id: string;
    label?: string;
    size?: number;
    style?: {
        fill?: string;
        stroke?: string;
        lineWidth?: number;
    };
    [key: string]: any;
}

export interface F6Edge {
    source: string;
    target: string;
    label?: string;
    style?: {
        stroke?: string;
        lineWidth?: number;
        endArrow?: boolean;
    };
    [key: string]: any;
}

export interface F6Data {
    nodes: F6Node[];
    edges: F6Edge[];
}

/**
 * Filter the graph data to show only the center node and its direct neighbors.
 * This implements the "Ego-Centric" view.
 */
// 关系语义类别 → 颜色（与 relation_type_map.json 同步）
export const CATEGORY_COLORS: Record<string, string> = {
    '情感': '#c76a79',  // 胭脂
    '师徒': '#b8860b',  // 赭石
    '友谊': '#5d7a5d',  // 竹青
    '敌对': '#333333',  // 浓墨
    '血亲': '#485a6c',  // 靛青
    '主从': '#6b4c6e',  // 紫檀
    '同门': '#7a6e5d',  // 栗壳
    '击杀': '#8b0000',  // 暗红
    '上下级': '#4a5568', // 铁灰
    '合作': '#6b8e7b',  // 青铜
    '敬畏': '#8b7355',  // 古铜
    '对抗': '#5a5a5a',  // 灰墨
    '其他': '#c0bdb5',  // 清墨
};

const DEFAULT_EDGE_COLOR = '#e0e0e0'; // Faint Ink (清墨) for others
const DEFAULT_NODE_COLOR = '#888888'; // Generic Node Color

/**
 * Filter the graph data to show only the center node and its direct neighbors.
 * This implements the "Ego-Centric" view.
 */
export function getEgoGraph(fullData: any[], centerId: string, activeFilters: string[] = []): F6Data {
    if (!Array.isArray(fullData) || fullData.length === 0) {
        console.warn('getEgoGraph: Invalid fullData (not an array or empty)', fullData);
        return { nodes: [], edges: [] };
    }

    console.log(`getEgoGraph: Processing ${fullData.length} relationships for centerId=${centerId}, filters=${activeFilters}`);

    // 1. Filter edges connected to the center node
    let connectedEdges = fullData.filter(item =>
        item.source === centerId || item.target === centerId
    );

    // 1.5 Apply Relationship Filters if any are active
    // activeFilters contains the labels we want to KEEP
    if (activeFilters.length > 0) {
        connectedEdges = connectedEdges.filter(item => {
            const relation = Array.isArray(item.relation) ? item.relation[0] : (item.relation || '');
            return activeFilters.includes(relation);
        });
    }

    // Limit to top 100 relationships by strength to prevent rendering performance issues
    // (e.g. Chen Ping'an has 700+ relations)
    connectedEdges.sort((a, b) => (b.strength || b.weight || 0) - (a.strength || a.weight || 0));
    if (connectedEdges.length > 100) {
        connectedEdges = connectedEdges.slice(0, 100);
    }

    if (connectedEdges.length === 0) {
        // If no relationships found (or filtered out), check if we can at least find the node itself in fullData?
        // But fullData is an array of Links. We don't have a separate Node list passed in efficiently here.
        // Assuming centerId is valid, just return it standalone.
        return {
            nodes: [{
                id: centerId,
                label: centerId,
                size: 60,
                style: { fill: '#f5222d', stroke: '#fff', lineWidth: 3 }
            }],
            edges: []
        };
    }

    // 2. Collect unique neighbor IDs
    const neighborIds = new Set<string>();
    neighborIds.add(centerId);

    connectedEdges.forEach(item => {
        neighborIds.add(item.source);
        neighborIds.add(item.target);
    });

    // 3. Construct Nodes
    // Center node is Cinnabar Red. Neighbors get color from their relationship.
    const nodes: F6Node[] = Array.from(neighborIds).map(id => {
        const isCenter = id === centerId;

        // Default color
        let fillColor = isCenter ? '#b03a2e' : DEFAULT_NODE_COLOR; // Center = Cinnabar

        if (!isCenter) {
            // Find connection to center to determine color
            const edge = connectedEdges.find(e =>
                (e.source === centerId && e.target === id) ||
                (e.target === centerId && e.source === id)
            );

            if (edge) {
                const category = edge.category || '其他';
                if (CATEGORY_COLORS[category]) {
                    fillColor = CATEGORY_COLORS[category];
                }
            }
        }

        return {
            id: id,
            label: id,
            size: isCenter ? 65 : 45, // Slightly larger
            style: {
                fill: fillColor,
                stroke: '#f7f6f2', // Paper white stroke
                lineWidth: isCenter ? 4 : 2,
                opacity: 0.95
            },
            labelCfg: {
                style: {
                    fill: isCenter ? '#000' : '#333',
                    fontWeight: isCenter ? 600 : 400
                }
            }
        };
    });

    // 4. Construct Edges with dynamic colors (using pre-computed category)
    const edges: F6Edge[] = connectedEdges.map(item => {
        const relation = Array.isArray(item.relation) ? item.relation[0] : (item.relation || '');
        const category = item.category || '其他';
        const color = CATEGORY_COLORS[category] || DEFAULT_EDGE_COLOR;

        return {
            source: item.source,
            target: item.target,
            label: relation,
            style: {
                stroke: color,
                lineWidth: 1.5,
                endArrow: true
            }
        };
    });

    console.log(`getEgoGraph: Generated ${nodes.length} nodes and ${edges.length} edges`);

    return { nodes, edges };
}
