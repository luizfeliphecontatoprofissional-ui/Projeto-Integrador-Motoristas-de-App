# Especificação Técnica — DriveWise (MVP)

## 1. Objetivo

O DriveWise é um sistema web responsivo de apoio ao controle financeiro de motoristas de aplicativo. A proposta deriva da pesquisa de campo com três motoristas de Curitiba, que relataram dificuldade para identificar lucro real, registrar despesas e avaliar corridas.

## 2. Funcionalidades do MVP desenvolvido

| Requisito | Descrição | Situação no código |
|---|---|---|
| RF01 | Cadastrar veículo próprio ou alugado, combustível e aluguel semanal | Implementado (sem seleção histórica) |
| RF02 | Registrar ganhos, despesas, km e horas por dia | Implementado |
| RF03 | Exibir receita, despesa, lucro líquido, lucro por hora e meta diária | Implementado com base nos lançamentos |
| RF04 | Calcular R$/km e comparar com valor mínimo configurável | Implementado |
| RF05 | Alertas de manutenção por quilometragem | Não implementado |
| RF06 | Reserva para manutenção | Não implementado |
| RF07 | Custo de veículo parado | Não implementado |
| RF08 | Registrar multas como despesa | Implementado |

## 3. Arquitetura

Arquitetura cliente-servidor em três camadas:

1. **Apresentação:** HTML5, CSS3, JavaScript e Bootstrap 5. Interface adaptável a celular e desktop.
2. **Aplicação:** Node.js com Express; API REST com validações básicas, consultas e regras de cálculo.
3. **Persistência:** MySQL com tabelas `vehicles`, `entries` e `settings`; conexão via `mysql2` com consultas parametrizadas.

Fluxo: navegador → requisição HTTP `/api/*` → Express → MySQL → resposta JSON → atualização da interface.

## 4. Modelo de dados

- `vehicles`: identificador, modelo, propriedade, aluguel semanal, combustível e data de cadastro.
- `entries`: identificador, data, categoria (ganho, combustível, aluguel, manutenção, multa ou outros), valor, km, horas e descrição.
- `settings`: meta diária e valor mínimo por km (registro único do MVP).

## 5. Regras de negócio

- **Ganhos do dia:** soma de lançamentos do tipo `ganho`.
- **Despesas do dia:** soma dos demais tipos.
- **Lucro líquido registrado:** ganhos − despesas.
- **Lucro/hora:** lucro líquido registrado ÷ horas informadas (zero quando não há horas).
- **Progresso da meta:** lucro líquido registrado ÷ meta diária × 100 (com meta zero, mostra zero).
- **Valor por km:** valor oferecido da corrida ÷ distância total informada; compara com mínimo configurado.

Os resultados dependem da completude dos registros e não consideram custos não lançados.

## 6. Tecnologias e ferramentas

Frontend: HTML5, CSS3, JavaScript, Bootstrap 5. Backend: Node.js, Express, `dotenv`, `mysql2`. Banco: MySQL. IDE sugerida: VS Code. Versionamento sugerido: Git/GitHub.

## 7. Testes recomendados antes da entrega

1. Iniciar MySQL e executar `sql/schema.sql`.
2. Configurar `.env`, instalar dependências e iniciar servidor.
3. Verificar `http://localhost:3000/api/health` (resposta `{"ok":true}`).
4. Cadastrar veículo; registrar ganho de R$ 200 e combustível de R$ 50 no mesmo dia.
5. Confirmar lucro líquido R$ 150 e que os dados persistem após atualizar a página.
6. Registrar multa de R$ 20 e confirmar lucro líquido R$ 130.
7. Testar calculadora com R$ 30 e 20 km (R$ 1,50/km).
8. Testar interface em tela de celular e desktop.

**Importante:** esta documentação descreve o código entregue; a execução local e os testes integrados precisam ser confirmados pela equipe.

## 8. Evoluções futuras

Autenticação e múltiplos usuários; alertas de manutenção; reserva financeira; custo do carro parado; rateio automático do aluguel; relatórios e exportação.


## Atualização da interface
A versão atual tem navegação entre seis áreas. Corridas e mapa são simulações demonstrativas; lembretes usam armazenamento local do navegador. Resumo, relatórios, metas e veículo usam a API e MySQL. Não há integração real com aplicativos de transporte nem GPS.
