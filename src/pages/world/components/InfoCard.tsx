import { View, Text } from '@tarojs/components';

interface Props {
    title: string;
    rule: string;
    desc: string;
    icon?: string;
    bgChar?: string; // Character for background watermark
}

export default function InfoCard({ title, rule, desc, icon, bgChar }: Props) {
    return (
        <View className="info-card">
            {bgChar && <Text className="card-bg-icon">{bgChar}</Text>}
            {icon && <Text className="card-icon">{icon}</Text>}
            <Text className="card-title">{title}</Text>
            <Text className="card-rule">{rule}</Text>
            <Text className="card-desc">{desc}</Text>
        </View>
    );
}
