import { View, Text } from '@tarojs/components';

interface Props {
    title: string;
    subtitle?: string;
    description: string;
    tags: string[];
    isHighlight?: boolean;
    isLast?: boolean;
}

export default function TimelineCard({ title, subtitle, description, tags, isHighlight, isLast }: Props) {
    return (
        <View className={`timeline-item ${isHighlight ? 'highlight' : ''} ${isLast ? 'last-item' : ''}`}>
            <View className="node" />
            <View className="content">
                <Text className="title">{title}</Text>
                {subtitle && <Text className="subtitle">{subtitle}</Text>}
                <View className="tags">
                    {tags.map(t => <Text key={t} className="tag">{t}</Text>)}
                </View>
                <Text className="description">{description}</Text>
            </View>
        </View>
    );
}
