from langchain_classic.memory import ConversationTokenBufferMemory
from langchain_classic.chains import ConversationChain
from langchain_openai import ChatOpenAI

from app.environ import get_api_key


def create_llm():
    llm = ChatOpenAI(
        api_key=get_api_key(),
        model="deepseek-v4-flash",
        base_url="https://api.deepseek.com/",
        tiktoken_model_name="gpt-3.5-turbo", # 添加一个计数规范的模型名称
        temperature=0.0
    )
    # 按照Token数量来限制历史记忆，而综测问答在一定程度上只会看最后一轮用户的问答，只有计算总分的时候才会与记忆相关
    return llm

def get_conversation(llm):
    # 该模型的上下文长度为32K
    memory = ConversationTokenBufferMemory(llm=llm,max_token_limit=32000)
    conversation = ConversationChain(
        llm=llm,
        memory=memory,
        verbose=False
    )
    return conversation

if __name__ == '__main__':
    llm = create_llm()
    conversation = get_conversation(llm)
    result1 = conversation.predict(input="Hi my name is Hilary")
    print(result1)

    result2 = conversation.predict(input="What is my name")
    print(result2)