import json  
from openai import OpenAI

client = OpenAI(
    api_key="sk-psecigvtcidszbwufkwikjrcjtdgjbqzoejdvpurlalivqwr", # 从https://cloud.siliconflow.cn/account/ak获取
    base_url="https://api.siliconflow.cn/v1"
)


systemtext="You are a helpful assistant designed to output JSON.";
usertext="2020 年世界奥运会乒乓球男子和女子单打冠军分别是谁?";


response = client.chat.completions.create(
        model="deepseek-ai/DeepSeek-V2.5",
        messages=[
            {"role": "system", "content": systemtext},
            {"role": "user", "content": usertext + " "
             "Please respond in the format {\"男子冠军\": ..., \"女子冠军\": ...}"}
        ],
        response_format={"type": "json_object"}
    )

print(response.choices[0].message.content)