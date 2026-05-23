# Android e PWA

O ArthillesBot nao instala Docker no Android. O celular acessa o painel que esta rodando no computador.

## Passos

1. Conecte o computador e o celular na mesma rede Wi-Fi.
2. Descubra o IP do computador.
3. Abra no celular:

```text
http://IP-DO-PC:3000
```

## Descobrir IP

Windows:

```powershell
ipconfig
```

Ubuntu:

```bash
hostname -I
```

## Instalar como app

No Chrome Android:

1. Abra o dashboard.
2. Toque no menu do navegador.
3. Selecione `Adicionar a tela inicial`.

O dashboard inclui manifesto PWA e layout responsivo.
