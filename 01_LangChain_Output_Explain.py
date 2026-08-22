import os
import json
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_classic.output_parsers import ResponseSchema, StructuredOutputParser
# 创建chat对象
# 传递template,处理template的方法是一样的
def chat_init():
     return ChatOpenAI(
        # base_url
        base_url="https://api.deepseek.com",
        model="deepseek-v4-flash",
        api_key=os.environ.get("DEEPSEEK_API_KEY"),
        temperature=0.0
    )

def get_messages(chat: ChatOpenAI,template_string,text,format_instructions):
    template = ChatPromptTemplate.from_template(template_string) # 构建模板
    messages = template.format_messages(
        text=text,
        format_instructions=format_instructions
    )
    return messages

def get_response(chat,messages):
    return chat.invoke(messages)

def get_output_parsers():
    gift_schema = ResponseSchema(name="gift",
                                 description="Was the item purchased as a gift for someone else? Answer True if yes, False if not or unknown.")
    delivery_days_schema = ResponseSchema(name="delivery_days",
                                          description="How many days did it take for the product to arrive?")
    price_value_schema = ResponseSchema(name="price_value",
                                        description="Extract any sentences about the value or price")
    response_schema = [gift_schema, delivery_days_schema, price_value_schema]
    output_parsers = StructuredOutputParser.from_response_schemas(response_schema)
    return output_parsers

if __name__ == '__main__':
    template_string = """\
                        For the following text, extract the following information:
                        gift: Was the item purchased as a gift for someone else? Answer \
                        with 'yes' or 'no'.
                        delivery_days: How many days did it take for the product to arrive?\
                         If this information is not found, output 'no information found.'
                        price_value: Extract any sentences about the value or price,\
                         and output them as a comma separated Python list.
                        text: {text}
                        {format_instructions}
                      """
    text = """
        This leaf blower is pretty amazing.  It has four settings:\
        candle blower, gentle breeze, windy city, and tornado. \
        It arrived in two days, just in time for my wife's \
        anniversary present. \
        I think my wife liked it so much she was speechless. \
        So far I've been the only one using it, and I've been \
        using it every other morning to clear the leaves on our lawn.\
        It's slightly more expensive than the other leaf blowers \
        out there, but I think it's worth it for the extra features.
    """

    # 整合模版
    chat = chat_init()

    output_parsers = get_output_parsers()
    messages = get_messages(chat,template_string,text,output_parsers.get_format_instructions())
    response = get_response(chat,messages)
    output_dict = output_parsers.parse(response.content)

    print(output_dict)

    # 写入文件夹
    with open("LangChain/01.json","w",encoding="utf-8") as f:
        json.dump(output_dict,f)
