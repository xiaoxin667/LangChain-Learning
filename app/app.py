# 综测问答助手网页界面（Gradio）
# 用法（项目根目录下执行）：python -m app.app
# 启动后浏览器打开 http://127.0.0.1:7860
# 注意：首次提问会先为整份 PDF 建向量索引（调用 DashScope embedding），耗时较长属正常现象
import gradio as gr

from app.answer_question import query_zongce_with_sources


def respond(question):
    question = (question or "").strip()
    if not question:
        return "请输入问题", ""
    answer, docs = query_zongce_with_sources(question)
    sources = "\n".join(
        f"- 第 {doc.metadata.get('page', '?')} 页："
        f"{doc.page_content.replace(chr(10), ' ')[:60]}…"
        for doc in docs
    )
    return answer, sources


with gr.Blocks(title="综测问答助手") as demo:
    gr.Markdown(
        "# 📚 综测问答助手\n"
        "基于综测规则文档的 RAG 问答：DashScope Qwen Embedding 负责检索，"
        "DeepSeek 负责生成，回答可溯源到文档片段。\n\n"
        "首次提问需要为整份文档建立向量索引，请耐心等待。"
    )
    question = gr.Textbox(
        label="你的问题",
        placeholder="例如：参加竞赛获奖如何加分？",
        lines=2,
    )
    submit = gr.Button("查询", variant="primary")
    answer = gr.Markdown()
    gr.Markdown("### 📎 参考的文档片段（溯源）")
    sources = gr.Markdown()

    submit.click(respond, inputs=question, outputs=[answer, sources])
    question.submit(respond, inputs=question, outputs=[answer, sources])


if __name__ == "__main__":
    demo.launch()
