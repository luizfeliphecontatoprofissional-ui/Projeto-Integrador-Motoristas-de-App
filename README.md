# DriveWise — MVP Web Responsivo

**Projeto Integrador | Análise e Desenvolvimento de Sistemas**

O DriveWise é uma aplicação web responsiva desenvolvida para auxiliar motoristas de aplicativo no controle financeiro, acompanhamento de ganhos e despesas e análise de ofertas de corridas.

O projeto foi desenvolvido com base em entrevistas com o público-alvo e nos requisitos definidos na documentação acadêmica.

## Tecnologias utilizadas

- **Frontend:** HTML5, CSS3, JavaScript e Bootstrap 5
- **Backend:** Node.js e Express
- **Banco de dados:** MySQL 8
- **Ferramentas:** Visual Studio Code, MySQL Workbench e GitHub

## Funcionalidades implementadas

### 1. Início
Página de apresentação do DriveWise e acesso às funcionalidades.

### 2. Corridas
- Simulação de ofertas de corridas.
- Cálculo do valor recebido por quilômetro.
- Estimativa de ganho bruto por hora.
- Comparação com o valor mínimo por quilômetro.
- Simulação de início e finalização de corrida.
- Mapa ilustrativo, sem GPS.

### 3. Resumo diário
- Cadastro de receitas e despesas.
- Registro de quilômetros e horas trabalhadas.
- Cálculo de ganhos, despesas e saldo.
- Configuração e acompanhamento da meta diária.
- Listagem e exclusão de lançamentos.

### 4. Relatórios
- Total de receitas e despesas.
- Saldo financeiro.
- Quantidade de lançamentos.
- Visualização de despesas por categoria.
- Análise dos 100 lançamentos mais recentes.

### 5. Alertas
- Cadastro de lembretes de manutenção.
- Avisos por quilometragem informada.
- Exclusão de lembretes.
- Armazenamento local no navegador (localStorage).

### 6. Perfil
- Cadastro do modelo do veículo.
- Identificação de veículo próprio ou alugado.
- Tipo de combustível.
- Valor do aluguel semanal.
- Persistência dos dados no MySQL.

## Como executar o projeto

### Pré-requisitos

- Node.js
- MySQL Server 8
- Visual Studio Code ou outro editor
- Navegador atualizado

### Configuração

1. Clone ou baixe o repositório.
2. Execute o arquivo `sql/schema.sql` no MySQL Workbench.
3. Crie um usuário MySQL com permissões sobre o banco `drivewise`.
4. Abra a pasta do projeto no VS Code.
5. Execute:

```bash
npm install
```

6. Copie `.env.example` para `.env` e configure as variáveis:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=drivewise_user
DB_PASSWORD=SUA_SENHA_LOCAL
DB_NAME=drivewise
PORT=3000
```

7. Inicie o servidor:

```bash
npm start
```

8. Acesse:

http://localhost:3000

No Windows PowerShell, também é possível utilizar `npm.cmd install` e `npm.cmd start`.

## Estrutura do projeto

```text
DriveWise-MVP-Atualizado/
├── docs/
├── public/
│   ├── css/
│   ├── js/
│   └── index.html
├── sql/
│   └── schema.sql
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js
```

## API REST

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/api/health` | Verificar a API |
| GET/POST | `/api/vehicle` | Consultar e cadastrar veículo |
| GET/POST | `/api/entries` | Consultar e registrar lançamentos |
| DELETE | `/api/entries/:id` | Excluir lançamento |
| GET/PUT | `/api/settings` | Consultar e atualizar configurações |
| GET | `/api/summary?date=AAAA-MM-DD` | Consultar resumo diário |

## Limitações do MVP

- RF05, RF06 e RF07 não foram implementados.
- Não possui autenticação nem contas individuais.
- As corridas e o mapa são simulações.
- Não há integração com Uber, 99 ou GPS.
- Os alertas não enviam notificações automáticas.
- O aluguel semanal não é descontado automaticamente do saldo.
- O cálculo por quilômetro não considera todos os custos operacionais.
- Os relatórios consideram até 100 lançamentos recentes.
- O Bootstrap utiliza CDN e depende de internet para carregar seus recursos.

O sistema foi desenvolvido para fins acadêmicos e demonstração local.

## Testes realizados

- Inicialização do servidor Node.js.
- Conexão da API com MySQL.
- Cadastro e persistência de receitas e despesas.
- Cálculo de saldo e acompanhamento da meta.
- Exibição de relatórios financeiros.
- Cadastro de lembrete de manutenção.
- Análise e simulação de corridas.
- Cadastro e persistência de veículo.

## Segurança

O arquivo `.env` contém configurações privadas e não deve ser publicado no GitHub. A pasta `node_modules` também é ignorada pelo Git.

Para utilização em produção, serão necessárias melhorias de autenticação, autorização e proteção dos dados.

---

**DriveWise — Seu lucro na direção certa.**