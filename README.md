# Agenda Fácil

Projeto acadêmico de Desenvolvimento Web para organizar os agendamentos de uma barbearia atendida por um único profissional.

> **Situação:** planejamento. Esta base documenta uma proposta de MVP; não há aplicação funcional implementada. O problema e as decisões ainda precisam ser validados com um estabelecimento e com a equipe.

## Objetivo

Explorar uma forma simples de consultar e administrar clientes, serviços e horários, reduzindo o risco de conflitos que podem ocorrer quando a agenda é controlada por mensagens e anotações. Essa descrição é uma hipótese de projeto, não um problema já validado.

## Escopo proposto para o MVP

- Login e encerramento de sessão do responsável.
- Cadastro, consulta e edição de clientes e serviços.
- Criação e consulta de agendamentos por data.
- Cancelamento e conclusão de atendimentos.
- Validação de horários, expediente e conflitos no servidor.
- Persistência de dados em banco.

Pagamentos, integração com WhatsApp, autoagendamento pelo cliente, aplicativo móvel, múltiplos profissionais e reagendamento ficam fora da proposta inicial.

## Tecnologias em avaliação

HTML, CSS e JavaScript no frontend; Node.js com Express no backend; SQLite no banco; Figma ou ferramenta similar para prototipação; Git e GitHub para versionamento. A equipe pode ajustar as escolhas conforme o conteúdo da disciplina.

## Estrutura

- `docs/`: proposta, backlog, cronograma, protótipo e arquitetura.
- `frontend/`: reservado à interface.
- `backend/`: reservado à API e regras de negócio.
- `database/`: reservado ao esquema e arquivos de desenvolvimento do banco.
- `tests/`: reservado aos testes.

As pastas de implementação estão vazias nesta etapa. Não há dependências, servidor, telas funcionais, banco de dados ou testes automatizados.

## Como executar

Ainda não há aplicação para executar. As instruções serão atualizadas quando a implementação começar.

## Equipe e entregas

Integrantes, turma, responsáveis, quadro de tarefas e link do protótipo ainda precisam ser definidos pela equipe. Consulte [`docs/03-cronograma-e-equipe.md`](docs/03-cronograma-e-equipe.md).

## Configuração e segurança

Use `.env.example` apenas como referência para futuras variáveis. Não inclua senhas, tokens, credenciais ou dados pessoais reais no repositório. Os dados de desenvolvimento devem ser fictícios.

## Limitações atuais

Esta entrega contém apenas documentação inicial. O problema ainda não foi validado com um estabelecimento, expediente e fuso horário não foram definidos, e nenhuma funcionalidade descrita está implementada.
