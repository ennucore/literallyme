# Literallyme

Use this bot at https://t.me/literalmebot


To set a worker up on a vastai instance:

```bash
ssh $(vastai ssh-url 11731972) 'touch ~/.no_auto_tmux && git clone https://github.com/ennucore/literallyme && cd literallyme && ./setup.sh'
cat ./.env | ssh $(vastai ssh-url 11731972) 'cat > literallyme/.env'
```


