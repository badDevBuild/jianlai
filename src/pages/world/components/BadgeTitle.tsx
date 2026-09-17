import { View, Text } from '@tarojs/components';

interface Props {
    badge: string;
    title: string;
    subInfo?: string;
}

export default function BadgeTitle({ badge, title, subInfo }: Props) {
    return (
        <View className="badge-title">
            <Text className="badge">{badge}</Text>
            <Text className="title">{title}</Text>
            {subInfo && <View className="sub-info">{subInfo}</View>}
        </View>
    );
}
