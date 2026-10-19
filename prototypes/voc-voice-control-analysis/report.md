# 全球语音控制 VOC 事实报告

更新日期：2026-10-19。飞书主表：全量voc反馈 / 全量明细表，revision **21053**。读取身份：new-enterprise / 张子豪 / user。反馈日期范围：2026-06-01 至 2026-10-19。

## 本次数据

主表共 **2,354 条记录**，确认 **3 条明确语音能力需求**，占全量记录 **0.127%（3/2,354）**。其中第三方设备语音控制 1 条，App 内语音记录 2 条。另有 1 条通话转写偶发提及用 Alexa 调空调，不计入 Momcozy 语音需求；连同该条，共 4 条实际平台使用/需求语境记录（0.17%）。

用户原声非空记录为 **2,340 条**，该子样本中的需求提及率为 **0.128%（3/2,340）**。这是记录提及率，不能表述为用户占比、设备占比或市场需求渗透率。

## 分母与旧版差异

| 项目 | 本次事实 |
| --- | --- |
| 完整读取 | 2,000 + 354 = 2,354 条；最后一页 has_more=false |
| 分页一致性 | 主字段、对话原文、翻译/摘要及结束复查均为 revision 21053 |
| 飞书 record_id | 2,354 个不同值 |
| 用户原声为空 | 14 条；在主口径分母中保留 |
| 用户原声非空 | 2,340 条；非空不等于已验证可用 |
| 原始 ID 为空 | 30 条 |
| 原始 ID 碰撞 | 1 组3条，正文不同；不能按该 ID 直接合并 |
| 正文完全相同（统一空白符后） | 31 组，冗余候选 33 条；未自动删除 |

当前表的字段列表不再包含旧版“原声可用”。本次没有沿用历史 32 条排除项，也没有将相同原始 ID 或短文本自动视为重复。**全量记录口径仅按飞书 record_id 区分，不宣称跨来源唯一 VOC 或唯一用户。** 无法可靠复现的“有效唯一 VOC”分母留空。

与 revision 3716 的 1,458 条记录相比，按 record_id 集合核对：本次出现 947 个此前不存在的 ID、51 个旧 ID 不在当前主表中，净增 896 条。集合变化不能说明移出原因，也不能把所有新出现 ID 都解释为新发生反馈。此前确认的 2 条需求仍在，新增确认 1 条。旧版 **2/1,411** 与本次 **3/2,354** 分母不同，不作需求比例升降判断。

## 用户原文证据

### 1. 口述记录吸奶或小睡

日期 2026-07-14；未知；英语；社区/评论；APP。平台表述：Siri / Siri-like。飞书记录：`rec27V1ZI49kpD`。

> a like hey siri feature that you can verbally log pump sessions or naps with having to manually input it

中文释义：希望提供类似 Hey Siri 的功能，通过说话记录吸奶或小睡，减少手动录入。

证据边界：原文 with having to manually input it 存在笔误；按上下文解释为减少手动录入。未指定 Apple HomeKit。

### 2. 深夜关闭 WN02

日期 2026-08-16；意大利；意大利语；应用市场；WN02 台式APP白噪音。平台表述：Alexa。飞书记录：`recvswecTAGRUt`。

> Sarebbe una grande cosa avere la lampada con i rumori bianchi abbinabile ad Alexa. Nel pieno della notte sarebbe davvero conveniente spegnere la WN02 con il comando vocale

中文释义：希望 WN02 白噪音灯可搭配 Alexa，深夜能通过语音命令关闭。

证据边界：明确提及 WN02、Alexa 和夜间关机；未明确要求音量、灯光调节或 Routine。

### 3. 产后与夜间口述录入记录（新增确认）

日期 2026-09-17；未知；英语；应用市场；APP。平台表述：Siri / Siri-like、Hey Google / Assistant 类。飞书记录：`recvvIrVU3pF2e`。

> moms usually use this in their postpartum where they want less effort to log entries but this lacks siri and hey Google commands which forces moms to enter entries manually by opening the app which is a lot of effort especially during the no sleepy nights.

中文释义：用户表示产后希望省力记录，但缺少 Siri 和 Hey Google 指令，必须打开 App 手动录入，夜间尤其费力。

证据边界：2026-09-17 的 Google Play 评价。Hey Google 是助手唤醒表达；未明确要求 Google Home 设备控制，也未指定记录类型。

### 偶发使用提及

记录 `rec27V1ZI49y1Q`，2026-07-01，美国，BM08 客服工单。原文对话中出现 “Alexa, set the AC to 75 degrees.”。本条实际反馈为共享访问问题，未提出 Momcozy 语音集成需求；这只是一段通话转写，未核验原始录音。

## 分布

| 平台表述（多标签） | 需求记录数 | 占全量记录 |
| --- | --- | --- |
| Alexa | 1 | 0.042% |
| Siri / Siri-like | 2 | 0.085% |
| Hey Google / Assistant 类 | 1 | 0.042% |
| Google Home 明确设备需求 | 0 | 0% |
| Apple Home / HomeKit | 0 | 0% |

平台标签累计 4 次，来自 3 条需求记录。Siri/Siri-like 涉及语音记录；Hey Google 涉及助手指令，不据此标注 Google Home 智能家居接入需求。未确认的需求不能反向推断为用户没有需求。

