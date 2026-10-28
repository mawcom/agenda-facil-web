# Proposta e requisitos iniciais

## Identificação

- **Projeto:** Agenda Fácil
- **Disciplina:** Desenvolvimento Web
- **Professor:** esp. Welliton Cunha
- **Integrantes e turma:** a definir pela equipe

## Problema e contexto

Hipótese a validar com um estabelecimento: controlar os horários por mensagens e anotações pode dificultar a consulta da agenda e contribuir para agendamentos conflitantes. A rotina atual, as dificuldades concretas e a frequência do problema ainda precisam ser levantadas com o barbeiro ou atendente.

## Público e objetivo

O público inicial é o barbeiro ou atendente responsável pela agenda. Clientes não terão acesso próprio no MVP proposto.

O objetivo é oferecer uma ferramenta interna para registrar clientes, serviços e atendimentos, consultar a agenda por data e reduzir conflitos de horário.

## Escopo do MVP proposto

1. Autenticar o responsável e permitir encerrar a sessão.
2. Cadastrar, consultar e editar clientes com nome e telefone.
3. Cadastrar, consultar e editar serviços com nome, preço e duração.
4. Criar agendamentos ligados a um cliente e a um serviço.
5. Consultar a agenda por data.
6. Cancelar ou concluir um atendimento agendado.
7. Validar horários passados, expediente e sobreposição de agendamentos.
8. Persistir dados e validar regras no backend.

**Fora do MVP:** pagamentos, integração com WhatsApp, aplicativo móvel, autoagendamento pelo cliente, suporte a vários profissionais e reagendamento.

## Requisitos funcionais iniciais

- **RF01:** o responsável pode entrar e encerrar a sessão.
- **RF02:** o responsável pode criar, consultar e editar clientes.
- **RF03:** o responsável pode criar, consultar e editar serviços.
- **RF04:** o responsável pode criar um agendamento para um cliente e serviço.
- **RF05:** o responsável pode consultar os agendamentos de uma data.
- **RF06:** o responsável pode cancelar ou concluir um agendamento que esteja agendado.
- **RF07:** o sistema rejeita conflito de horário, data passada e reserva fora do expediente.
- **RF08:** o sistema persiste os dados no banco e informa erros de validação de forma compreensível.

## Requisitos não funcionais iniciais

- Validar dados no servidor, usar consultas parametrizadas e armazenar senhas com hash apropriado.
- Usar interface responsiva, com rótulos, foco visível e navegação por teclado.
- Evitar exposição de credenciais e dados pessoais; utilizar somente dados fictícios no desenvolvimento e nas demonstrações.
- Registrar preço em centavos e manter o histórico dos valores aplicados a cada reserva.

## Regras de negócio propostas

- Um profissional atende apenas um cliente por vez; cada reserva tem um cliente e um serviço.
- Preço não pode ser negativo e duração deve ser um inteiro positivo.
- O horário final é calculado a partir da duração do serviço.
- Preço e duração são copiados para a reserva no momento da criação; alterações futuras no serviço não mudam reservas existentes.
- Há sobreposição quando `novoInicio < fimExistente` e `novoFim > inicioExistente`. Um atendimento pode começar exatamente quando outro termina.
- A verificação de conflito e a inserção devem ocorrer na mesma transação para evitar reservas simultâneas no mesmo intervalo.
- Cancelar libera o horário; concluir preserva o histórico. Somente reservas agendadas podem ser canceladas ou concluídas.

## Premissas, riscos e dúvidas

- **Premissa:** haverá um único profissional usando a agenda.
- **Validação pendente:** confirmar o problema e o fluxo atual com um estabelecimento real.
- **Pendente:** definir expediente, dias de atendimento e fuso horário do estabelecimento.
- **Pendente:** confirmar equipe, turma, responsáveis, critérios de avaliação e tecnologias com a disciplina.
- **Risco:** regras de expediente indefinidas podem afetar validações e protótipo.
- **Risco:** dados pessoais reais ou credenciais podem ser expostos se forem usados em exemplos.
