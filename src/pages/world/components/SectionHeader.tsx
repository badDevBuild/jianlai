import { View, Text } from '@tarojs/components';

interface Props {
    title: string;
    tag?: string;
}

export default function SectionHeader({ title, tag }: Props) {
    return (
        <View className="section-header">
            <View className="title-group">
                <View className="red-bar" />
                <Text className="title">{title}</Text>
            </View>
            {tag && <Text className="header-tag">{tag}</Text>}
        </View>
    );
}
