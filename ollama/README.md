# Ollama

O container sobe vazio por padrao. Depois do primeiro `docker compose up -d --build`, baixe o modelo local:

```powershell
docker exec -it arthilles_ollama ollama pull llama3
```

Para trocar o modelo, ajuste `OLLAMA_MODEL` no `.env` e baixe o modelo correspondente dentro do container.
