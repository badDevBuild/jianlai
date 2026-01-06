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
// Colors for different relationship types
// Colors for different relationship types (Ink Wash Palette)
export const RELATION_COLORS: Record<string, string> = {
    // 师徒 - Ochre (赭石)
    '师徒': '#b8860b',
    '弟子': '#b8860b',
    '先生': '#b8860b',
    '学生': '#b8860b',
    // 情侣 - Rouge (胭脂)
    '情侣': '#c76a79',
    '夫妻': '#c76a79',
    '喜欢': '#c76a79',
    // 朋友 - Bamboo (竹青)
    '朋友': '#5d7a5d',
    '好友': '#5d7a5d',
    '兄弟': '#5d7a5d',
    // 敌对 - Dark Ink (浓墨) - Distinct from Center Node Red
    '敌对': '#333333',
    '死敌': '#333333',
    '仇人': '#333333',
    '问剑': '#333333',
    // 家人 - Moon White/Indigo (月白/靛青)
    '家人': '#485a6c',
    '亲人': '#485a6c',
    // 护道人 - Grape (紫檀)
    '护道人': '#6b4c6e',
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
                const relation = Array.isArray(edge.relation) ? edge.relation[0] : (edge.relation || '');
                if (RELATION_COLORS[relation]) {
                    fillColor = RELATION_COLORS[relation];
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

    // 4. Construct Edges with dynamic colors
    const edges: F6Edge[] = connectedEdges.map(item => {
        const relation = Array.isArray(item.relation) ? item.relation[0] : (item.relation || '');
        const color = RELATION_COLORS[relation] || DEFAULT_EDGE_COLOR;

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

/**
 * Extract distinct relationship types for the current center node.
 */
export function getAvailableRelationTypes(fullData: any[], centerId: string): string[] {
    if (!Array.isArray(fullData) || fullData.length === 0) {
        return [];
    }

    const connectedEdges = fullData.filter(item =>
        item.source === centerId || item.target === centerId
    );

    const types = new Set<string>();
    connectedEdges.forEach(item => {
        const relation = Array.isArray(item.relation) ? item.relation[0] : (item.relation || '');
        if (relation) {
            types.add(relation);
        }
    });

    return Array.from(types);
}
