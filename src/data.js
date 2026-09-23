export const diseases = [
  { id:'cold_plague', name:'寒疫', glyph:'寒', starter:true, unlockScar:0, line:'其来如秋风，病者尚能行。', desc:'症轻而隐，善借商旅、征兵与人群往来扩散。', tags:['潜行','人流','易扩散'], growth:1, spread:1.35, visibility:.65, environment:.8 },
  { id:'black_blight', name:'黑疽', glyph:'疽', starter:true, unlockScar:0, line:'一城尚未闻警，棺木已先不足。', desc:'爆发迅猛，善在人口密集、粮仓与军营中制造冲击。', tags:['爆发','城镇','高朝警'], growth:1.45, spread:.9, visibility:1.5, environment:1 },
  { id:'water_woe', name:'水殇', glyph:'水', starter:true, unlockScar:0, line:'水养万人，也可送万人入土。', desc:'善借洪灾、脏乱水源、灾民聚集与河运蔓延。', tags:['环境','洪灾','河网'], growth:1.2, spread:1, visibility:1, environment:1.6 },
  { id:'red_pox', name:'赤疮', glyph:'疮', starter:true, unlockScar:0, line:'它写在人的脸上，谁也无法装作没看见。', desc:'病征显眼，善侵入家庭、宫廷、军营等长期共居群体。', tags:['显症','封闭群体','社会记忆'], growth:1.1, spread:.85, visibility:1.35, environment:1.1 },
  { id:'livestock_plague', name:'牲疫', glyph:'牲', starter:false, unlockScar:20, line:'人尚未病，牛马先倒在辕下。', desc:'侵入牛马猪羊与役畜，先撕裂耕作、运输、军需和肉食供应，再把饥荒与混乱还给人间。', tags:['牲畜','农田','军需'], growth:1.12, spread:1.05, visibility:.9, environment:1.25 },
  { id:'avian_plague', name:'禽疫', glyph:'禽', starter:false, unlockScar:20, line:'城门可以关，天上的路关不住。', desc:'既能借鸡鸭鹅等家禽在村市间蔓延，也能随候鸟、水域与飞禽越过道路封锁，进行远距离跳跃。', tags:['飞禽','家禽','远跃'], growth:1.05, spread:1.22, visibility:.78, environment:1.2 },
  { id:'blood_plague', name:'血疫', glyph:'血', starter:false, unlockScar:45, line:'伤口只是门，渴望才是它真正的路。', desc:'依附血液、伤口、战争与祭祀，使活人逐渐被嗜血、暴力与秘密供血关系扭曲。', tags:['伤口','战争','异疫'], growth:1.18, spread:.98, visibility:1.1, environment:1.05 },
  { id:'corpse_plague', name:'尸疫', glyph:'尸', starter:false, unlockScar:75, special:true, line:'人死之后，疫仍不肯停。', desc:'特殊灾厄。尸体、战场与乱葬之地成为新的疫源；死亡不再结束传播，而会继续制造秩序崩坏。', tags:['尸体','战场','特殊灾厄'], growth:1.34, spread:1.08, visibility:1.55, environment:1.35 },
];

