# **Documento de Visão: Projeto BioColeta**

Integrantes:

* César de Souza Prando  
* Jerônimo Barbieri Junior  
* Miguel Morandini  
* Rafael Romano Silva  
* Victor Hugo Malipense Testi

## **1\. Problema a ser Resolvido**

No contexto da gestão urbana, problemas na infraestrutura de bueiros e redes de drenagem demoram a ser identificados. Frequentemente, a constatação de falhas ocorre apenas quando as vias já se encontram alagadas, o que gera transtornos à população, danos ao patrimônio e riscos à saúde pública. A ausência de um monitoramento contínuo inviabiliza a atuação preventiva das equipes de manutenção.

## **2\. Solução Proposta**

O projeto BioColeta consiste em um sistema enxuto de monitoramento preventivo de drenagem. A solução utilizará sensores IoT (nível de água e fluxo) instalados nos bueiros para enviar telemetria a um servidor. Uma Inteligência Artificial atuará como um classificador de anomalias, analisando curtas janelas de dados históricos para identificar padrões matemáticos de obstrução (ex: elevação do nível de água associada à estagnação do fluxo. Ao detectar a anomalia, o sistema emitirá um alerta no painel de controle, sugerindo a verificação técnica do local antes que ocorra o alagamento.

## **3\. Tipos de Usuários**

> * **Operador do Centro de Controle:** Usuário administrativo que acessa a plataforma web, visualiza os indicadores de saúde da rede de drenagem e toma a decisão determinística de despachar equipes de manutenção.  
> * **Dispositivo (Simulador IoT):** Componente autônomo e autenticado no sistema, responsável por gerar e transmitir os pacotes de telemetria periodicamente.

## **4\. Objetivos de Desenvolvimento Sustentável (ODS)**

O projeto está diretamente alinhado às seguintes metas globais:

> * **ODS 6:** Água Potável e Saneamento (evitando contaminação e transbordamentos).  
> * **ODS 11:** Cidades e Comunidades Sustentáveis (garantindo infraestrutura urbana resiliente)  
> * **ODS 12:** Consumo e Produção Responsáveis (otimizando recursos e deslocamentos da frota).  
> * **ODS 13:** Ação contra a Mudança Global do Clima (mitigando os impactos de chuvas intensas através da drenagem eficiente).

**5\. Requisitos Iniciais**

| Categoria | Descrição do Requisito |
| :---- | :---- |
| **Funcionais** | O sistema deve receber pacotes de telemetria (formato JSON) contendo as medições de nível de água e fluxo; O sistema deve permitir que o Operador solicite a análise de anomalias em bueiros específicos através do painel; O sistema deve consumir uma API de IA, enviando o histórico recente de telemetria, para prever ou confirmar suspeitas de obstrução; A interface deve exibir uma listagem ou mapa destacando visualmente os pontos com suspeita de entupimento. |
| **Não Funcionais** | A aplicação de back-end deve ser desenvolvida em PHP 8 orientado a objetos; A persistência de dados (telemetria, histórico e auditoria) deve ocorrer em banco de dados relacional MariaDB; A comunicação com o simulador IoT deve ocorrer sob os protocolos HTTP/REST ou MQTT; Os prompts utilizados pela IA devem ser versionados e armazenados no banco de dados; |
| **Regras de Negócio** | A emissão de ordens de serviço e o despacho de equipes requerem obrigatoriamente a confirmação e aprovação do Operador (supervisão humana); A Inteligência Artificial não possui permissão para executar ações críticas de forma autônoma; |

## **6\. Limites da IA**

O projeto trata a IA estritamente como um componente probabilístico do sistema. O modelo não realizará predições climáticas complexas nem roteirização autônoma definitiva. Seu escopo restringe-se a analisar séries temporais de fluxo e nível e retornar uma probabilidade ou classificação estruturada sobre a integridade do escoamento naquele ponto. Todas as regras de permissão, alertas oficiais e registros seguem fluxos determinísticos controlados pela aplicação em PHP.

## **7\. Critérios de Sucesso**

O produto será considerado bem-sucedido se, em sua demonstração final, for capaz de apresentar o ciclo completo de funcionamento:

> 1. O dispositivo IoT simulado transmitir continuamente telemetria representando condições normais de escoamento.  
> 2. O sistema processar com êxito a inserção de uma anomalia simulada (ex: pico de nível com fluxo zerado).  
> 3. A IA processar adequadamente o histórico, identificando corretamente a anomalia e gerando uma saída estruturada validada.  
> 4. A plataforma exibir o alerta de forma clara ao Operador, permitindo o registro da tomada de decisão.