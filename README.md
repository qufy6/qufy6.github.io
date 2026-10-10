# Feiyu (Felix) Qu · Academic Homepage

线上地址：https://qufy6.github.io/

主页是手写的 HTML / CSS / JS，没有框架，也不加载外部字体；博客用 GitHub Pages 自带的 Jekyll 渲染。推送到 `main` 分支后会自动发布，一般 1–2 分钟生效。

## 设计

- **毛玻璃**：所有内容卡片（`.glass`），边缘有一圈会跟随鼠标亮起的高光。
- **液态玻璃**：顶部导航、按钮、可拖动的透镜（`.liquid`）。在 Chrome / Edge 等 Chromium 浏览器里有真实的边缘折射和色散；Safari / Firefox 自动退回普通毛玻璃。
- **背景**：流动的极光色块 + agent 网络（光点逐跳路由，呼应 BiRouter）。
- **地球仪**：手写的点阵玻璃地球（正交投影），自动旋转，可拖动；点城市或右边的城市按钮会转过去并显示名字。
- **极客细节**：终端打字开场、`⌘K` / `/` 命令面板（可以跳转、复制 BibTeX、“Fly to 某城市”）、`t` 切换深浅色、`g` + `a`/`p`/`b`/`l`/`c` 跳转、状态栏页脚（含 Vercount 访客统计）。

## 文件结构

```
index.html                 主页
404.html                   404 页面
assets/css/style.css       样式（颜色、圆角、字体变量在文件开头）
assets/js/main.js          所有交互
assets/data/places.json    地球仪上的地点
assets/data/land-dots.json 地球陆地点阵（由 Natural Earth 数据生成，一般不用动）
assets/img/papers/         论文 overview 图（-thumb 是卡片里的小图，另一张是点开后的大图）
assets/img/logos/          校徽
assets/media/              兴趣区的照片 / 视频（自己建子文件夹）
_posts/                    博客文章（Markdown）
_layouts/                  博客页面模板
blog/                      博客首页、给主页用的 posts.json
_config.yml                Jekyll 配置
```

## 写博客

在 `_posts/` 里新建 `年-月-日-英文短名.md`，例如 `_posts/2026-11-02-diffusion-lm-notes.md`：

```markdown
---
title: "Notes on diffusion language models"
tags: [dlm, reading]
math: true          # 需要公式时才加
---

正文用 Markdown 写，代码块会自动高亮。
```

公式（KaTeX）统一用 `$$…$$`：写在句子里就是行内公式；单独成段（上下空一行）就是独立公式，可以加 `\tag{1}` 编号。不要用单个 `$`。
图片放在 `assets/blog/文章名/`，多张图并排可以参考 LLaDA 那篇里的 `<figure class="fig-row">`。

推送后会出现在 `/blog/`，主页的 Blog 区会自动显示最新 3 篇，RSS 在 `/blog/feed.xml`。
注意：正文里如果要原样写 `{{` 或 `{%`，需要用 `{% raw %}…{% endraw %}` 包起来（Jekyll 的模板语法）。

## 常见修改

**加去过的地方**：编辑 `assets/data/places.json`，照格式加一行（地名只用英文）：
```json
{ "name": "Paris", "lat": 48.86, "lon": 2.35 },
```
- `"type": "base"`：求学/工作过的地方（有光圈和名字标签）；`"label": "left"` 让标签显示在左边
- `"list": false`：只在地球仪上标点，不出现在右边的列表里（该组末尾会自动显示 “etc.”）
- 列表按文件里的先后顺序显示；`journey` 是地球上画弧线连起来的路线

**兴趣区放照片 / 视频**：把文件放到 `assets/media/soccer/`（或 `music/`、`calligraphy/`），然后在 `index.html` 对应的 `<div class="media" …>` 里加：
```html
<img src="assets/media/soccer/match.jpg" alt="一句说明">
<video src="assets/media/music/clip.mp4" muted loop playsinline autoplay></video>
```
第一张会显示成大图，其余两列小图；点开是灯箱，可以左右切换。没有内容时显示留白框。图片建议先压到 2000px 以内，视频尽量小于 20 MB（GitHub 单个文件上限 100 MB）。

**改学历 / 经历**：在 About 右侧的 `#education`、`#experience` 两个卡片里，每条是一个 `<li class="cv-item">`（当前在做的加 `now`）。左侧校徽放 `assets/img/logos/` 里，用 `<span class="crest"><img …></span>`。导师统一写 “supervised by Prof. …”。

**找 PhD 的提示**：标题区的 “Seeking Fall 2027 PhD positions” 徽章（`class="seeking"`）、About 里的 `seeking-line` 和 Contact 里的 `seeking-note`，三处一起改或删。

**加论文**：在 `<ol class="pubs">` 里复制一整个 `<li class="pub …">…</li>`，改：
- 左侧图：`data-full`（大图）、`<img src>`（小图）、`data-caption`
- 标签：会议 `venue-tag`、期刊 `venue-tag journal`；共一作加 `<span class="flag">co-first author</span>`，名字后加 `<sup>*</sup>`
- 自己的名字用 `<span class="me">Feiyu Qu</span>`
- BibTeX：按钮的 `aria-controls` 和下面 `<div class="bibtex" id="…">` 的 id 要一致；`&` 写成 `&amp;`
论文数量会自动统计。

**加头像 / CV**：照片放 `assets/img/profile.jpg`，CV 放 `assets/cv.pdf`，告诉我或照着 hero 区的按钮加一个 `<a class="chip liquid" href="assets/cv.pdf">cv</a>`。

**改邮箱**：邮箱以倒序形式存在 `data-email` 里（`@` 写成 `#`），源码里不会出现完整地址：
```bash
python3 -c "print('new.name@example.edu'.replace('@', '#')[::-1])"
```

**访客统计**：用的是 [Vercount](https://vercount.one)（免注册），数字显示在页脚状态栏，博客文章里还有单篇阅读数。

记得顺手更新状态栏里的 `updated 2026-10`。

**改了 CSS / JS 之后**：把 `index.html` 和 `404.html` 里 `style.css?v=5`、`main.js?v=5` 的数字加 1。GitHub Pages 会缓存 10 分钟，改版本号能让访客立刻拿到新样式（博客页面会自动处理）。

## 本地预览

```bash
python3 -m http.server 8000      # 主页预览：http://localhost:8000（博客需要 Jekyll，推送后在线上看）
git add -A && git commit -m "Update homepage" && git push
```
