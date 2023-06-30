import poe

client = poe.Client("7oifB7lowK8lxUTL-TnVpw%3D%3D")
message = "What is your name?"

response = ""

for chunk in client.send_message("capybara", message, with_chat_break=True):
    response += chunk["text_new"]
print(response)
