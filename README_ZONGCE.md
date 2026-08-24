# 综测规则智能检索系统 - 使用说明

## 📁 文件结构

```
F:\LangChain\
├── app/
│   ├── answer_question.py      # 核心检索问答模块（已更新）
│   ├── load_llm.py            # LLM 加载模块
│   ├── io.py                  # 文档加载模块
│   ├── environ.py             # 环境变量配置
│   ├── query_prompt_template.md  # 提示词模板参考
│   └── file/
│       └── data.pdf           # 综测规则文档
├── query_zongce.py            # 独立查询脚本
└── README_ZONGCE.md           # 本说明文档
```

## 🚀 快速开始

### 方法一：使用独立脚本（推荐）

```bash
cd F:\LangChain
python query_zongce.py
```

然后输入问题即可查询综测规则。

### 方法二：在 Python 代码中调用

```python
from app.answer_question import query_zongce

# 查询综测规则
result = query_zongce("综合素质测评的评分标准是什么？")
print(result)
```

### 方法三：在 Jupyter Notebook 中使用

```python
from app.answer_question import query_zongce
from IPython.display import Markdown, display

result = query_zongce("综合素质测评的评分标准是什么？")
display(Markdown(result))
```

## 🔍 查询示例

以下是一些可以提问的示例：

1. **基础查询**
   - "综合素质测评包含哪些部分？"
   - "德育分的计算方法是什么？"
   - "智育成绩如何评定？"

2. **具体条款查询**
   - "获得奖学金需要满足什么条件？"
   - "旷课会扣多少分？"
   - "参加竞赛获奖如何加分？"

3. **计算规则查询**
   - "综测总分如何计算？"
   - "各部分权重是多少？"
   - "加分项有哪些限制？"

## ⚙️ 配置说明

### 1. LLM 配置

默认使用 DeepSeek API。如需修改，请编辑 `app/load_llm.py`：

```python
llm = ChatOpenAI(
    api_key="your-api-key",
    model="your-model",
    base_url="your-base-url",
    temperature=0.0
)
```

### 2. 嵌入模型配置

默认使用本地 Ollama 嵌入模型。确保 Ollama 服务已启动，并已下载嵌入模型：

```bash
ollama pull ryanshillington/Qwen3-Embedding-8B:latest
```

### 3. 文档路径配置

如需更改综测规则文档路径，请修改 `app/io.py`：

```python
file = r"your\pdf\file\path.pdf"
```

## 📝 输出格式说明

系统会以 Markdown 格式输出查询结果，包含：

- 🔍 **查询结果**：查询问题回顾
- 📜 **相关条款**：按章节组织的条款内容
- 📋 **要点总结**：关键信息归纳
- ⚠️ **注意事项**：特别说明或易混淆点
- 🔗 **相关条款**：可能相关的其他条款

## ❓ 常见问题

### Q1: 查询无结果怎么办？
- 检查 PDF 文档是否包含相关内容
- 尝试使用不同的关键词提问
- 确认文档路径和密码配置正确

### Q2: 响应速度很慢？
- 检查 Ollama 服务是否正常运行
- 确认网络连接正常（使用 DeepSeek API 时）
- 考虑使用更快的模型或减少文档大小

### Q3: 输出格式不正确？
- 检查 LLM 是否支持 Markdown 输出
- 尝试调整 temperature 参数为 0.0
- 确认提示词模板正确加载

## 🔧 故障排除

1. **ModuleNotFoundError**
   ```bash
   pip install -r requirements.txt
   ```

2. **Ollama 连接失败**
   ```bash
   ollama serve  # 启动 Ollama 服务
   ```

3. **PDF 解密失败**
   - 检查 `PDF_DATA_KEY` 环境变量是否设置
   - 确认 PDF 密码正确

## 📞 技术支持

如遇问题，请检查：
1. Python 版本 >= 3.10
2. 所有依赖包已安装
3. Ollama 服务正常运行
4. API 密钥配置正确

---

**更新日期**：2026-08-24  
**版本**：1.0.0
