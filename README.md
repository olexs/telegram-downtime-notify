# telegram-downtime-notify
Simple script to ping multiple hosts and notify via Telegram bot when they go offline and come back online

Necessary environment variables (put in .env for dev or specify in the container environment for deployment):

```
BOT_TOKEN=123456789:ASDFGHJKJKL_your_telegram_bot_token
BOT_CHAT_ID=123456789
HOSTS=google.com,olex.biz,localhost
CHECK_PERIOD=30
LOG_LEVEL=debug
```