export const diseaseSkills = {
  cold_plague: {
    title:'寒疫 · 疫路',
    branches:[
      {id:'roads',name:'随人而行',line:'借天下脚步，把寒意送得更远。',nodes:[
        {id:'cold_roads_1',tier:1,xp:3,name:'客路沾寒',desc:'沿官道外溢时传播机会提高。'},
        {id:'cold_roads_2',tier:2,xp:7,name:'军伍同息',desc:'军镇与征兵、换防事件中的传播显著增强。'},
        {id:'cold_roads_3',tier:3,xp:12,name:'万里同行',desc:'蔓延姿态沿道路扩散时再次获得强化。'}
      ]},
      {id:'silent',name:'无声之寒',line:'让所有人都以为不过是寻常风寒。',nodes:[
        {id:'cold_silent_1',tier:1,xp:3,name:'微恙',desc:'蛰伏时减少对本地增长的牺牲。'},
        {id:'cold_silent_2',tier:2,xp:7,name:'无人知',desc:'蛰伏时地方察觉增长进一步降低。'},
        {id:'cold_silent_3',tier:3,xp:12,name:'春来方觉',desc:'藏疫期间仍能维持更高增长，难以及时追查。'}
      ]}
    ]
  },
  black_blight: {
    title:'黑疽 · 疫路',
    branches:[
      {id:'city',name:'噬城',line:'人越密，棺木便越快不够用。',nodes:[
        {id:'black_city_1',tier:1,xp:3,name:'密巷',desc:'人口稠密地区的本地增长提高。'},
        {id:'black_city_2',tier:2,xp:7,name:'仓营皆腐',desc:'粮仓与军镇中的增长进一步提高。'},
        {id:'black_city_3',tier:3,xp:12,name:'一夜满城',desc:'盛发姿态的爆发增长再次提高。'}
      ]},
      {id:'fear',name:'惊城',line:'死者留下恐惧，活人替你把恐惧带走。',nodes:[
        {id:'black_fear_1',tier:1,xp:3,name:'闻丧而走',desc:'地方已察觉疫情后，对外传播反而提高。'},
        {id:'black_fear_2',tier:2,xp:7,name:'闭门之前',desc:'盛发时更易制造恐慌，并获得额外外溢。'},
        {id:'black_fear_3',tier:3,xp:12,name:'举城惊逃',desc:'高察觉下仍保持强增长；盛发还能额外收获疫势。'}
      ]}
    ]
  },
  water_woe: {
    title:'水殇 · 疫路',
    branches:[
      {id:'river',name:'逐流',line:'河不问城门，水路自会替你开门。',nodes:[
        {id:'water_river_1',tier:1,xp:3,name:'顺流',desc:'沿水路外溢的传播机会提高。'},
        {id:'water_river_2',tier:2,xp:7,name:'泊舟同饮',desc:'港口与水运节点的增长提高。'},
        {id:'water_river_3',tier:3,xp:12,name:'千里一水',desc:'水路传播再次强化，河网成为真正的疫路。'}
      ]},
      {id:'disaster',name:'逐灾',line:'水患之后，人群、污水与饥饿都站在你这边。',nodes:[
        {id:'water_disaster_1',tier:1,xp:3,name:'浊井',desc:'灾患越高，本地增长越强。'},
        {id:'water_disaster_2',tier:2,xp:7,name:'灾棚',desc:'洪灾与流民事件带来的聚集收益提高。'},
        {id:'water_disaster_3',tier:3,xp:12,name:'漫城',desc:'高灾患地区的增长与外溢同时强化。'}
      ]}
    ]
  },
  red_pox: {
    title:'赤疮 · 疫路',
    branches:[
      {id:'entry',name:'入门',line:'门关得越紧，共处的人越无处可逃。',nodes:[
        {id:'red_entry_1',tier:1,xp:3,name:'同屋',desc:'军镇与京畿等长期共居环境中增长提高。'},
        {id:'red_entry_2',tier:2,xp:7,name:'深院',desc:'治理较高地区对赤疮的压制减弱。'},
        {id:'red_entry_3',tier:3,xp:12,name:'宫墙亦薄',desc:'京畿、军镇中的增长与传播再次强化。'}
      ]},
      {id:'scar',name:'留痕',line:'病会退，人却会记住脸上的痕。',nodes:[
        {id:'red_scar_1',tier:1,xp:3,name:'见疮不忘',desc:'地方察觉带来的控制压制减弱。'},
        {id:'red_scar_2',tier:2,xp:7,name:'逐户相避',desc:'高察觉时仍保有更强外溢能力。'},
        {id:'red_scar_3',tier:3,xp:12,name:'满城留痕',desc:'严密防控下仍能维持传播，并强化盛发收益。'}
      ]}
    ]
  },
  livestock_plague:{
    title:'牲疫 · 疫路',
    branches:[
      {id:'draft',name:'断辕',line:'先让牛马倒下，再让王朝的车轮停下。',nodes:[
        {id:'livestock_draft_1',tier:1,xp:3,name:'蹄下生疠',desc:'农田、军镇和粮运节点中的增长提高。'},
        {id:'livestock_draft_2',tier:2,xp:7,name:'无马可征',desc:'军镇与官道传播增强，役畜损失开始拖慢流动。'},
        {id:'livestock_draft_3',tier:3,xp:12,name:'车辙尽停',desc:'重疫地区的流动与治理下降，军需和运输受到持续冲击。'}
      ]},
      {id:'herd',name:'绝栏',line:'栏舍空了，粮价和人心会替它继续发病。',nodes:[
        {id:'livestock_herd_1',tier:1,xp:3,name:'同栏皆病',desc:'农田与人口稠密地区更容易快速累积牲疫。'},
        {id:'livestock_herd_2',tier:2,xp:7,name:'肉市断供',desc:'牲疫严重时地方秩序下降。'},
        {id:'livestock_herd_3',tier:3,xp:12,name:'牲死粮贵',desc:'高灾患地区的牲疫会进一步削弱秩序与治理。'}
      ]}
    ]
  },
  avian_plague:{
    title:'禽疫 · 疫路',
    branches:[
      {id:'wing',name:'飞羽',line:'官道有尽，天空没有。',nodes:[
        {id:'avian_wing_1',tier:1,xp:3,name:'越墙',desc:'获得低概率跨越一个中间节点的远跃传播。'},
        {id:'avian_wing_2',tier:2,xp:7,name:'候鸟',desc:'港口、水路与高流动地区的远跃概率提高。'},
        {id:'avian_wing_3',tier:3,xp:12,name:'天路无关',desc:'远跃不再明显受军镇封控影响，并能跳得更稳定。'}
      ]},
      {id:'yard',name:'禽市',line:'鸡鸭鹅不飞远，却日日在人手与笼舍间往返。',nodes:[
        {id:'avian_yard_1',tier:1,xp:3,name:'鸡舍同栖',desc:'农田、集市与人口稠密地区的本地增长提高。'},
        {id:'avian_yard_2',tier:2,xp:7,name:'活禽入市',desc:'高流动地区的道路传播增强。'},
        {id:'avian_yard_3',tier:3,xp:12,name:'扑杀令',desc:'地方察觉升高后，扑杀与赶集反而造成秩序下降和额外流动。'}
      ]}
    ]
  },
  blood_plague:{
    title:'血疫 · 疫路',
    branches:[
      {id:'covenant',name:'血契',line:'最隐秘的血路，往往藏在高墙与誓言之后。',nodes:[
        {id:'blood_covenant_1',tier:1,xp:3,name:'暗供',desc:'京畿与治理较高地区中更易潜伏。'},
        {id:'blood_covenant_2',tier:2,xp:7,name:'秘宴',desc:'借朝廷、宴饮与豪强事件时增长提高。'},
        {id:'blood_covenant_3',tier:3,xp:12,name:'以血续夜',desc:'藏疫状态下增长与传播仍保持较高水平。'}
      ]},
      {id:'frenzy',name:'血狂',line:'战争给它伤口，恐惧给它牙齿。',nodes:[
        {id:'blood_frenzy_1',tier:1,xp:3,name:'见血',desc:'军镇与军事事件中的增长提高。'},
        {id:'blood_frenzy_2',tier:2,xp:7,name:'夜袭',desc:'盛发时对外传播增强。'},
        {id:'blood_frenzy_3',tier:3,xp:12,name:'血满长街',desc:'高察觉下仍能保持爆发，并额外制造秩序压力。'}
      ]}
    ]
  },
  corpse_plague:{
    title:'尸疫 · 灾厄',
    branches:[
      {id:'pile',name:'尸积',line:'死者越多，活人的城越像一座未封的墓。',nodes:[
        {id:'corpse_pile_1',tier:1,xp:3,name:'棺木不足',desc:'病者众多、地方高察觉时增长提高。'},
        {id:'corpse_pile_2',tier:2,xp:7,name:'停尸成巷',desc:'重疫地区的秩序与治理受到额外压制。'},
        {id:'corpse_pile_3',tier:3,xp:12,name:'死地生疫',desc:'盛发时获得更强增长，并更容易沿人口逃亡外溢。'}
      ]},
      {id:'grave',name:'墓路',line:'战场、墓地与乱葬之处，都是它新的起点。',nodes:[
        {id:'corpse_grave_1',tier:1,xp:3,name:'战骨',desc:'军镇与战争相关地区增长提高。'},
        {id:'corpse_grave_2',tier:2,xp:7,name:'乱葬',desc:'高灾患地区传播增强。'},
        {id:'corpse_grave_3',tier:3,xp:12,name:'死者不止',desc:'严重尸疫可削弱封控对传播的压制。'}
      ]}
    ]
  }
};

