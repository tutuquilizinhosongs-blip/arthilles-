# Instalador Windows

Este diretorio gera o instalador `ArthillesSetup.exe` usando Inno Setup.

## Requisitos Para Gerar

- Windows
- Inno Setup 6 instalado
- Docker nao precisa estar instalado para gerar o instalador

Baixe o Inno Setup:

```text
https://jrsoftware.org/isdl.php
```

## Gerar Instalador

Na raiz do projeto:

```powershell
.\installer\build-installer.ps1
```

Resultado:

```text
dist\ArthillesSetup.exe
```

## O Que O Instalador Faz

- Copia o projeto para `C:\Arthilles`.
- Cria a pasta persistente `C:\Arthilles\data`.
- Cria atalhos na area de trabalho:
  - `Arthilles Painel`
  - `Iniciar Arthilles`
  - `Parar Arthilles`
  - `Logs Arthilles`
- Verifica se Docker Desktop esta instalado.
- Se Docker Desktop nao existir, mostra aviso e abre o site oficial.
- Se Docker Desktop estiver fechado, o atalho tenta abrir e aguardar o Docker iniciar.
- Ao final, roda `docker compose up -d --build`.
- Abre `http://localhost:3000`.
- No uninstall, para os containers com `docker compose down`.

## Dados Do Cliente

Os dados persistem em:

```text
C:\Arthilles\data
```

O uninstall padrao remove os arquivos instalados. Antes de remover em ambiente real, faca backup da pasta `data` se quiser preservar o banco.
