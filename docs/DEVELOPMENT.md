# Guia de desenvolvimento

## Início rápido

Com Docker Desktop em execução:

```bash
npm install
npm run dev
```

O comando executa `docker compose up --build` e mantém os logs dos três serviços no terminal.

| Recurso | Endereço |
| --- | --- |
| Aplicação | `http://localhost:4200` |
| API direta | `http://localhost:5080` |
| Healthcheck | `http://localhost:5080/health` |
| Estado atual | `http://localhost:5080/api/board` |
| Redis | `localhost:6379` |

Para encerrar:

```bash
npm run dev:down
```

## Comandos úteis

```bash
# Ambiente completo com logs no terminal
npm run dev

# Ambiente completo em background
docker compose up --build -d

# Estado e healthchecks dos containers
docker compose ps

# Logs de todos os serviços
docker compose logs -f

# Logs apenas da API
docker compose logs -f api

# Reconstruir somente o frontend
docker compose up --build -d frontend

# Encerrar preservando dados
npm run dev:down

# Encerrar e apagar Redis e SQLite
docker compose down --volumes
```

## Execução fora do Docker

É possível executar frontend e API diretamente para aproveitar reload mais rápido durante alterações frequentes.

```bash
# Redis continua no Docker
npm run start:redis

# Terminal da API
npm run start:api

# Terminal do Angular
npm start
```

O Angular CLI usa `proxy.conf.json` para encaminhar `/api` e `/hubs` a `http://localhost:5080`. O código da aplicação usa URLs relativas, portanto não precisa mudar entre os dois modos.

Não execute o frontend Docker e `npm start` ao mesmo tempo: ambos tentam usar a porta `4200`.

## Verificações antes de commitar

```bash
# Build do Angular
npm run build

# Testes do Angular sem modo watch
npm test -- --watch=false

# Build da API
dotnet build backend/Kanban.Api/Kanban.Api.csproj

# Validação estrutural do Compose
docker compose config --quiet
```

Para uma validação integrada:

```bash
docker compose up --build -d
docker compose ps
curl http://localhost:4200/api/board
curl -X POST "http://localhost:4200/hubs/board/negotiate?negotiateVersion=1"
```

Os três containers devem aparecer como `healthy`. A negociação do hub deve retornar `connectionToken` e incluir `WebSockets` em `availableTransports`.

## Contrato HTTP e SignalR

### HTTP

| Método | Rota | Uso |
| --- | --- | --- |
| `GET` | `/health` | Confirma que o processo da API responde |
| `GET` | `/api/board` | Retorna a fotografia atual do quadro |

### Hub `/hubs/board`

Métodos invocados pelo cliente:

| Método | Payload |
| --- | --- |
| `AddColumn` | `AddColumnCommand` |
| `AddTask` | `AddTaskCommand` |
| `MoveTask` | `MoveTaskCommand` |
| `ToggleChecklist` | `ToggleChecklistCommand` |

Evento enviado pelo servidor:

| Evento | Conteúdo |
| --- | --- |
| `BoardChanged` | `BoardState` completo |

O endpoint `/hubs/board/negotiate` é usado internamente pelo SignalR com `POST`. Abri-lo na barra do navegador envia `GET` e não representa um teste válido.

## Estrutura do código

```text
backend/Kanban.Api/
├── Board/
│   ├── BoardModels.cs
│   ├── BoardReducer.cs
│   ├── BoardStore.cs
│   ├── BoardHub.cs
│   ├── RedisBoardCache.cs
│   └── BoardSnapshotWorker.cs
├── Program.cs
└── Dockerfile

src/app/features/board/
├── components/
├── data-access/
│   └── board-realtime.service.ts
├── facades/
│   └── board.facade.ts
├── models/
└── pages/
```

### Onde colocar cada mudança

- Regra de negócio pura: `BoardReducer`.
- Novo contrato de estado ou comando: models do backend e do frontend.
- Coordenação de memória/cache/snapshot: `BoardStore`.
- Comunicação em tempo real: `BoardHub` e `BoardRealtimeService`.
- Estado preparado para a UI: `BoardFacade`.
- Comportamento visual: componentes e páginas.
- Rede e containers: `docker-compose.yml`, Dockerfiles e `nginx.conf`.

## Como adicionar um novo comando

Exemplo: adicionar a edição do título de uma tarefa.

1. Criar `RenameTaskCommand` nos contratos C# e TypeScript.
2. Implementar a transformação pura no `BoardReducer`.
3. Expor `RenameTaskAsync` no `BoardStore`.
4. Criar `RenameTask` no `BoardHub`.
5. Adicionar a invocação no `BoardRealtimeService`.
6. Encaminhar o método pelo `BoardFacade`.
7. Conectar a ação no componente.
8. Cobrir reducer e facade com testes.
9. Executar build, testes e smoke test do Compose.

Esse caminho mantém UI, transporte, domínio e persistência separados.

## Inspeção de dados

### Redis

```bash
docker compose exec redis redis-cli GET kanban:board:v2
```

Para verificar apenas se a chave existe:

```bash
docker compose exec redis redis-cli EXISTS kanban:board:v2
```

### Volumes

```bash
docker volume inspect desafio-pl_redis-data
docker volume inspect desafio-pl_api-data
```

O volume `api-data` contém `/data/kanban.db` dentro do container da API. Não edite esse arquivo enquanto a API estiver escrevendo nele.

## Troubleshooting

### Porta já está em uso

Sintomas: container não inicia, a página pertence a outro processo ou o hub retorna uma resposta inesperada.

```powershell
Get-NetTCPConnection -LocalPort 4200,5080,6379 -State Listen
```

Encerre o `ng serve`, API ou Redis local que estiver concorrendo com o Compose, ou altere o mapeamento de portas.

### `negotiate` retorna 404

1. Confirme que a chamada é `POST`, não `GET`.
2. Execute `docker compose ps` e aguarde os três serviços ficarem saudáveis.
3. Teste a API diretamente em `localhost:5080`.
4. Teste pelo proxy em `localhost:4200`.
5. Verifique `docker compose logs frontend api`.

### API não inicia sem Redis

A conexão usa `abortConnect=true` e timeout curto. Confira se a variável `ConnectionStrings__Redis` não sobrescreveu essa configuração com outra política. A falha esperada deve aparecer como warning e a API deve continuar com memória e SQLite.

### Estado não reaparece após reiniciar

```bash
docker compose ps
docker volume ls | Select-String desafio-pl
docker compose logs api
```

Confira se o ambiente foi encerrado com `docker compose down --volumes`, pois essa opção remove os dois mecanismos persistentes.

### Frontend não atualiza em tempo real

1. Abra Network no DevTools e filtre por `board` ou `ws`.
2. Confirme que a negociação retorna `200`.
3. Confirme que existe uma conexão WebSocket ativa.
4. Verifique logs da API durante uma mutação.
5. Faça uma nova conexão para forçar o envio inicial de `BoardChanged`.

## Limpeza segura

Use `npm run dev:down` no dia a dia. Ele preserva os dados.

Use `docker compose down --volumes` somente quando quiser começar com um quadro vazio. A remoção dos volumes não pode ser desfeita pelo projeto.