// x/y are positions on an invented map, not geographic coordinates.
export const regions = [
  ['jing','京师','capital',86,73,77,8,62,455,120,'京畿','宫城|大典'],
  ['he_dong','河东郡','prefecture',36,76,40,88,30,345,270,'河东郡','饥荒|流民'],
  ['lin_he','临津府','prefecture',55,83,65,39,52,520,275,'临津州','秋试|豪强'],
  ['nan_he','洛南','prefecture',43,68,43,93,37,540,445,'洛南','洪灾|河网'],
  ['bei_zhen','镇朔军','military',27,81,58,45,51,290,86,'朔北','征兵|军营'],
  ['bei_an','北岸府','prefecture',31,56,61,29,49,350,165,'朔北','旱灾'],
  ['ning_zhou','绥州','prefecture',29,61,59,26,54,225,225,'朔北','商路'],
  ['yan_men','雁门府','prefecture',20,54,53,38,44,175,120,'朔北','关隘'],
  ['qiu_yuan','丘原府','prefecture',24,45,52,55,38,165,325,'河东郡','饥荒'],
  ['yun_zhou','云州府','prefecture',39,66,60,39,47,300,365,'河东郡','商路'],
  ['dong_cheng','东城府','prefecture',48,79,67,19,57,635,175,'临津州','市集'],
  ['qing_xi','清溪府','prefecture',26,59,69,23,63,665,295,'临津州','河网'],
  ['chang_ping','常平仓','granary',18,71,74,22,66,445,360,'临津州','粮仓'],
  ['xi_du','西渡港','port',22,74,58,32,49,350,470,'洛南','水运'],
  ['nan_du','南渡港','port',30,82,49,72,42,610,525,'洛南','水运|洪灾'],
  ['yu_jiang','玉江府','prefecture',32,64,56,61,45,460,555,'洛南','河网'],
  ['shuang_ling','双岭府','prefecture',21,43,72,27,56,240,490,'洛南','山道'],
  ['hai_ling','海陵府','prefecture',45,76,64,37,52,735,440,'东海州','海商'],
  ['dong_gang','东港府','prefecture',34,87,60,32,54,790,320,'东海州','港市'],
  ['lu_zhou','潞州府','prefecture',37,62,65,22,60,715,555,'东海州','商路'],
  ['shan_bei','山北府','prefecture',19,48,51,43,40,80,235,'河东郡','旱灾'],
  ['qing_guan','青关军镇','military',20,64,57,28,48,720,88,'朔北','军营'],
  ['huai_ning','怀宁府','prefecture',28,56,68,41,51,350,590,'洛南','农田'],
  ['feng_yi','丰邑府','prefecture',35,55,73,19,63,535,625,'洛南','农田'],
  ['shang_yuan','上原府','prefecture',25,53,62,36,46,565,70,'朔北','驿路'],
].map(([id,name,type,population,mobility,order,disaster,governance,x,y,province,tags])=>({id,name,type,population,mobility,order,disaster,governance,x,y,province,tags:tags.split('|')}));

