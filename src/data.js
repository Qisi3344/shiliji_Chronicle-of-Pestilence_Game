export const diseases = [
  { id:'cold_plague', name:'寒疫', line:'其来如秋风，病者尚能行。', desc:'症轻而隐，善借商旅、征兵与人群往来扩散。', tags:['潜行','人流','易扩散'], growth:1, spread:1.35, visibility:.65, environment:.8 },
  { id:'black_blight', name:'黑疽', line:'一城尚未闻警，棺木已先不足。', desc:'爆发迅猛，善在人口密集、粮仓与军营中制造冲击。', tags:['爆发','城镇','高朝警'], growth:1.45, spread:.9, visibility:1.5, environment:1 },
  { id:'water_woe', name:'水殇', line:'水养万人，也可送万人入土。', desc:'善借洪灾、脏乱水源、灾民聚集与河运蔓延。', tags:['环境','洪灾','河网'], growth:1.2, spread:1, visibility:1, environment:1.6 },
  { id:'red_pox', name:'赤疮', line:'它写在人的脸上，谁也无法装作没看见。', desc:'病征显眼，善侵入家庭、宫廷、军营等长期共居群体。', tags:['显症','封闭群体','社会记忆'], growth:1.1, spread:.85, visibility:1.35, environment:1.1 },
];

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
  ['shang_yuan','上原府','prefecture',25,53,62,36,46,565,70,'临津州','驿路'],
].map(([id,name,type,population,mobility,order,disaster,governance,x,y,province,tags])=>({id,name,type,population,mobility,order,disaster,governance,x,y,province,tags:tags.split('|')}));

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
