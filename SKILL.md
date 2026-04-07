---
name: tmdb-scrape
description: 115网盘电影信息补全工作流。使用TMDB API批量查询电影信息并补全115网盘中的电影元数据。适用于用户需要批量丰富电影数据库信息、补充TMDB评分、海报、国家、类型等元数据。
---

# TMDB电影信息补全工作流

## 概述
本技能用于将115网盘中不完整的电影记录通过TMDB API进行信息补全。

## 完整流程（7步）

### 步骤1：生成行号文件
```bash
node gen_line_num.js <批号> <每批条数>
```
- 输入：/tmp/incomplete_lines/incomplete.txt
- 输出：/tmp/incomplete_lines/batch{N}_num.txt

### 步骤2：AI提取片名
从路径中智能提取电影名称

### 步骤3：TMDB搜索（仅搜索，返回候选列表）
```bash
node tmdb_search.js <输入文件> <输出文件>
```
- 输入格式：行号|电影名
- 输出格式：行号|电影名|[{搜索结果候选}]
- 仅调用search/multi接口，不获取详情

### 步骤4：AI验证选择
AI从候选列表中选择最佳匹配（年份±1容差）
- 输出：temp_selected.txt（格式：行号|电影名|[{选中的TMDB ID}]）

### 步骤5：TMDB详情查询（获取完整信息）
```bash
node tmdb_details.js <输入文件> <输出文件>
```
- 输入：AI验证后的文件
- 输出：包含完整详情（国家、类型、评分、海报等）

### 步骤6：映射路径
```bash
node map_path.js <成功文件> <错误文件>
```
- 输出：success.txt / error.txt
- 格式：路径#中文名#TMDB_ID#评分#海报#年份#国家#类型

### 步骤7：循环处理下一批

## 脚本说明

### gen_line_num.js
- 功能：从incomplete.txt生成指定批次的行号文件

### tmdb_search.js（新增/步骤3）
- 功能：仅执行搜索，返回候选列表
- API：search/multi（Movie + TV）
- 输出：id, title, year, media_type, vote_average, overview

### tmdb_details.js（新增/步骤5）
- 功能：根据AI选中的TMDB ID获取完整详情
- API：movie/{id}?language=zh-CN 或 tv/{id}?language=zh-CN
- 输出：title, original_title, year, vote_average, poster_path, countries, genres, imdb_id

### map_path.js
- 功能：将TMDB结果映射回原始路径

## 使用示例

```bash
# 步骤1
node gen_line_num.js 1 100

# 步骤2 - AI提取片名

# 步骤3 - TMDB搜索（仅搜索）
node tmdb_search.js batch1_names.txt batch1_search.txt

# 步骤4 - AI验证选择最佳结果

# 步骤5 - TMDB详情查询
node tmdb_details.js batch1_selected.txt batch1_details.txt

# 步骤6 - 映射路径
node map_path.js temp_success_ai.txt temp_error_ai.txt
```

## 优化说明
- 步骤3仅做搜索，大幅减少API调用（从N×6次减少到N×1次）
- 步骤5仅对AI选中的影片获取详情，进一步减少无效API调用
- 总API调用数：搜索N次 + 详情M次（M=实际成功匹配数）