export const macroRegions = [
  {id:'capital_region',name:'京畿',memberIds:['jing'],x:455,y:120},
  {id:'north',name:'朔北',memberIds:['bei_zhen','bei_an','ning_zhou','yan_men','qing_guan','shang_yuan'],x:300,y:115},
  {id:'hedong',name:'河东郡',memberIds:['he_dong','qiu_yuan','yun_zhou','shan_bei'],x:235,y:330},
  {id:'linjin',name:'临津州',memberIds:['lin_he','dong_cheng','qing_xi','chang_ping'],x:605,y:285},
  {id:'luonan',name:'洛南',memberIds:['nan_he','xi_du','nan_du','yu_jiang','shuang_ling','huai_ning','feng_yi'],x:445,y:515},
  {id:'donghai',name:'东海州',memberIds:['hai_ling','dong_gang','lu_zhou'],x:745,y:455},
];

export const roads = [
 ['jing','shang_yuan'],['jing','bei_an'],['jing','lin_he'],['jing','dong_cheng'],['shang_yuan','qing_guan'],['bei_an','bei_zhen'],['bei_an','he_dong'],['bei_zhen','yan_men'],['yan_men','ning_zhou'],['ning_zhou','he_dong'],['ning_zhou','shan_bei'],['shan_bei','qiu_yuan'],['qiu_yuan','he_dong'],['he_dong','yun_zhou'],['he_dong','lin_he'],['yun_zhou','shuang_ling'],['yun_zhou','chang_ping'],['lin_he','chang_ping'],['lin_he','qing_xi'],['lin_he','dong_cheng'],['dong_cheng','dong_gang'],['qing_xi','dong_gang'],['qing_xi','hai_ling'],['chang_ping','nan_he'],['shuang_ling','xi_du'],['xi_du','yu_jiang'],['yu_jiang','nan_he'],['nan_he','nan_du'],['nan_he','feng_yi'],['nan_du','hai_ling'],['hai_ling','lu_zhou'],['lu_zhou','feng_yi'],['yu_jiang','huai_ning'],['huai_ning','feng_yi']
];
export const waterways = [['xi_du','yu_jiang'],['yu_jiang','nan_he'],['nan_he','nan_du'],['nan_du','hai_ling'],['hai_ling','dong_gang'],['lin_he','qing_xi'],['qing_xi','dong_gang']];

