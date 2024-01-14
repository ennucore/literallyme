from bot import bot
from handlers import finish_packs

# bot.run_until_disconnected()
bot.loop.run_until_complete(finish_packs(bot))
