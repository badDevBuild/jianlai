import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import Icon from '../Icon';
import './index.scss';

interface UgcEntryProps {
    entryName: string;
    entryType: string;
    field?: string; // e.g., 'appearance.physique', 'bio', 'cultivation'
    label?: string; // 选填：更柔和的提示文案
}

export default function UgcEntry({ entryName, entryType, field = '通用', label = '纠错/补充' }: UgcEntryProps) {
    const handleNav = (e: any) => {
        e.stopPropagation();
        Taro.navigateTo({
            url: `/pages/ugc-submit/index?name=${encodeURIComponent(entryName)}&type=${encodeURIComponent(entryType)}&field=${encodeURIComponent(field)}`
        });
    };

    return (
        <View className="inline-ugc-entry" onClick={handleNav}>
            <Icon name="pen" size={14} color="#999999" />
            <Text className="text">{label}</Text>
        </View>
    );
}
