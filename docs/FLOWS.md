# Fluxos da aplicação

Este documento acompanha uma ação desde a interface até a persistência e descreve como a aplicação se recupera de conexões interrompidas.

## Conexão inicial

```mermaid
sequenceDiagram
    actor User as Usuário
    participant UI as Angular UI
    participant Facade as BoardFacade
    participant Client as BoardRealtimeService
    participant Proxy as Nginx
    participant Hub as BoardHub
    participant Store as BoardStore

    User->>UI: Abre o quadro
    UI->>Facade: Instancia a feature
    Facade->>Client: connect()
    Client->>Proxy: POST /hubs/board/negotiate
    Proxy->>Hub: Encaminha negociação
    Client->>Hub: Abre WebSocket
    Hub->>Store: Get()
    Store-->>Hub: BoardState atual
    Hub-->>Client: BoardChanged
    Client-->>Facade: state$.next(state)
    Facade-->>UI: board$ agrupado por lanes
```

A requisição `negotiate` é um `POST` interno do SignalR. Ela devolve token de conexão e transportes disponíveis; não é uma página destinada a acesso manual por `GET`.

## Criação de uma coluna

```mermaid
sequenceDiagram
    actor User as Usuário
    participant Dialog as AddColumnDialog
    participant Facade as BoardFacade
    participant Client as SignalR Client
    participant Hub as BoardHub
    participant Store as BoardStore
    participant Reducer as BoardReducer
    participant Redis
    participant Other as Todos os clientes

    User->>Dialog: Informa título e tipo
    Dialog->>Facade: addColumn(command)
    Facade->>Client: addColumn(command)
    Client->>Hub: Invoke AddColumn
    Hub->>Store: AddColumnAsync
    Store->>Store: Aguarda semaphore
    Store->>Reducer: AddColumn(state, command)
    Reducer-->>Store: Novo BoardState
    Store->>Redis: SET kanban:board:v2
    Store->>Store: Marca dirty = 1
    Store-->>Hub: Novo BoardState
    Hub-->>Other: BoardChanged
    Other-->>User: Renderiza estado confirmado
```

O frontend não cria o ID definitivo e não altera o card de forma otimista. A interface muda quando recebe a fotografia confirmada pelo servidor.

## Criação de tarefa

O caminho é o mesmo da criação de coluna, com validações adicionais no reducer:

1. o título é normalizado com `Trim`;
2. a coluna precisa existir;
3. o status precisa ser `doing` ou `done`;
4. uma coluna `done-only` rejeita tarefas em `doing`;
5. descrições vazias do checklist são descartadas;
6. IDs são gerados na API;
7. a posição é calculada no fim da lane escolhida.

## Drag-and-drop

```mermaid
flowchart TD
    Drop[CDK emite drop] --> Normalize[BoardGuide cria MoveTaskCommand]
    Normalize --> Invoke[Facade invoca MoveTask no hub]
    Invoke --> Validate{Tarefa, coluna e status válidos?}
    Validate -->|Não| Same[Estado permanece igual]
    Validate -->|Sim| Remove[Remove tarefa da origem]
    Remove --> Insert[Insere no índice de destino]
    Insert --> Positions[Normaliza posições de todas as lanes]
    Positions --> Cache[Atualiza Redis]
    Cache --> Broadcast[Broadcast BoardChanged]
```

A normalização garante posições sequenciais `0, 1, 2...` e elimina lacunas deixadas na lane de origem.

## Alteração de checklist

O card emite `taskId`, `itemId` e `completed`. O reducer procura apenas a tarefa e o item correspondentes, preservando coluna, lane e posição. Em seguida, o estado completo segue o fluxo normal de Redis e broadcast.

## Snapshot no SQLite

```mermaid
sequenceDiagram
    participant Store as BoardStore
    participant Worker as BoardSnapshotWorker
    participant SQLite

    Store->>Store: Mutação define dirty = 1
    loop A cada 30 segundos
        Worker->>Store: SaveSnapshotAsync()
        alt dirty = 0
            Store-->>Worker: Não há trabalho
        else dirty = 1
            Store->>SQLite: UPSERT snapshot id=1
            SQLite-->>Store: Persistido
        end
    end
```

Se a escrita falhar, a flag `dirty` volta para `1`, permitindo nova tentativa no próximo ciclo. Um encerramento normal também solicita um snapshot final.

## Redis indisponível

```mermaid
flowchart LR
    Command[Comando] --> Memory[Atualiza memória]
    Memory --> RedisWrite[Tenta gravar Redis]
    RedisWrite -->|Falha| Warning[Registra warning]
    Warning --> Dirty[Marca estado como dirty]
    Dirty --> Broadcast[Continua o broadcast]
    Dirty --> Snapshot[SQLite no próximo ciclo]
```

O `RedisBoardCache` trata a falha internamente. A indisponibilidade do Redis reduz a durabilidade imediata, mas não bloqueia o uso do quadro.

## Reconexão do navegador

O cliente SignalR usa `withAutomaticReconnect()`. Quando a conexão é restabelecida, o servidor executa `OnConnectedAsync` novamente e envia o estado atual ao cliente. A fotografia recebida substitui qualquer estado visual antigo.

Se a conexão inicial falhar antes de ser estabelecida, o serviço agenda uma nova chamada a `connect()` após três segundos.

## Reinicialização da API

1. A API cria o diretório e a tabela do SQLite, se necessário.
2. Tenta ler `kanban:board:v2` do Redis.
3. Se encontrar, usa esse valor como estado atual.
4. Caso contrário, procura o snapshot no SQLite.
5. Se encontrar SQLite, carrega o estado e reaquece o Redis.
6. Sem nenhuma fonte persistida, inicia com schema v2 vazio.

## Encerramento e remoção do ambiente

`npm run dev:down` remove containers e rede, mas preserva os volumes nomeados. Um próximo `npm run dev` recupera os dados.

Para remover também os dados, use conscientemente:

```bash
docker compose down --volumes
```

Esse último comando apaga tanto o estado persistido pelo Redis quanto o arquivo SQLite do volume da API.
