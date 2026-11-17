# Figma 组件库与原型索引

源文件是「新设计」。开始工作时核对当前节点名称和权限，尤其是用户提供副本、分支或另一个目标文件时。

| 入口 | 链接 |
| --- | --- |
| 统一组件库与目录 | [06 / Unified Component Library](https://www.figma.com/design/uGwk0T3tfUG3pyal8DbFHx?node-id=229-3) |
| 基础控件 | [03 / Controls](https://www.figma.com/design/uGwk0T3tfUG3pyal8DbFHx?node-id=6-108) |
| 硬件、仪表及材质 | [05 / Hardware & Materials](https://www.figma.com/design/uGwk0T3tfUG3pyal8DbFHx?node-id=27-36) |
| 推子变体与两套配色 | [13 / 垂直推子与八路编组](https://www.figma.com/design/uGwk0T3tfUG3pyal8DbFHx?node-id=388-15390) |
| 实际操作 | [时间频段控制台原型](https://www.figma.com/proto/uGwk0T3tfUG3pyal8DbFHx?node-id=386-14104&starting-point-node-id=386-14104&scaling=scale-down&hide-ui=1) |
| 画板 | [橙色](https://www.figma.com/design/uGwk0T3tfUG3pyal8DbFHx?node-id=386-14104) · [青绿](https://www.figma.com/design/uGwk0T3tfUG3pyal8DbFHx?node-id=386-14939) |

| 常用主组件 | 源文件节点 ID |
| --- | --- |
| RT / Button、RT / IconButton | `9:26`、`9:260` |
| RT / PianoKey、ABS / Key、RT / MechanicalToggle | `32:615`、`139:20000`、`32:523` |
| RT / RotaryKnob、RT / Slider | `32:8`、`9:810` |
| RT / VerticalFader、RT / FaderBank | `385:10197`、`385:10326` |
| RT / AnalogMeter、RT / CRTCabinet、ABS / Recessed CRT | `32:691`、`32:1238`、`139:19910` |

集合 `TVA / ABS Material`（`VariableCollectionId:139:19880`）拥有 Orange（`139:0`）与 Teal（`150:0`）两个模式。主题放在画板或区域上。硬件指示线从 `color/hardware/lamp` 取色，滑槽用 `color/hardware/slot`。按键、安装框、旋钮和推子复用 `Hardware ABS / …` 效果样式。

`RT / VerticalFader` 有五档 × `Default`、`Focus`、`Disabled` 三种状态。FaderBank 由八路链接实例组成，分别响应点击、拖动与键盘操作。扩展变体时保持视觉层名称一致，使 Smart Animate 能对应滑块、指针和灯。改动状态时核对 Change To 仍指向同一组件集内的合法目标，禁用态没有动作。主题切换和重置入口可从控制台原型试用。
