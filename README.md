# DesafioPL

Kanban em Angular com backend ASP.NET Core, atualização em tempo real por SignalR, estado quente no Redis e snapshots periódicos em SQLite.

## Executar localmente

Requisito: Docker Desktop em execução.

```bash
npm install
npm run dev
```

O comando constrói e inicia três containers na rede `desafio-pl_kanban-network`:

- frontend em `http://localhost:4200`;
- API em `http://localhost:5080`;
- Redis em `localhost:6379`.

Os logs permanecem no terminal. Para encerrar o ambiente em outro terminal:

```bash
npm run dev:down
```

Redis e SQLite usam volumes nomeados, então os dados sobrevivem à recriação dos containers. O frontend encaminha `/api` e `/hubs` para a API pela rede Docker.

## Execução sem containers

Com Node.js e .NET 8 instalados, também é possível executar os processos separadamente:

```bash
npm run start:redis
npm run start:api
npm start
```

O Redis é opcional durante o desenvolvimento. Sem ele, a API mantém o estado em memória e restaura o último snapshot salvo no SQLite.

```text
Angular -> SignalR -> ASP.NET Core -> Redis
                              |
                              +-> SQLite a cada 30 segundos
```

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.19.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
