# UI 现状证据与改动边界

取证日期：2026-11-06。通过 Chrome 只读访问测试环境产品详情的固件配置页，产品样例 FD04X，路由 `/iot-product/detail/2117198347609673729?step=firmware`。只打开列表、新建与编辑抽屉，未填入或提交真实数据。

## 已观察事实

| 区域 | 当前事实 | 证据 |
| --- | --- | --- |
| 页面骨架 | 深蓝侧栏208px、顶栏54px、路由标签、产品摘要、七步导航、固件配置标题、固件/虚拟版本页签 | [固件列表截图](https://github.com/HawZZ/root-interactivable-prototype/blob/main/prototypes/firmware-release-note/docs/evidence/live-firmware-list.jpg)、[虚拟版本截图](https://github.com/HawZZ/root-interactivable-prototype/blob/main/prototypes/firmware-release-note/docs/evidence/live-virtual-list.jpg) |
| 样式 | 侧栏#001529、主色#4372ff、14px常规文字、32px主控件、4px圆角；列表操作30px/12px | 可见DOM的computed style读取 |
| 固件列表 | 六态统计、命中策略说明、固件名称/类型/通道/固件版本/硬件版本/功能版本/组件APP条件/应用对象/状态/上传时间/发布日志/操作 | 固件列表截图；发布日志是既有信息，不能作为Release note |
| 固件新建 | 560px抽屉；功能版本、类型、通道、上传包、产品、3×3解析信息、APP版本、应用对象、备注、取消/保存 | [新建截图](https://github.com/HawZZ/root-interactivable-prototype/blob/main/prototypes/firmware-release-note/docs/evidence/live-firmware-create.jpg)及可访问性树 |
| 固件编辑 | 560px抽屉；包信息只读、APP条件、应用对象、备注、取消/保存 | [编辑截图](https://github.com/HawZZ/root-interactivable-prototype/blob/main/prototypes/firmware-release-note/docs/evidence/live-firmware-edit.jpg)；备注仅开发中可维护，应用对象有自己的窗口 |
| 虚拟版本列表 | 版本号、独立APP条件、应用对象、关联MCU、状态、冻结状态、创建时间、操作 | 虚拟版本列表截图 |
| 虚拟版本新建/编辑 | 760px抽屉；说明条、版本/APP条件两列、应用对象、选择汇总、MCU选择及筛选/表格、冻结提示、取消/保存 | [新建截图](https://github.com/HawZZ/root-interactivable-prototype/blob/main/prototypes/firmware-release-note/docs/evidence/live-virtual-create.jpg)、[编辑截图](https://github.com/HawZZ/root-interactivable-prototype/blob/main/prototypes/firmware-release-note/docs/evidence/live-virtual-edit.jpg)；编辑时版本号只读 |

## 本次新增设计

原型复用上述骨架、列表列顺序、控件密度和两种信息抽屉宽度。按用户2026-11-06最新决定，在两类列表的操作列新增Release note入口，打开760px独立管理抽屉：只读对象上下文、语言、Markdown源码/预览、导入及单独保存。原新建、编辑及详情信息抽屉不嵌入Release note编辑器。对象创建成功自动生成英语默认值，随后从列表维护。独立管理抽屉是本次新增设计，非现状事实；样式沿用平台，不替换备注、发布日志、应用对象或关联组件。列表和既有字段使用样例，不连接测试或生产数据。

右侧批注和编号是评审工具，不属于产品UI；其中的场景切换、模拟失败、存量初始化与APP读取验证均为原型工具。APP验证只展示读取对象/语言及渲染结果，不推定真实APP升级页面布局。现状对照开关隐藏新增内容，用于辨别改动范围。

## 证据强度与实施边界

现场列表只观察到开发中对象；其他状态的按钮边界来自可控发布基线和R7/V6共识，不能称作现场验证。本地wiki提供全局视觉参考，旧可控发布原型只参考业务规则，不把其148px侧栏当现状。新增字段位置、预检呈现和列表入口为本次设计，非已上线事实。原型不重建与本需求无关的发布/包上传业务，既有入口只保留外观并提示范围。

原型使用演示上限（单语言10000 UTF-16代码单元、文件1MiB）及保守Markdown策略，不作为生产冻结数值；实际共同元素、URL策略、长度和资源上限由技术实施前冻结并按review-contract.md验收。不存在旧Release note译文迁移。

补充复核：导航菜单图标从当前可见DOM的SVG复用，菜单名称/层级归档于[evidence/live-navigation-assets.json](https://github.com/HawZZ/root-interactivable-prototype/blob/main/prototypes/firmware-release-note/docs/evidence/live-navigation-assets.json)。恢复了侧栏下方的审批管理、音源管理、生产管理与运营管理等现有菜单；菜单区域可滚动。产品缩略图复用现状54×54截图，品牌图按原生208×64画布展示。其他状态的操作名称补齐自可控发布基线，点击既有发布入口只说明原型边界，不伪装成已实现的发布流程。
