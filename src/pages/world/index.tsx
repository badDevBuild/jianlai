import { View, Text, Image, ScrollView } from '@tarojs/components';
import './index.scss';
import BadgeTitle from './components/BadgeTitle';
import SectionHeader from './components/SectionHeader';
import InfoCard from './components/InfoCard';
import TimelineCard from './components/TimelineCard';
import DarkImageCard from './components/DarkImageCard';
import { useAppShare } from '../../utils/share';
import Icon from '../../components/Icon';

export default function WorldPage() {
    useAppShare({
        title: '【剑来·光阴】世界观架构深度剖析',
    });

    // Reuse the mountain bg for hero
    const heroBg = 'https://shushu.host/jianlai/img/bg-mountain.jpg';

    return (
        <ScrollView className="world-page" scrollY>
            {/* 1. Hero Section */}
            <View className="hero-section">
                <Image className="hero-bg" src={heroBg} mode="aspectFill" />
                <View className="hero-overlay" />
                {/* Stamp would need an image, skipping or css shape for now */}
                {/* <View className="hero-stamp" /> */}
                <View className="hero-title-area">
                    <View className="hero-title">剑道独尊</View>
                    <View className="hero-subtitle">关于《剑来》世界观架构、底层法则与社会形态的深度剖析</View>
                </View>
            </View>

            <View className="content-section">

                {/* 2. Cosmology */}
                <BadgeTitle badge="宏观" title="四座天下" subInfo="浩然 · 蛮荒 · 青冥 · 莲花" />

                <View className="intro-text">
                    这方天地被划分为四座主要天下，格局各异。浩然天下儒家独大，礼乐治世；蛮荒天下妖族横行，弱肉强食；青冥天下道门清净，化外之地；莲花天下佛法无边，普度众生。
                </View>

                <View className="info-grid">
                    <InfoCard
                        title="浩然天下"
                        rule="儒家 · 规矩"
                        desc="版图辽阔，九大洲家国同构。书院圣人制定'天条'，限制修士杀戮。讲究长幼尊卑，文明之序。"
                        bgChar="儒"
                    />
                    <InfoCard
                        title="蛮荒天下"
                        rule="妖族 · 弱肉强食"
                        desc="环境恶劣，王座大妖统治的丛林社会。作为浩然天下的'外部威胁'而存在，迫使文明时刻保持警惕。"
                        bgChar="妖"
                    />
                    <InfoCard
                        title="青冥天下"
                        rule="道家 · 清静"
                        desc="拥有白玉京。宗门林立，城邦自治。修士更倾向于出世修道，追求长生逍遥，少问世俗。"
                        bgChar="道"
                    />
                    <InfoCard
                        title="莲花天下"
                        rule="佛家 · 因果"
                        desc="西方极乐，封闭的佛国。充当世界的净化厂，化解天地间过重的杀孽与恶业。"
                        bgChar="佛"
                    />
                    <InfoCard
                        title="第五座天下"
                        rule="归墟 · 遗迹"
                        desc="上古破碎大陆的残片集合，被流放神灵与旧时代遗民的聚集地，世界的'回收站'与'潜意识'。"
                        bgChar="旧"
                    />
                    <InfoCard
                        title="光阴长河"
                        rule="时间 · 禁忌"
                        desc="连接古今的物理通道。十四境以上大能可踏足观测，但干涉过去未来会遭天道反噬。"
                        bgChar="时"
                    />
                </View>

                {/* Strategic Locations */}
                <SectionHeader title="战略枢纽" />
                <View className="strategic-stack">
                    <DarkImageCard
                        label="THE BARRIER"
                        title="剑气长城"
                        desc="天地间最大的'绞肉机'。将蛮荒天下的暴力气运转化为剑气，是浩然天下抵御妖族入侵的唯一防线。"
                        image="https://shushu.host/jianlai/img/bg-mountain.jpg"
                        threatLevel="极危"
                    />
                    <DarkImageCard
                        label="THE HUB"
                        title="倒悬山"
                        desc="悬浮于海上的巨大山峦。四座天下最大的物资集散地，道家坐镇的法外之地，情报与财富的灰色港口。"
                        image="https://shushu.host/jianlai/img/bg-bamboo.jpg"
                    />
                    <DarkImageCard
                        label="THE FARM"
                        title="骊珠洞天"
                        desc="陈平安故乡，实为'养蛊皿'。凡在此出生的孩子皆连着本命瓷，被外界大修士如商品般买卖奴役。"
                        image="https://shushu.host/jianlai/img/bg-mountain.jpg"
                    />
                </View>


                {/* 3. Cultivation */}
                <SectionHeader title="修行登高" tag="十五境体系" />

                <View className="timeline-container">
                    <View className="timeline-bg-text">QI REFINER</View>
                    <TimelineCard
                        title="十四 · 十五境"
                        subtitle="合道 · 至高"
                        description="与大道融合，言出法随。十五境为传说中的'无敌'。"
                        tags={['合道', '至高']}
                        isHighlight
                    />
                    <TimelineCard
                        title="第十 ~ 十三境"
                        subtitle="仙人 · 飞升"
                        description="彻底脱离凡胎。仙人(10)、飞升(11)、失传(12)境界。"
                        tags={['飞升', '仙人', '失传']}
                    />
                    <TimelineCard
                        title="上五境"
                        subtitle="第七 ~ 第九境"
                        description="金丹(7)、元婴(8)、玉璞(9)。借天地之势，寿命悠长。"
                        tags={['玉璞', '元婴', '金丹']}
                    />
                    <TimelineCard
                        title="中五境"
                        subtitle="第四 ~ 第六境"
                        description="洞府(4)、观海(5)、龙门(6)。开辟体内小天地，灵气如海。"
                        tags={['龙门', '观海', '洞府']}
                    />
                    <TimelineCard
                        title="下五境"
                        subtitle="第一 ~ 第三境"
                        description="铜皮(1)、草根(2)、柳筋(3)。纳气入体，凡俗巅峰。"
                        tags={['柳筋', '草根', '铜皮']}
                        isLast
                    />
                </View>

                <View style={{ height: '32px' }} />

                <SectionHeader title="武道登高" tag="十一境体系" />
                <View className="timeline-container">
                    <View className="timeline-bg-text">MARTIAL</View>
                    <TimelineCard
                        title="第十一境 · 武神"
                        subtitle="武道尽头"
                        description="肉身即神灵。传说中的境界，可手撕飞升境修士。"
                        tags={['武神', '通神']}
                        isHighlight
                    />
                    <TimelineCard
                        title="第十境 · 止境"
                        subtitle="气盛 · 归真 · 神到"
                        description="人类肉体的极限。分为三层：气盛、归真、神到。"
                        tags={['神到', '归真', '气盛']}
                    />
                    <TimelineCard
                        title="七 ~ 九境"
                        subtitle="金身 · 远游 · 山巅"
                        description="金身不漏(7)、远游千里(8)、拳意山巅(9)。一拳破万法。"
                        tags={['山巅', '远游', '金身']}
                    />
                    <TimelineCard
                        title="四 ~ 六境"
                        subtitle="骨气 · 魄力 · 武胆"
                        description="练出一口真气。骨气(4)、魄力(5)、武胆(6)。"
                        tags={['武胆', '魄力', '骨气']}
                    />
                    <TimelineCard
                        title="一 ~ 三境"
                        subtitle="泥胚 · 草根 · 柳筋"
                        description="打熬筋骨。泥胚(1)、草根(2)、柳筋(3)。"
                        tags={['柳筋', '草根', '泥胚']}
                        isLast
                    />
                </View>

                <View style={{ height: '32px' }} />
                <SectionHeader title="核心概念" />
                <View className="info-grid">
                    <InfoCard
                        title="本命瓷"
                        rule="命运 · 禁锢"
                        desc="骊珠洞天产物。掌握本命瓷可操控孩童生死与气运。"
                        bgChar="瓷"
                    />
                    <InfoCard
                        title="飞剑"
                        rule="杀力 · 本命"
                        desc="剑修将毕生修为压缩在一把本命飞剑中，拥有独一无二的神通。"
                        bgChar="剑"
                    />
                    <InfoCard
                        title="合道"
                        rule="十四境 · 融合"
                        desc="修士与某种事物或概念（如月色、地利）融合，借假修真。"
                        bgChar="合"
                    />
                    <InfoCard
                        title="兵解/尸解"
                        rule="转世 · 脱身"
                        desc="兵解为无奈转世；尸解为道家假死脱身之术。"
                        bgChar="解"
                    />
                </View>

                <SectionHeader title="特殊职业" />
                <View className="currency-list">
                    <View className="currency-item">
                        <Icon name="fist" size={24} color="#485a6c" />
                        <View className="info">
                            <Text className="name">纯粹武夫</Text>
                            <Text className="rate">一口真气不散</Text>
                        </View>
                        <Text className="usage">只修肉身，人定胜天。无需天地灵气。</Text>
                    </View>
                    <View className="currency-item">
                        <Icon name="swords" size={24} color="#485a6c" />
                        <View className="info">
                            <Text className="name">剑修</Text>
                            <Text className="rate">杀力最强</Text>
                        </View>
                        <Text className="usage">专为杀戮而生，一剑破万法。</Text>
                    </View>
                    <View className="currency-item">
                        <Icon name="talisman" size={24} color="#485a6c" />
                        <View className="info">
                            <Text className="name">符箓师</Text>
                            <Text className="rate">借法天地</Text>
                        </View>
                        <Text className="usage">将法术固化在纸上，战场炮台。</Text>
                    </View>
                    <View className="currency-item">
                        <Icon name="grid" size={24} color="#485a6c" />
                        <View className="info">
                            <Text className="name">阵师</Text>
                            <Text className="rate">画地为牢</Text>
                        </View>
                        <Text className="usage">利用山川地势构建规则，阵内无敌。</Text>
                    </View>
                </View>

                <SectionHeader title="核心法则" />
                <View className="info-grid">
                    <InfoCard
                        title="压胜与禁忌"
                        rule="天道 · 规则"
                        desc="真名禁忌、山上山下之隔。越线者必遭天谴。"
                    />
                    <InfoCard
                        title="气运与功德"
                        rule="概率 · 资源"
                        desc="气运可掠夺交易。功德金光可抵消天劫，作为神灵考评。"
                    />
                </View>

                <SectionHeader title="资源流转" />
                <View className="currency-list">
                    <View className="currency-item">
                        <Icon name="crown" size={24} color="#b8860b" />
                        <View className="info">
                            <Text className="name">王朝供奉</Text>
                            <Text className="rate">资源换和平 / 气运</Text>
                        </View>
                        <Text className="usage">王朝向宗门提供物资，换取国境安全与风调雨顺。</Text>
                    </View>
                    <View className="currency-item">
                        <Icon name="cycle" size={24} color="#485a6c" />
                        <View className="info">
                            <Text className="name">宗门反哺</Text>
                            <Text className="rate">护国法师 / 挑选苗子</Text>
                        </View>
                        <Text className="usage">派遣供奉入驻朝廷，获取人道气运稳固山门。</Text>
                    </View>

                    <View style={{ height: '40px' }} />


                </View>

                {/* 4. Three Teachings */}
                <SectionHeader title="三教百家" />
                <ScrollView scrollX className="three-teachings-scroll">
                    <View style={{ display: 'flex' }}>
                        <View className="teaching-card">
                            <Text className="bg-char">儒</Text>
                            <View className="content">
                                <Text className="title">儒家</Text>
                                <Text className="subtitle">浩然天下之主</Text>
                                <Text className="desc">讲究规矩与礼乐。书院君子“口含天宪”，定住术法。</Text>
                            </View>
                        </View>

                        <View className="teaching-card">
                            <Text className="bg-char">道</Text>
                            <View className="content">
                                <Text className="title">道家</Text>
                                <Text className="subtitle">青冥天下之主</Text>
                                <Text className="desc">清静无为，顺应自然。追求个人超脱。</Text>
                            </View>
                        </View>

                        <View className="teaching-card">
                            <Text className="bg-char">佛</Text>
                            <View className="content">
                                <Text className="title">佛家</Text>
                                <Text className="subtitle">莲花天下之主</Text>
                                <Text className="desc">慈悲为怀，修来世福报，化解天地因果。</Text>
                            </View>
                        </View>

                        {/* Padding right */}
                        <View style={{ width: '16px' }} />
                    </View>
                </ScrollView>

                {/* 5. Economy */}
                <SectionHeader title="山上经济" />
                <View className="currency-list">
                    <View className="currency-item">
                        <Icon name="snowflake" size={24} color="#485a6c" />
                        <View className="info">
                            <Text className="name">雪花钱</Text>
                            <Text className="rate">基准单位</Text>
                        </View>
                        <Text className="usage">底层修士日用，购买符箓灵草</Text>
                    </View>

                    <View className="currency-item">
                        <Icon name="sun" size={24} color="#b8860b" />
                        <View className="info">
                            <Text className="name">小暑钱</Text>
                            <Text className="rate">≈ 100 雪花钱</Text>
                        </View>
                        <Text className="usage">中五境硬通货，买法器灵丹</Text>
                    </View>

                    <View className="currency-item">
                        <Icon name="rain" size={24} color="#485a6c" />
                        <View className="info">
                            <Text className="name">谷雨钱</Text>
                            <Text className="rate">≈ 100 小暑钱</Text>
                        </View>
                        <Text className="usage">战略物资，破境回复灵力</Text>
                    </View>
                </View>

            </View>
        </ScrollView>
    );
}
