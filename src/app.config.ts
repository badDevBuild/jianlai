export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/characters/index',
    'pages/character-detail/index',
    'pages/factions/index',
    'pages/faction-detail/index',
    'pages/artifacts/index',
    'pages/artifact-detail/index',
    'pages/locations/index',
    'pages/location-detail/index',
    'pages/search/index',
    'pages/quotes/index',
    'pages/graph/index',
    'pages/timeline/index',
    'pages/map/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '剑来光阴',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#485a6c', // 水墨靛青
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/icons/home.png',
        selectedIconPath: 'assets/icons/home-active.png'
      },
      {
        pagePath: 'pages/graph/index',
        text: '关系图谱',
        iconPath: 'assets/icons/graph.png',
        selectedIconPath: 'assets/icons/graph-active.png'
      },
      {
        pagePath: 'pages/map/index',
        text: '地图',
        iconPath: 'assets/icons/map.png',
        selectedIconPath: 'assets/icons/map-active.png'
      },
      {
        pagePath: 'pages/timeline/index',
        text: '时间线',
        iconPath: 'assets/icons/timeline.png',
        selectedIconPath: 'assets/icons/timeline-active.png'
      }
    ]
  }
})
