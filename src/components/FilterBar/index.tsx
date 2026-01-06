import { View, Text } from '@tarojs/components';
import './index.scss';

interface FilterBarProps {
    items: string[];
    selectedItems: string[];
    onToggle: (item: string) => void;
    onReset?: () => void;
}

export default function FilterBar({ items, selectedItems, onToggle, onReset }: FilterBarProps) {
    const isAllSelected = selectedItems.length === 0;

    return (
        <View className="filter-bar">
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
        </View>
    );
}
