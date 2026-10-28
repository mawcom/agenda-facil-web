# Backlog inicial

O quadro e os responsáveis ainda não foram definidos. As histórias abaixo são uma proposta inicial; a equipe deve priorizar, atribuir responsáveis e confirmar os critérios antes de registrar as tarefas na ferramenta escolhida.

| Prioridade | ID | História | Critérios de aceitação propostos |
| --- | --- | --- | --- |
| Alta | US01 | Como responsável, quero entrar e sair da minha conta para restringir o acesso à agenda. | Credenciais válidas iniciam sessão; inválidas mostram erro sem revelar detalhes sensíveis; sair encerra a sessão. |
| Alta | US02 | Como responsável, quero cadastrar e consultar clientes para associá-los aos atendimentos. | Nome e telefone são validados; cliente salvo aparece na consulta; campos inválidos mostram orientação. |
| Alta | US03 | Como responsável, quero cadastrar e consultar serviços para informar preço e duração do atendimento. | Nome obrigatório; preço em centavos e não negativo; duração inteira positiva. |
| Alta | US04 | Como responsável, quero criar um agendamento para reservar um horário para um cliente e serviço. | Reserva mantém cópia de preço e duração; horário final deriva da duração; datas passadas, fora do expediente e conflitos são rejeitados. |
| Alta | US05 | Como responsável, quero ver a agenda por data para acompanhar os atendimentos do dia. | A data selecionada é identificada; lista vazia tem estado informativo; horários são apresentados em ordem. |
| Média | US06 | Como responsável, quero cancelar um agendamento para liberar seu horário. | Só reserva agendada pode ser cancelada; cancelamento libera intervalo para nova reserva; histórico permanece. |
| Média | US07 | Como responsável, quero concluir um atendimento para registrar que ele ocorreu. | Só reserva agendada pode ser concluída; estado final aparece na agenda; histórico permanece. |

## Fluxo de trabalho sugerido

`A fazer → Em andamento → Em revisão → Concluído`

Limitar atividades em andamento conforme o tamanho da equipe. Toda tarefa deve ter pessoa responsável, prioridade e critério de conclusão. Quadro, responsáveis e ferramenta são **a definir**.

## Papéis sugeridos

Coordenação, frontend, backend, banco de dados, UX/UI, validação e documentação. Uma pessoa pode assumir mais de um papel. Nomes e distribuição ainda precisam ser acordados pela equipe.

## MVP e dependências

O MVP inicial abrange US01 a US07. Cadastro de cliente e serviço, autenticação e regras de horário são pré-requisitos para a agenda integrada. Rever as prioridades após validar o problema e discutir o escopo com a equipe.
