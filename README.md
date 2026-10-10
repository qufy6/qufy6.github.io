# Feiyu Qu · Academic Homepage

线上地址：https://qufy6.github.io/

手写的纯静态 HTML / CSS / JS：没有框架、没有构建步骤、不加载外部 CDN 或字体。推送到 `main` 分支后，GitHub Pages 会自动发布，一般 1–2 分钟生效。

## 设计

- **毛玻璃**：所有内容卡片（`.glass`），边缘有一圈会跟随鼠标亮起的高光。
- **液态玻璃**：顶部导航、按钮、可拖动的透镜（`.liquid`）。在 Chrome / Edge 等 Chromium 浏览器里，`main.js` 会给它们加上真实的边缘折射和色散（SVG 位移滤镜作用在 `backdrop-filter` 上）；Safari / Firefox 会自动退回普通毛玻璃。
- **背景**：缓慢流动的极光色块 + 一张 “agent 网络”：节点之间的光点只根据本地信息逐跳路由到目标，向 BiRouter 致敬。
- **极客细节**：终端打字开场、`⌘K` / `/` 命令面板、`t` 切换深浅色、`g a` / `g p` / `g c` 跳转、BibTeX 语法高亮和一键复制、状态栏页脚、控制台彩蛋。
- 尊重系统设置：减少动态效果（`prefers-reduced-motion`）时关闭动画，降低透明度（`prefers-reduced-transparency`）时改用不透明背景。

## 文件结构

```
index.html             主页（所有内容都在这里）
404.html               404 页面
assets/css/style.css   样式；颜色、圆角、字体都在文件开头的变量里（浅色一组，深色两组且内容相同）
assets/js/main.js      交互：主题、终端动画、命令面板、背景网络、液态玻璃折射
assets/img/favicon.svg 网站图标
.nojekyll              告诉 GitHub Pages 不要用 Jekyll 处理
```

## 常见修改

**改简介**：编辑 `index.html` 里 `<section id="about">` 的两段文字，以及旁边 `now.json` 卡片里的内容。

**加论文**：在 `<ol class="pubs">` 里复制一整个 `<li class="pub …">…</li>` 块，粘到最上面（按时间倒序），然后修改：
- `data-cmd`：命令面板里 “Copy BibTeX — …” 显示的短名字
- 标签：会议用 `class="venue-tag"`（绿色），期刊用 `class="venue-tag journal"`（紫色）；共一作可以加 `<span class="flag">co-first author</span>`
- 标题、作者（自己的名字用 `<span class="me">Feiyu Qu</span>`，共同一作在名字后加 `<sup>*</sup>`）、出处
- 按钮：`paper` / `arxiv` / `code` 都是普通 `<a class="btn">`，没有的删掉即可
- BibTeX：按钮的 `aria-controls` 和下面 `<div class="bibtex" id="…">` 的 id 要一致且唯一；BibTeX 里的 `&` 写成 `&amp;`

论文数量（终端里的 `wc -l` 和 “N papers”）会自动统计，不用改。

**加头像**：把照片（建议正方形，至少 400×400）存为 `assets/img/profile.jpg`，告诉我或者自己在 hero 区加一个 `<img>`。

**加 CV**：PDF 放到 `assets/cv.pdf`，在 hero 的 `<ul class="chips">` 里照着其他按钮加一项 `<a class="chip liquid" href="assets/cv.pdf">cv</a>`。

**加 News**：`index.html` 里有一段注释掉的 News 模板，删掉 `<!--` 和 `-->` 后照格式添加。

**改邮箱**：邮箱以倒序形式存在 `data-email` 属性里（`@` 写成 `#`），所以网页源码里不会出现完整地址。新地址可以这样生成：
```bash
python3 -c "print('new.name@example.edu'.replace('@', '#')[::-1])"
```

**改配色**：`assets/css/style.css` 开头的 `--accent`、`--accent-2`、`--a1`…`--a4`（极光颜色）。

记得顺手更新状态栏里的 `updated 2026-10`。

## 本地预览与发布

```bash
python3 -m http.server 8000      # 然后打开 http://localhost:8000
git add -A && git commit -m "Update homepage" && git push
```
