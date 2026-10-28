# Backlog inicial

O link do quadro Jira e os responsáveis ainda não foram registrados neste documento. As histórias abaixo estão organizadas para cadastrar no Jira ou ferramenta equivalente. O sistema implementa autenticação, cadastro/listagem, agenda e consulta de horários pelo cliente; edição de clientes e serviços segue pendente.

| Prioridade | ID | História | Critérios de aceitação propostos |
| --- | --- | --- | --- |
| Alta | US01 | Como barbeiro, quero entrar e sair da minha conta para proteger a agenda. | Credenciais válidas abrem a área do barbeiro; credenciais inválidas exibem erro; sair encerra a sessão. **Implementado.** |
| Alta | US02 | Como responsável, quero cadastrar e consultar clientes para associá-los aos atendimentos. | Nome, telefone e e-mail são validados; cliente salvo aparece na lista; dados inválidos exibem orientação. **Cadastro/consulta implementados; edição pendente.** |
| Alta | US03 | Como responsável, quero cadastrar e consultar serviços para informar preço e duração do atendimento. | Nome obrigatório; preço em centavos e não negativo; duração inteira positiva; serviço salvo aparece na lista. **Cadastro/consulta implementados; edição pendente.** |
| Alta | US04 | Como responsável, quero agendar um cliente em um horário disponível. | Calendário permite escolher o dia; horários consideram o serviço, a agenda e intervalo de 10 minutos; início entre 08:00 e 18:00; atendimento termina até 18:00; passado, conflito e intervalo insuficiente são rejeitados; preço e duração ficam no histórico. **Implementado.** |
| Alta | US05 | Como responsável, quero consultar a agenda por data para acompanhar os atendimentos do dia. | Lista horários em ordem; lista vazia tem mensagem; cada item mostra cliente, serviço, horário, preço e situação. **Implementado.** |
| Média | US06 | Como responsável, quero cancelar um agendamento para liberar seu horário. | Só reserva agendada pode ser cancelada; cancelamento libera horário; registro permanece no histórico. **Implementado.** |
| Média | US07 | Como responsável, quero concluir um atendimento para registrar que ele ocorreu. | Só reserva agendada pode ser concluída; situação atualizada aparece na agenda; histórico permanece. **Implementado.** |
| Alta | US08 | Como cliente, quero criar uma conta e entrar para acessar minha área. | Cadastro exige nome, telefone, e-mail válido e senha de pelo menos 5 caracteres; conta fica vinculada ao cadastro correspondente; entrada válida abre `/cliente`; dados inválidos exibem erro. **Implementado.** |
| Alta | US09 | Como cliente, quero consultar meus próprios horários para saber quando serei atendido. | Área mostra data, hora, serviço e situação dos horários ligados à conta; lista vazia é informativa; cliente não acessa a agenda de outras pessoas. **Implementado.** |

## Fluxo de trabalho sugerido

`A fazer → Em andamento → Em revisão → Concluído`

Limitar atividades em andamento conforme o tamanho da equipe. Toda tarefa deve ter pessoa responsável, prioridade e critério de conclusão. Quadro, responsáveis e ferramenta são **a definir**.

## Papéis sugeridos

Coordenação, frontend, backend, banco de dados, UX/UI, validação e documentação. Uma pessoa pode assumir mais de um papel. Nomes e distribuição ainda precisam ser acordados pela equipe.

## MVP e dependências

O MVP inicial abrange US01 a US09. Edição de clientes e serviços fica fora da primeira versão implementada. Rever as prioridades após validar o problema e discutir o escopo com a equipe.

## Tarefas de organização para cadastrar no Jira

1. Validar a hipótese do problema com um estabelecimento, sem registrar dados pessoais.
2. Definir integrantes, turma e responsáveis pelos papéis de coordenação, interface, backend, banco e documentação.
3. Confirmar expediente, dias de funcionamento e fuso horário.
4. Criar o quadro e cadastrar US01–US09 com prioridade, critérios de aceitação e responsáveis.
5. Criar tarefas técnicas para protótipo, edição de clientes/serviços, validação de acessibilidade e preparação da demonstração.
6. Colar o link do repositório e, quando existir, o link compartilhável do protótipo.
