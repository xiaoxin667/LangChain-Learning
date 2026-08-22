## LangChain框架学习笔记
```angular2html
本项目使用Python版本：3.12.x
```
## model
指代基础的语言模型

## prompt
一种用于给模型传递信息的一种方式

## 解析器(parsers)
接收模型的输出，并将输出结果解析成更结构化的格式，以便对其进行后续操作

## 环境问题排查记录

### 问题现象

Notebook 中导入 langchain 时报错 `ModuleNotFoundError: No module named 'langchain_core.pydantic_v1'`，且报错的堆栈路径指向的是 `D:\Python\Python 3.12\...` 而非项目虚拟环境；此外 IDE 中 `import openai` 显示"未解析的引用"红线，但单元格却能正常运行。

### 问题原因

虚拟环境 `.venv` 在创建时勾选了 **继承全局 site-packages**（`.venv/pyvenv.cfg` 中 `include-system-site-packages = true`），导致：

1. venv 会同时读取 `D:\Python\Python 3.12\Lib\site-packages` 里的包。实测 venv 内 `langchain_core` 从 venv 本地加载，而 `pydantic` 却从 D 盘全局环境加载，两边版本不一致的包混用；
2. 全局环境中的 `langchain-core` 是 1.x（已删除 `pydantic_v1` 兼容模块），与 venv 内 0.2.x 的 `langchain` 不兼容，因此导入 `langchain.output_parsers` 时报错；
3. IDE 检查用的解释器和 Jupyter 内核实际加载包的环境不一致，造成"标红但能跑"的假象。

### 解决方法

1. **隔离全局环境**：修改 `.venv/pyvenv.cfg`，将 `include-system-site-packages` 改为 `false`；
2. **配套重装依赖**（0.2.x 系列版本必须互相匹配）：

   ```bash
   pip install "langchain==0.2.17" "langchain-core<0.3" "langchain-community==0.2.19" "langchain-openai==0.1.25" pydantic
   ```

3. **验证包的加载位置**：

   ```python
   import pydantic, langchain_core
   print(pydantic.__file__)       # 应指向 .venv\Lib\site-packages
   print(langchain_core.__file__) # 应指向 .venv\Lib\site-packages
   ```

4. **重启 Jupyter 内核**：在 PyCharm 中 Stop Jupyter Server → 重启内核 → 从第一个单元格重跑，并确认 `sys.executable` 指向 `.venv\Scripts\python.exe`。

### 经验教训

- 新建虚拟环境时不要勾选"继承全局包（system site-packages）"，避免环境之间"串味"；
- langchain 0.2.x 必须搭配 0.2.x 的 langchain-core，单独安装 `langchain<0.3` 时 pip 可能自动装上不兼容的新版 core；
- 排查环境问题时应优先用 `python -c "import xxx; print(xxx.__file__)"` 确认包的真实加载路径，而不是只看 `pip list`。