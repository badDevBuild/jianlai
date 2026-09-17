import { View, Text } from '@tarojs/components';
import { useState } from 'react';
import Icon from '../Icon';
import './index.scss';

interface FilterBarProps {
    items: string[];
    selectedItems: string[];
    onToggle: (item: string) => void;
    onReset?: () => void;
}

export default function FilterBar({ items, selectedItems, onToggle, onReset }: FilterBarProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const isAllSelected = selectedItems.length === 0;

    // Threshold to show expand button
    const SHOW_EXPAND_THRESHOLD = 5;
    const shouldShowExpand = items.length > SHOW_EXPAND_THRESHOLD;

    return (
        <View className={`filter-bar-wrapper ${isExpanded ? 'expanded' : ''}`}>

            <View className="filter-scroll-area">
                {/* Reset / All Button */}
                <View
                    className={`filter-chip ${isAllSelected ? 'active' : ''}`}
                    onClick={onReset}
                >
                    <Text className="filter-text">全部</Text>
                </View>

                <View className="filter-divider" />

                {items.map(item => {
                    const isSelected = selectedItems.includes(item);
                    return (
                        <View
                            key={item}
                            className={`filter-chip ${isSelected ? 'active' : ''}`}
                            onClick={() => onToggle(item)}
                        >
                            <Text className="filter-text">{item}</Text>
                        </View>
                    );
                })}

                {/* Spacer for button in scroll mode */}
                {shouldShowExpand && <View className="expand-placeholder" />}
            </View>

            {/* Expand Toggle Button */}
            {shouldShowExpand && (
                <View
                    className={`expand-btn ${isExpanded ? 'active' : ''}`}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <Icon name={isExpanded ? 'chevronUp' : 'chevronDown'} size={14} color="#666666" />
                </View>
            )}
        </View>
    );
}
