# 维护图片与共同选集

## 图片记录

每张图对应 `figures/` 下的一个 PNG、JPG、WEBP 或 GIF 文件，以及 `data/figures.json` 中的一条记录。

```json
{
  "id": "icml2027-example-f1",
  "venue": "ICML",
  "year": 2027,
  "title": "Example Paper",
  "authors": "Author A, Author B",
  "figure": "1",
  "pattern": "pipeline",
  "image": "figures/icml2027-example-f1.png",
  "paper": "https://example.org/paper",
  "featured": false,
  "rank": 999,
  "note": "横向主流程，关键模块在下方展开。",
  "tags": ["抽象输入", "候选选择"],
  "source_collection": "Contributor submission"
}
```

`id` 使用小写字母、数字、短横线或下划线，并在后续修改中保持稳定。`pattern` 可选：

|值|网页显示|
|---|---|
|`pipeline`|处理流程|
|`architecture`|模型架构|
|`framework`|系统框架|
|`conceptual`|概念与机制|
|`comparison`|方法对照|

`featured` 控制是否进入精选；`rank` 越小越靠前。`note` 用一句话说明可借鉴的构图、信息流、配色或机制表达。`tags` 进入关键词搜索。原图号已知时填写数字字符串，否则使用“主图”。

原创和 AI 生成图片可填写 `venue: "Original"`、实际创作者或生成方式、生成年份，`paper` 留空。后续可以加入其他会议，网页会自动添加来源筛选项。

## 通过 GitHub 网页修改

1. 在 `figures/` 中上传图片。
2. 编辑 `data/figures.json`，增加对应记录；修改标签、备注和精选时直接编辑已有记录。
3. 如需纳入共同选集，在 `data/collections.json` 添加图片编号。
4. 更新 `data/config.json` 的 `updated` 日期。
5. 提交分支并创建 Pull Request。检查通过后合并到 `main`，自动更新网页。

上传图片与记录可以在同一分支分次完成，最终合并前检查会验证完整性。

## 通过本地脚本添加

先拉取最新提交，再运行 `scripts/add_figure.py`。脚本复制图片、追加记录、更新整理日期，并验证完整索引。已有编号会提示修改现有记录，避免覆盖。

```bash
python scripts/add_figure.py --file figure.png --id original-flow-v1 --title "Structured output overview" --authors "Team" --year 2026 --venue Original --pattern framework --note "统一输入，联合选择，结构化输出。" --tag "候选选择" --featured
python scripts/build_site.py
```

## 团队共同选集

```json
{
  "id": "abstract-inputs",
  "title": "抽象输入与统一接口",
  "description": "用于讨论下一版图 1 的输入表达。",
  "ids": [
    "classic-2021-jaegle21a-f1",
    "classic-2019-gao19a-f1"
  ]
}
```

将对象加入 `data/collections.json` 数组即可。网页会自动出现“共同选集：抽象输入与统一接口”。选集链接为 `https://s-wccc.github.io/Figures/#collection=abstract-inputs`。

临时讨论可以选中最多 4 张图，点击“分享选择”；正式整理结果写入共同选集即可长期共享。

## 替换与移除

- 替换图片时保留原有 `id`，同步 `image` 路径，修改备注与日期。
- 移除记录时，同步移除共同选集和参考路线里的编号，再移除对应图片。
- 更新后运行 `python scripts/build_site.py --check`。检查会指出重复编号、缺失图片、无效 URL 和不存在的引用。

仓库只维护图片、网页和来源元数据。PDF 保留外部来源链接即可。