| 产品/场景 | 需求数 | 占3条需求 |
| --- | --- | --- |
| WN02设备控制 | 1 | 33.333% |
| App内语音记录 | 2 | 66.667% |

| 维度 | 需求分布 |
| --- | --- |
| 国家/地区 | 意大利1；未知2；未按语言或应用商店推断国家 |
| 语言 | 英语2；意大利语1（依据3条原文） |
| 渠道 | 应用市场2；社区/评论1 |
| 明确的任务 | 夜间关机1；App记录2 |
| 明确的购买/流失表态 | 这3条中未见明确购买承诺或退货/流失表态 |

| 反馈月份 | 主表记录数 | 语音需求数 | 月内提及率 |
| --- | --- | --- | --- |
| 2026-06 | 417 | 0 | 0.000% |
| 2026-07 | 759 | 1 | 0.132% |
| 2026-08 | 450 | 1 | 0.222% |
| 2026-09 | 501 | 1 | 0.200% |
| 2026-10 | 227 | 0 | 0.000% |

10月为截至19日的部分月份；月份记录数包含历史回填和表内收录变化，不能直接作为完整月需求趋势。

| 渠道 | 主表记录数 | 语音需求数 |
| --- | --- | --- |
| 客服工单 | 1728 | 0 |
| 应用市场 | 377 | 2 |
| 社区帖子 | 119 | 0 |
| AI工单 | 66 | 0 |
| 社区/评论 | 64 | 1 |

## 检索与排除

对全量2,354条记录的用户原声、标题、翻译、对话原文、对话翻译、摘要和相关提炼字段进行多语言检索。本次平台/控制类候选 **17 条**，逐条复核后确认3条产品需求。词典覆盖英语、法语、德语、意大利语、西语、波兰语、中文、葡语、荷兰语、日语、韩语、阿拉伯语、俄语、土耳其语，补充 Hey Google / OK Google 表达。

严格口径：明确语音平台、语音命令或助手能力需求。扩展口径另含未点名平台但明确通过说话完成控制、查询或记录的需求。本次两种口径均为3条，没有额外确认扩展需求。

误报包括姓名/邮箱中的 Alexa 字符串、西语普通表达 echo、邮箱拼写中的 Echo、VOX声音触发、口头提供序列号、客服语音渠道、语音提示和双向通话。候选及排除原因见 candidate-review.csv。未命中记录未完成逐条人工语义复核，因此本报告不声称零漏检，也不沿用旧版276条候选数。

## 历史外部资料与竞品快照

以下为 **2026-08-19整理的资料，未在本次刷新**。仅保留原统计对象、调查年份和证据，不形成平台选择、投入评分或产品顺序结论。

美国2022年NPR/Edison调查：18岁以上成年人语音助手使用率62%、智能音箱拥有率35%；语音命令用户每日使用率57%。智能音箱拥有者态度样本n=1,190：认为交互短且容易90%、生活便利86%、更易发现内容80%；担心黑客访问信息52%、一直监听47%、政府监听43%。不同观点可同时成立，不能相加为100%。来源：[NPR/Edison原报告](https://www.nationalpublicmedia.com/uploads/2022/06/The-Smart-Audio-Report-Spring-2022.pdf)。

美国累计智能音箱设备安装份额（2021-06，CIRP经GeekWire转述）：Echo69%、Google Home25%、HomePod5%、Portal1%。这是历史设备口径，不是2026年用户份额，也不是HomeKit生态使用率。来源：[历史报道](https://www.geekwire.com/2021/amazon-maintains-big-lead-google-apple-u-s-smart-speaker-market-new-study-says/)。

竞品历史矩阵为16品牌、17代表SKU、美国/加拿大共68行；美国34个SKU×平台行中正式正向3、明确负向1、无官方证据30。美国和加拿大保持分开。

| 竞品/产品 | 平台 | 截至历史核验日的证据状态 | 已记录能力 |
| --- | --- | --- | --- |
| Nanit Pro Camera | Alexa | 支持 | 睡眠查询、夜灯、视频/音频流 |
| Hatch Rest+ 2nd gen | Alexa | 支持 | 开关、音量、亮度、时钟/闹钟 |
| Nanit Sound + Light | Google Home | 条件支持 | 开关、亮度、音量、状态 |
| Hatch Rest+ 2nd gen | Google Home | 官方明确不支持 | 无 |

上述状态只描述历史资料。未找到官方证据不等于不支持；价格、评分和评论量为历史渠道快照，不是销量或市占率。原始链接和核验日期见 competitor-sources.csv 与 external-sources.csv。

## 数据文件与局限

最新统计：statistics.json、statistics-detail.csv。需求证据：voc-evidence.csv。候选复核：candidate-review.csv。脱敏记录核对表：voc-record-audit.csv。词典：multilingual-keywords.csv。HTML与本报告使用同一份统计结果。

主表覆盖已收录反馈，不代表全球全部客户；3条需求不能用于估计国家、平台或产品用户总体偏好。国家未知保持未知。用户原声字段中部分内容为客服总结，证据优先核验原始评价或完整对话；未经核验的标签和翻译不单独增加需求分子。全量记录口径可能包含重复收录和非实质记录，因此同时公开原声空值、原始ID碰撞与重复文本候选。搜索未命中不能证明不存在需求。
