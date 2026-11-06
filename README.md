# Figures · 科研绘图参考库

[在线预览](https://s-wccc.github.io/Figures/) · [图片索引](data/figures.json) · [共同选集](data/collections.json) · [维护说明](CONTRIBUTING.md)

一起整理、挑选和维护科研流程图、架构图与机制图。初始收录 **387 张图片、50 张精选**，来自 2008-2026 年间 16 个年份的 ICML 论文。

网页支持年份、会议或来源、图形类型、关键词筛选，以及原图放大、下载、个人收藏、最多 4 张并排比较、分享选择和导出选图 JSON。图片按原始文件保存，来源、作者和借鉴点在索引中对应。仓库不保存 PDF 全文。

## 一起使用

- **挑选图片**：点击“比较”选图，再使用“分享选择”发送同一组图片的链接；“导出选择”会保存图片编号、图片地址和备注，方便交给 AI 或同学继续工作。
- **个人收藏**：保存在当前浏览器中。
- **共同选集**：编辑 `data/collections.json`。团队成员看到的是同一份选集，可用 `#collection=选集编号` 直接打开。
- **维护内容**：提交新图片、元数据或备注到 `main`。GitHub Actions 自动检查并发布 GitHub Pages。已打开的网页每 60 秒检查一次数据更新，也会在切回网页时检查。
- **协作提交**：同学通过仓库协作权限提交分支或 Pull Request；合并到 `main` 后更新线上网页。

## 给 AI 直接读取

完整索引位于 [`data/figures.json`](data/figures.json)。每条记录有稳定 `id`、`image` 相对路径、论文信息、类型、精选状态和设计备注。`data/collections.json` 保存共同挑选结果。

公开预览站点提供相同数据：

- 索引：<https://s-wccc.github.io/Figures/data/figures.json>
- 图片：`https://s-wccc.github.io/Figures/` + 记录中的 `image`
- 单图预览：`https://s-wccc.github.io/Figures/#figure=图片编号`
- 当前共同选集：<https://s-wccc.github.io/Figures/#collection=figure1-reference>

可以直接告诉 AI：“读取这个仓库的图片索引，按抽象输入、候选选择或局部机制展开筛选，并参考图片编号……”。

## 添加一张图

需要 Python 3.10+，脚本只使用标准库。

```bash
git pull --rebase
python scripts/add_figure.py --file /path/to/figure.png --id icml2027-example-f1 --title "Example Paper" --authors "Author A, Author B" --year 2027 --venue ICML --pattern pipeline --source https://example.org/paper --figure 1 --note "横向主流程，关键模块在下方展开。"
python scripts/build_site.py
git add figures data
git commit -m "Add a new method figure"
git push
```

原创或生成的图片可使用 `--venue Original`，`--source` 可留空。可用 `--featured` 加入精选；`--tag` 可重复指定。更多示例见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 本地预览

```bash
python scripts/build_site.py
python -m http.server 8000 --directory _site
```

打开 <http://localhost:8000>。`_site/` 是生成目录，已加入 `.gitignore`。

## 目录

|路径|内容|
|---|---|
|`figures/`|图片原文件|
|`data/figures.json`|图片索引：维护的唯一入口|
|`data/collections.json`|团队共同选集|
|`data/config.json`|参考路线、历史目录、整理日期|
|`index.html`, `assets/`|可视化网页|
|`scripts/`|添加图片、数据检查与静态构建|
|`.github/workflows/pages.yml`|检查与自动发布|
|`SOURCES.md`, `third_party/`|来源记录和上游归属|

## GitHub Pages

仓库 Settings → Pages → Source 使用 **GitHub Actions**。自动流程会检查图片与索引的对应关系、重复编号、选集引用和文件类型，再发布 `_site/`。网页部署与仓库内容使用同一份提交。

原图归各论文作者或权利人，逐图来源保存在索引中。近年裁图来自 [Top-Conf Figure Gallery](https://github.com/qwdwqfwq/topconf-paper-figure-gallery)，其归属说明保留在 `third_party/`。
