# KanbanBoard — Especificação do projeto

> A arquitetura evoluiu para uma aplicação cliente-servidor. O backend ASP.NET Core é a fonte da verdade, distribui mudanças por SignalR, mantém o estado quente no Redis e salva snapshots no SQLite.

## 1. Visão do produto

O KanbanBoard será uma aplicação web para organização pessoal de trabalho em um quadro Kanban. O projeto será desenvolvido em Angular com foco em aprendizado prático da linguagem e do framework.

Toda a experiência funcionará localmente, com o Angular conectado a uma API ASP.NET Core e persistência sem servidor externo de banco de dados.

## 2. Missão

Permitir que uma pessoa crie seu próprio fluxo de trabalho, organize histórias de usuário simplificadas e acompanhe suas tarefas de forma visual, rápida e intuitiva.

## 3. Escopo da primeira versão (MVP)

### 3.1. Quadro Kanban

O usuário poderá:

- Criar um novo quadro.
- Definir um nome para o quadro.
- Criar, editar, remover e reordenar etapas do fluxo.
- Definir um limite de WIP (*Work in Progress*) para cada etapa.
- Visualizar quando uma etapa atingir ou ultrapassar seu limite de WIP.
- Mover histórias entre as etapas do quadro.
- Continuar de onde parou após atualizar ou fechar o navegador.

### 3.2. Etapas do fluxo

Cada etapa representa uma coluna do quadro, por exemplo: `Backlog`, `Doing`, `Review` e `Done`.

Ao configurar uma etapa, o usuário poderá escolher como deseja acompanhar o trabalho:

- **Doing e Done:** exibe separadamente o que está em andamento e o que foi concluído naquela etapa.
- **Apenas Done:** acompanha somente a conclusão da etapa.

Cada etapa terá:

- Identificador único.
- Nome.
- Posição no quadro.
- Tipo de acompanhamento (`doing-and-done` ou `done-only`).
- Limite de WIP opcional.

O limite de WIP deverá aceitar apenas números inteiros positivos. Quando não for informado, a etapa não terá limite.

### 3.3. Histórias de usuário simplificadas

Uma história será um cartão de trabalho inspirado em uma User Story (US), mas propositalmente mais simples.

O usuário poderá:

- Criar uma história informando apenas o título.
- Editar ou excluir a história.
- Mover a história entre as etapas do quadro.
- Adicionar, editar, remover e reordenar tarefas dentro da história.
- Marcar ou desmarcar cada tarefa por meio de um checkbox.
- Acompanhar o progresso da história pela quantidade de tarefas concluídas.

Cada história terá:

- Identificador único.
- Título obrigatório.
- Etapa atual.
- Lista de tarefas.
- Datas de criação e última atualização.

### 3.4. Tarefas

Cada tarefa pertencerá a uma história e terá:

- Identificador único.
- Descrição curta obrigatória.
- Estado de conclusão (`concluída` ou `pendente`).
- Posição dentro da história.

O progresso de uma história será calculado automaticamente:

```text
progresso = tarefas concluídas / total de tarefas
```

Uma história sem tarefas terá progresso de `0%`.

## 4. Persistência

- O backend será a fonte da verdade do quadro.
- Cada alteração atualizará o estado quente no Redis.
- O estado será salvo periodicamente em um arquivo SQLite embutido.
- Os dados serão restaurados automaticamente ao iniciar a API.
- O estado terá uma versão de schema para permitir migrações futuras.
- Dados inválidos ou corrompidos não deverão impedir a aplicação de abrir.
- Clientes conectados receberão alterações em tempo real pelo SignalR.

Chave do Redis:

```text
kanban:board:v2
```

## 5. Modelo inicial de dados

```ts
type StepTrackingMode = 'doing-and-done' | 'done-only';

interface KanbanState {
  version: 1;
  boards: Board[];
  activeBoardId: string | null;
}

interface Board {
  id: string;
  name: string;
  steps: Step[];
  stories: Story[];
  createdAt: string;
  updatedAt: string;
}

interface Step {
  id: string;
  name: string;
  position: number;
  trackingMode: StepTrackingMode;
  wipLimit: number | null;
}

interface Story {
  id: string;
  title: string;
  stepId: string;
  tasks: StoryTask[];
  createdAt: string;
  updatedAt: string;
}

interface StoryTask {
  id: string;
  description: string;
  completed: boolean;
  position: number;
}
```

## 6. Regras de negócio

1. Um quadro deve possuir ao menos uma etapa.
2. O título da história é obrigatório e não pode conter apenas espaços.
3. A descrição da tarefa é obrigatória e não pode conter apenas espaços.
4. Excluir uma etapa que contenha histórias exigirá escolher outra etapa de destino ou confirmar a exclusão das histórias.
5. Atingir o WIP deverá gerar um aviso visual.
6. Ultrapassar o WIP deverá ser bloqueado por padrão, com uma mensagem explicando o motivo.
7. Marcar todas as tarefas não moverá a história automaticamente; o usuário continuará no controle do fluxo.
8. Alterações deverão ser persistidas sem a necessidade de um botão “Salvar”.

## 7. Experiência desejada

A interface deverá ter a liberdade visual de uma ferramenta como o Excalidraw: área de trabalho ampla, interações diretas, poucos obstáculos e feedback imediato. Isso não significa reproduzir um editor de desenho; a referência é a sensação de simplicidade, fluidez e controle.

Requisitos de experiência:

- Arrastar e soltar histórias entre etapas.
- Arrastar e soltar etapas para reordená-las.
- Criar histórias e tarefas com poucos cliques.
- Funcionar em telas desktop e móveis.
- Ser utilizável por teclado.
- Apresentar foco visível, textos associados aos checkboxes e contraste adequado.
- Pedir confirmação antes de ações destrutivas.

## 8. Fora do escopo inicial

- Login e criação de contas.
- Autenticação e autorização.
- Colaboração com identificação de usuários.
- Sincronização entre instâncias diferentes da API.
- Anexos e upload de arquivos.
- Comentários, responsáveis, etiquetas e prazos.
- Histórico completo de alterações.
- Recursos de desenho livre do Excalidraw.

## 9. Critérios de sucesso do MVP

O MVP estará completo quando o usuário conseguir:

1. Abrir a aplicação e criar um quadro.
2. Configurar suas etapas, modos de acompanhamento e limites de WIP.
3. Criar uma história com título e tarefas internas.
4. Marcar tarefas como concluídas e visualizar o progresso.
5. Mover histórias entre as etapas respeitando o WIP.
6. Recarregar a página e encontrar todo o estado restaurado.
7. Usar o fluxo principal tanto com mouse quanto com teclado.

## 10. Evoluções possíveis

- Exportar e importar o quadro em JSON.
- Temas claro e escuro.
- Atalhos de teclado.
- Pesquisa e filtros.
- Etiquetas, prioridades e prazos.
- Múltiplos quadros com navegação dedicada.
- Desfazer e refazer ações.
- Migração opcional para persistência remota.
