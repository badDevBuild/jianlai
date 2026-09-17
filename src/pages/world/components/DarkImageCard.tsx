import { View, Text, Image } from '@tarojs/components';

interface Props {
    title: string;
    desc: string;
    label: string;
    image: string;
    threatLevel?: string; // e.g., '极危'
}

export default function DarkImageCard({ title, desc, label, image, threatLevel }: Props) {
    return (
        <View className="dark-image-card">
            <Image className="card-img" src={image} mode="aspectFill" />
            <View className="card-content">
                <Text className="label">{label}</Text>
                <Text className="title">{title}</Text>
                <Text className="desc">{desc}</Text>
            </View>
            {threatLevel && (
                <View className="threat-badge">
                    <Text className="threat-label">THREAT</Text>
                    <Text className="threat-val">{threatLevel}</Text>
                </View>
            )}
        </View>
    );
}