// Scheduled stories make the first playthrough legible; all modifiers affect the simulation while active.
export const events = [
 {id:'refugees',turn:0,duration:4,title:'河东饥民外逃',category:'population',regionIds:['he_dong','ning_zhou','qiu_yuan'],text:'河东饥民沿官道南下，驿舍与渡口皆已拥塞。',effect:'官道流动增加，寒疫更易外溢。',mobility:22,spread:.24,cost:4,borrowable:true},
 {id:'flood',turn:0,duration:5,title:'洛南洪灾',category:'disaster',regionIds:['nan_he','nan_du','yu_jiang'],text:'洛南决堤，城外积水久不退，灾民聚于高地。',effect:'灾患与人群聚集上升，水殇易发。',disaster:22,spread:.18,cost:4,borrowable:true},
 {id:'recruit',turn:0,duration:3,title:'朔北征兵',category:'military',regionIds:['bei_zhen','bei_an','ning_zhou'],text:'镇朔军扩募新兵，沿途州府连日送人北上。',effect:'军道流动增加。',mobility:17,spread:.2,cost:5,borrowable:true},
 {id:'exam',turn:1,duration:2,title:'秋闱将开',category:'society',regionIds:['lin_he','jing','dong_cheng'],text:'三州士子汇聚临津，客栈已满，寺观借作宿处。',effect:'赴考人流增加，寒疫与赤疮受益。',mobility:25,spread:.28,cost:4,borrowable:true},
 {id:'suppress',turn:2,duration:2,title:'权相压奏',category:'politics',regionIds:['he_dong','jing'],text:'裴桢留中不发河东求援奏折。朝中仍称民间安稳。',effect:'朝警降低，地方应对延迟。',alert:-2,governance:-10},
 {id:'relief',turn:3,duration:3,title:'太子开仓',category:'politics',regionIds:['chang_ping','nan_he'],text:'东宫开常平仓赈民，城南一日聚民逾万人。',effect:'先聚人，后分流；治理逐旬改善。',mobility:18,spread:.16,governance:8},
 {id:'gentry',turn:4,duration:3,title:'豪强关庄',category:'society',regionIds:['lin_he','qing_xi'],text:'崔氏闭庄，逐无粮佃户出门。',effect:'庄内收紧，官道流民增加。',mobility:18,order:-7,spread:.18},
 {id:'unpaid',turn:5,duration:3,title:'边军欠饷',category:'military',regionIds:['bei_zhen','qing_guan'],text:'北军两月未得足饷，三营聚众索粮。',effect:'军营秩序下降，封营效率削弱。',order:-18,governance:-8},
 {id:'banquet',turn:6,duration:2,title:'万寿宴',category:'politics',regionIds:['jing','shang_yuan','lin_he'],text:'圣上不许因地方疫患减损万寿礼，各地官员入京朝贺。',effect:'京师流动骤升，返乡官员带来传播风险。',mobility:28,spread:.3,cost:6,borrowable:true},
 {id:'rumor',turn:7,duration:2,title:'井中有鬼',category:'society',regionIds:['nan_he','nan_du'],text:'百姓弃井，争往洛南取水。',effect:'河岸聚集上升，水殇更易扩散。',order:-5,spread:.24},
 {id:'lockdown',turn:8,duration:3,title:'临津闭门',category:'epidemic',regionIds:['lin_he'],text:'临津封闭四门，商旅不得进出，城外车马绵延。',effect:'出城流动受阻，城外人群聚集。',mobility:-50,governance:10,alert:3},
 {id:'palace',turn:9,duration:2,title:'宫门夜闭',category:'epidemic',regionIds:['jing'],text:'内廷忽然封门，太医院诸医连夜入宫。',effect:'朝廷警觉上升。',alert:6,governance:12},
];

export const factions = [
 {id:'emperor',name:'皇帝',person:'景承炆',symbol:'玺'},
 {id:'chancellor',name:'权相',person:'裴桢',symbol:'令'},
 {id:'crown_prince',name:'储君',person:'景聿修',symbol:'东'},
 {id:'army',name:'边军',person:'霍云',symbol:'戍'},
 {id:'gentry',name:'豪强',person:'崔蘅',symbol:'庄'},
 {id:'people',name:'百姓',person:'天下庶民',symbol:'民'},
];
