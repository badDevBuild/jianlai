import { useEffect, useRef, useState } from 'react';
import { View, Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
// Point explicitly to src since package.json lacks main field
import F6 from '@antv/f6-wx/src/index';
// F6 layout needs to be imported if not using web worker layout
import Force from '@antv/f6-wx/src/extends/layout/forceLayout';
// Register layout
F6.registerLayout('force', Force);


interface F6GraphProps {
    data: any;
    onNodeTap?: (nodeId: string) => void;
    width?: number;
    height?: number;
}

export default function F6Graph({ data, onNodeTap, width = 375, height = 600 }: F6GraphProps) {
    const graphRef = useRef<any>(null);
    const [inited, setInited] = useState(false);
    // Use ref to keep track of latest callback
    const onNodeTapRef = useRef(onNodeTap);

    // Update ref when prop changes
    useEffect(() => {
        onNodeTapRef.current = onNodeTap;
    }, [onNodeTap]);

    useEffect(() => {
        // Delay initialization slightly to ensure DOM is ready
        setTimeout(() => {
            const query = Taro.createSelectorQuery();
            query.select('#graph-canvas')
                .fields({ node: true, size: true })
                .exec((res) => {
                    if (!res[0] || !res[0].node) {
                        console.error('Canvas node not found');
                        return;
                    }

                    const canvas = res[0].node;
                    // Use suitable API for pixelRatio
                    const info = Taro.getSystemInfoSync();
                    const pixelRatio = info.pixelRatio;

                    console.log('F6Graph: Canvas found', { width, height, pixelRatio });

                    canvas.width = width * pixelRatio;
                    canvas.height = height * pixelRatio;

                    const ctx = canvas.getContext('2d');

                    if (!graphRef.current) {
                        console.log('F6Graph: Initializing F6 instance...');
                        // ... initialization code ...
                        graphRef.current = new F6.Graph({
                            context: ctx,
                            width: width,
                            height: height,
                            pixelRatio,
                            fitView: true,
                            fitViewPadding: 60,
                            renderer: 'mini-native',
                            minZoom: 0.2,
                            maxZoom: 5,
                            layout: {
                                type: 'force',
                                preventOverlap: true,
                                linkDistance: 150,
                                nodeStrength: -50,
                                edgeStrength: 0.1,
                                collideStrength: 0.8,
                            },
                            defaultNode: {
                                size: 55, // Increased from 40 to 55 for easier clicking
                                labelCfg: {
                                    position: 'bottom',
                                    offset: 5,
                                    style: {
                                        fontSize: 12,
                                        fill: '#666'
                                    }
                                }
                            },
                            defaultEdge: {
                                labelCfg: {
                                    autoRotate: true,
                                    style: {
                                        fontSize: 10,
                                        fill: '#999',
                                        background: {
                                            fill: '#ffffff',
                                            padding: [2, 2, 2, 2],
                                            radius: 2,
                                        },
                                    }
                                }
                            },
                            modes: {
                                default: ['drag-canvas', 'zoom-canvas', 'drag-node'],
                            },
                        });

                        // Smart Tap Implementation: Handle both precise clicks and "fat finger" misses
                        graphRef.current.on('tap', (e: any) => {
                            // 1. Precise Hit: F6 detected a node natively
                            if (e.item && e.item.getType() === 'node') {
                                const model = e.item.getModel();
                                if (onNodeTapRef.current) onNodeTapRef.current(model.id);
                                return;
                            }

                            // 2. Fuzzy Hit: User clicked empty space, check if close enough to a node
                            const point = e.canvas || { x: e.x, y: e.y };
                            const nodes = graphRef.current.getNodes();
                            let closest: any = null;
                            let minDist = Infinity;
                            const CLICK_THRESHOLD = 45; // Generous 45px radius (Node radius is ~27.5)

                            nodes.forEach(node => {
                                const model = node.getModel();
                                // Calculate Euclidean distance
                                const dist = Math.sqrt(Math.pow(model.x - point.x, 2) + Math.pow(model.y - point.y, 2));
                                if (dist < minDist) {
                                    minDist = dist;
                                    closest = model;
                                }
                            });

                            // If we found a node within reasonable range, trigger it
                            if (closest && minDist <= CLICK_THRESHOLD) {
                                if (onNodeTapRef.current) onNodeTapRef.current(closest.id);
                            }
                        });

                        // Initial render if data exists
                        if (data && data.nodes && data.nodes.length > 0) {
                            console.log('F6Graph: Rendering initial data', data.nodes.length);
                            graphRef.current.data(data);
                            graphRef.current.render();
                            graphRef.current.fitView();
                        } else {
                            console.warn('F6Graph: No initial data or empty nodes');
                        }

                        setInited(true);
                    } else {
                        // Graph already initialized, update size
                        console.log('F6Graph: Resizing graph', width, height);
                        graphRef.current.changeSize(width, height);
                        graphRef.current.fitView();
                    }
                });
        }, 100);

        return () => {
            if (graphRef.current) {
                graphRef.current.destroy();
                graphRef.current = null;
            }
        }
    }, [width, height]); // Add dependencies to resize graph if dimensions change

    // Handle data updates
    useEffect(() => {
        if (inited && graphRef.current && data) {
            graphRef.current.changeData(data);
            // Force fit view after data update to ensure visibility
            setTimeout(() => {
                graphRef.current.fitView();
            }, 50);
        }
    }, [data, inited]);

    return (
        <View className="f6-graph-container" style={{ width: width + 'px', height: height + 'px', position: 'relative', zIndex: 1 }}>
            <Canvas
                type="2d"
                id="graph-canvas"
                style={{ width: '100%', height: '100%' }}
                onTouchStart={(e) => {
                    if (graphRef.current) graphRef.current.emitEvent(e);
                }}
                onTouchMove={(e) => {
                    if (graphRef.current) graphRef.current.emitEvent(e);
                }}
                onTouchEnd={(e) => {
                    if (graphRef.current) graphRef.current.emitEvent(e);
                }}
            />
        </View>
    );
}
