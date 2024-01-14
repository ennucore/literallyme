from bot import bot
from handlers import finish_packs
from handlers import apply_handlers

# bot.run_until_disconnected()
apply_handlers(bot)
bot.loop.run_until_complete(finish_packs(bot))
