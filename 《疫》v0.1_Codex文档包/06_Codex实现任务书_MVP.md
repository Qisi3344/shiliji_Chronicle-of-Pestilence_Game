# 《疫》Codex 实现任务书 v0.1
## 目标：先做出可玩的手机端优先 MVP

---

# 1. 总要求

请不要只完成孤立页面。

实现时始终围绕完整操作链：

> 身份选择 → 命名 → 序章 → 首次选疫 → 选择降临地点 → 天下地图 → 地区详情 → 行动 → 推演下一旬 → 旬结算 → 王朝响应 → 下一旬

技术实现中优先保证：
- 可玩；
- 状态可持续；
- 手机操作顺畅；
- PC 自适应；
- 数据驱动；
- 后续方便增加「医」身份。

---

# 2. 推荐技术栈

可使用：
- React / Next.js
- TypeScript
- Zustand
- Tailwind CSS
- Framer Motion
- SVG 节点地图

不要首版就引入 GIS。

---

# 3. 页面

## `/`
启动页：
- 新局
- 续局
- 档案
- 设置

## `/new`
身份选择：
- 疫：可选
- 医：展示但锁定

## `/name`
为这一世之疫命名

## `/prologue`
序章文字：
承熙二十三年……

## `/disease-select`
首次选疫

## `/game`
核心游戏页：
- 天下
- 疫册
- 诏闻
- 王朝

---

# 4. 游戏状态建议

```ts
type GlobalState = {
  year: number;
  month: number;
  tenDayPeriod: "early" | "middle" | "late";
  plagueName: string;
  plaguePower: number;   // 疫势
  plagueScar: number;    // 疫痕
  courtAlert: number;    // 朝警
  stage: "arrival" | "growing" | "epidemic" | "erosion" | "chaos";
  unlockedDropCount: number;
};
```

---

# 5. 地图节点

```ts
type Region = {
  id: string;
  name: string;
  type: "capital" | "prefecture" | "military" | "port" | "granary";
  population: number;
  mobility: number;
  order: number;
  disaster: number;
  governance: number;
  x: number;
  y: number;
  tags: string[];
};
```

---

# 6. 疫情

```ts
type Outbreak = {
  id: string;
  regionId: string;
  diseaseId: string;
  infected: number;
  stance: "dormant" | "spread" | "surge";
  localAwareness: number;
  hiddenTurns: number;
};
```

---

# 7. 疫病

```ts
type Disease = {
  id: string;
  name: string;
  flavor: string;
  localGrowth: number;
  outwardSpread: number;
  visibility: number;
  environmentDependence: number;
  tags: string[];
};
```

首版四种：
- cold_plague 寒疫
- black_blight 黑疽
- water_woe 水殇
- red_pox 赤疮

---

# 8. 事件

```ts
type GameEvent = {
  id: string;
  title: string;
  category: "disaster" | "population" | "politics" | "military" | "society" | "epidemic";
  regionIds: string[];
  startTurn: number;
  duration: number;
  severity: number;
  borrowable: boolean;
  effects: EventEffect[];
  narrative: string;
};
```

---

# 9. 势力

```ts
type FactionState = {
  id: "emperor" | "chancellor" | "crown_prince" | "army" | "gentry" | "people";
  name: string;
  status: string;
  influence: number;
  lastAction?: string;
};
```

---

# 10. 首版固定人物

- 皇帝：萧承玦
- 权相：裴阙
- 储君：萧祈安
- 镇北大将军：霍沉岳
- 地方豪强示例：临河崔氏

---

# 11. 主游戏回合

每次点击：
**推演下一旬**

执行顺序：

1. local outbreak update
2. disease spread
3. world events
4. local awareness
5. local government response
6. faction actions
7. court alert
8. plague power
9. plague scar milestones
10. event log
11. UI refresh

---

# 12. 初版必须有的事件

固定做至少：

1. 河东饥民外逃
2. 南河洪灾
3. 北境征兵
4. 秋试
5. 权相压奏
6. 太子开仓
7. 豪强关庄
8. 边军欠饷
9. 封城
10. 万寿宴

---

# 13. 首版必须做的操作

## 降疫
- 选择疫病
- 选择地区
- 消耗疫势
- 创建 outbreak

## 驭疫
三种：
- 蛰伏
- 蔓延
- 盛发

## 借势
- 仅事件可借时出现
- 消耗疫势
- 临时提高对应传播收益

## 藏疫
- 消耗疫势
- 降低地方察觉与朝警贡献

---

# 14. 响应式

手机：
- 底部导航
- Bottom Sheet
- 地图占主屏

桌面：
- 左：导航+全局状态
- 中：地图
- 右：地区详情+行动

不要维护两套状态逻辑。

---

# 15. 首版验收条件

完成后至少可以做到：

1. 新局选择「疫」
2. 自定义疫名
3. 看完整序章
4. 选寒疫/黑疽/水殇/赤疮
5. 选地区首次降疫
6. 查看地图节点数据
7. 切换蛰伏/蔓延/盛发
8. 点击推演下一旬
9. 疫情在节点间传播
10. 疫势/疫痕/朝警更新
11. 触发至少 10 个固定事件
12. 王朝六方势力至少能产生基础动作
13. 诏闻记录每旬重大变化
14. 手机端正常使用
15. PC 自动切三栏布局

---

# 16. 暂时不要做

- 医身份实际玩法
- 尸祸
- 复杂病原进化树
- 真实流行病模型
- 3D地图
- 大量角色立绘
- 40+府完整地图
- 多王朝随机生成
- 联机
- 成就系统
- 商城
- 付费系统

先把「疫」的一局做顺。