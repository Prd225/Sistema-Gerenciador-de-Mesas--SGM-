/**
 * Catálogo de Templates Modulares da SGM-SDL para Múltiplos Sistemas de RPG.
 *
 * Sintaxe limpa, direta e sem chaves ({ }), estruturada por diretivas e blocos.
 */

export interface SheetDSLPreset {
  id: string;
  name: string;
  system: string;
  paradigm: string;
  source: string;
}

export const SHEET_DSL_PRESETS: Record<string, SheetDSLPreset> = {
  tormenta20: {
    id: 'tormenta20',
    name: 'Guerreiro de Khalmyr (Tormenta20)',
    system: 'Tormenta20',
    paradigm: 'D20 Linear + Metade do Nível + Graus de Treino + Pontos de Mana + Carga por Força',
    source: `@meta "Valeros, Guerreiro de Khalmyr" [archetype: "Guerreiro", system: "Tormenta20", level: 4, theme: "amber"]

@profile "Valeros" [col1, md]
  archetype: "Guerreiro de Khalmyr"
  system: "Tormenta20"
  level: 4

@rank treino
  destreinado = 0
  treinado = 2

@attr [col1, cards]
  FOR "Força"       := 4
  DES "Destreza"    := 1
  CON "Constituição":= 3
  INT "Inteligência":= 0
  SAB "Sabedoria"   := 1
  CAR "Carisma"     := -1

@stat [col1]
  metade_nivel "Metade do Nível" = floor(level / 2)
  DEF "Defesa" = 10 + DES + metade_nivel
  Deslocamento := 9
  pv_bonus_nivel := 0

@res [col2]
  PV "Pontos de Vida": 42 / (20 + CON + (level - 1) * (5 + CON + pv_bonus_nivel)) [red]
  PM "Pontos de Mana": 12 / (level * 3)                          [blue]

@counter [col2, segments]
  acao_esp "Ação Especial": 2/3 [segments, amber]
  folego "Fôlego": 2/3          [dots, amber]

@turn [col2, reset: "round"]
  padrao "Padrão": slots(1 / 1)
  movimento "Movimento": slots(1 / 1)
  reacao "Reação": slots(1 / 1)
  convert "Completa" -> 1 padrao, 1 movimento

@desc [col1]
  senses: ["Visão na Penumbra"]
  divindade: "Khalmyr"
  tag "Inspirado / Bênção" [active: false] -> Luta += 2

@skill [col2, roll: 1d20 + metade_nivel + attr + self]
  Luta (FOR)       = treinado + 2
  Pontaria (DES)   = destreinado
  Fortitude (CON)  = treinado
  Iniciativa (DES) = destreinado
  Percepcao (SAB)  = treinado
  Vontade (SAB)    = destreinado
  Atletismo (FOR)  = treinado

@inv [col1]
  unit = "espacos"
  max_load = FOR * 3
  overload_limit = max_load * 2

  item "Cota de Malha" [weight: 2, qty: 1, !equipped, #armadura]
    desc: "Armadura pesada de anéis metálicos entrelaçados."
    DEF += 6

  item "Escudo Pesado" [weight: 1, qty: 1, !equipped, #escudo]
    desc: "Escudo de aço com o símbolo da balança da justiça."
    DEF += 2

  item "Espada Longa" [weight: 1, qty: 1, !equipped, #arma]
    action "Ataque com Espada Longa" [type: "Padrão"]
      test: 1d20 + metade_nivel + FOR + Luta
      damage: 1d8 + FOR
      desc: "Crítico 19..20 / x2"

  item "Arco Longo" [weight: 1, qty: 1, !equipped, #arma]
    action "Disparo com Arco" [type: "Padrão", ammo: "Flechas"]
      test: 1d20 + metade_nivel + DES + Pontaria
      damage: 1d8 + DES
      desc: "Disparo à distância. Gasta 1 flecha do inventário."

  item "Flechas" [weight: 1, qty: 20, !carried, !consumable]
    desc: "Aljava com 20 flechas de ponta de aço."

  item "Bálsamo Restaurador" [weight: 1, qty: 3, !carried, !consumable]
    desc: "Cura 2d4 PV."

  rule load() > max_load -> DEF -= 5 | Deslocamento -= 3

@ability [col2]
  ability "Ataque Especial" [type: "Livre", cost: 1 PM]
    desc: "Gasta 1 PM para receber +4 no teste de ataque ou na rolagem de dano."
    enhance "+4 Adicional" [cost: 1 PM, requires: "5º Nível"]
      desc: "Aumenta o bônus total para +8 (ou +4 ataque e +4 dano)."

  ability "Durão" [type: "Reação", cost: 2 PM]
    desc: "Gasta 2 PM para reduzir o dano sofrido à metade."

  ability "Postura Defensiva" [type: "Movimento", active: false]
    desc: "Enquanto mantiver a postura defensiva erguida, recebe +2 na Defesa."
    when active -> DEF += 2

@progression "Subir de Nível" [col1, trigger: "level_up", button: "Subir de Nível", icon: "sparkles"]
  @step "Avanço de Nível & Estatísticas"
    @gains [esq]
      "Pontos de Vida" [desc: "+5 PV por nível (+ CON e bônus de talentos)", target: "PV.max", mod: 5 + CON + pv_bonus_nivel]
      "Pontos de Mana" [desc: "+3 PM por nível", target: "PM.max", mod: 3]
      level += 1

  @step "Poder de Guerreiro ou Geral" [target: "@ability"]
    choose 1 "Poder de Classe ou Geral" from [
      ability "Golpe Pessoal" [type: "Padrão", cost: 2 PM] {
        desc: "Você desfere um golpe com toda a sua força (+2d8 de dano)."
        damage: 2d8 + FOR
      }
      ability "Ataque Poderoso" [type: "Livre", req: "FOR >= 2", #combate] {
        desc: "Ao atacar, pode aplicar -2 no teste para causar +5 no dano."
      }
      ability "Vitalidade" [req: "CON >= 1", #destino] {
        desc: "Você se torna mais resistente (+1 PV por nível e +2 em Fortitude)."
        apply: "pv_bonus_nivel += 1"
      }
      ability "Sortudo" [#destino] {
        desc: "Gasta 3 PM para rolar novamente um teste recém-realizado."
        cost: 3 PM
      }
      ability "Foco em Arma" [#combate] {
        desc: "Recebe +2 em testes de ataque com a arma escolhida."
      }
    ]`,
  },

  ordem_paranormal: {
    id: 'ordem_paranormal',
    name: 'Agente Especialista (Ordem Paranormal)',
    system: 'Ordem Paranormal RPG',
    paradigm: 'Parada d20 (Keep Highest) + Graus de Treino + Limite de PE + Carga por Espaços',
    source: `@meta "Arthur Cervero" [archetype: "Especialista", system: "Ordem Paranormal", nex: 50, theme: "purple"]

@profile "Arthur Cervero" [col1, lg]
  archetype: "Especialista"
  system: "Ordem Paranormal"
  nex: 50

@rank treino
  destreinado = 0
  treinado = 5
  veterano = 10
  expert = 15

@attr [col1, pyramid]
  AGI "Agilidade" := 4 [roll: "(self)d20kh1"]
  FOR "Força"     := 1 [roll: "(self)d20kh1"]
  INT "Intelecto" := 3 [roll: "(self)d20kh1"]
  PRE "Presença"  := 2 [roll: "(self)d20kh1"]
  VIG "Vigor"     := 2 [roll: "(self)d20kh1"]

@stat [col1]
  limite_pe "Limite de PE/Turno" = floor(nex / 5)
  DEF "Defesa" = 10 + AGI
  ESQ "Esquiva" = DEF + Reflexos
  BLOQ "Bloqueio" := 5
  Deslocamento := 9

@res [col2]
  PV "Pontos de Vida": 44 / (16 + (3 + VIG) * floor(nex / 5)) [red]
  PE "Pontos de Esforço": 35 / ((3 + PRE) * floor(nex / 5))   [amber]
  SAN "Sanidade": 40 / 40                                     [purple]

@counter [col2, segments]
  acao_esp "Ação Especial": 2/3 [segments, amber]
  perito_uso "Foco Tático": 2/3 [dots, amber]
  ritual_rel "Selo Paranormal": 2/3 [pie, purple]

@turn [col2, reset: "round"]
  padrao "Padrão": slots(1 / 1)
  movimento "Movimento": slots(1 / 1)
  reacao "Reação": slots(1 / 1)
  convert "Completa" -> 1 padrao, 1 movimento

@desc [col1]
  resistances: [Balistico: 2, Mental: 5]
  senses: ["Visão no Escuro"]
  tag "Cobertura Parcial" [active: false] -> DEF += 5

@skill [col2, list, roll: (attr)d20kh1 + self]
  Pontaria (AGI)     = veterano + 2
  Reflexos (AGI)     = veterano
  Furtividade (AGI)  = treinado
  Investigacao (INT) = expert
  Ocultismo (INT)    = veterano
  Vontade (PRE)      = treinado
  Luta (FOR)         = destreinado

@inv [col1]
  unit = "espacos"
  max_load = (FOR > 0) ? FOR * 5 : 2
  overload_limit = max_load * 2

  item "Proteção Leve" [weight: 2, qty: 1, category: 1, !equipped, #armadura]
    desc: "Jaqueta reforçada com kevlar discreto."
    DEF += 5

  item "Fuzil de Precisão" [weight: 2, qty: 1, category: 3, !equipped, #arma]
    action "Disparo de Precisão" [type: "Padrão", range: "Longo"]
      test: (AGI)d20kh1 + Pontaria
      damage: 2d10 + AGI
      desc: "Crítico 19..20 / x3."

  item "Balas Longas" [weight: 1, qty: 1, !carried, !consumable]

  rule load() > max_load -> DEF -= 5 | Deslocamento -= 3

@texto "Anotações do Investigador" [col1]
  "Veterano de investigações paranormais. Especialista em balística e rituais."
  - Caso Carpazinha: Sobrevivente do incidente na serralheria.
  - Pista ativa: Símbolo de Morte encontrado na mansão abandonada.

@slots "Coldres & Bolsos Rápidos" [col2, cols: 3]
  slot_1 "Fuzil de Precisão": 5/5
  slot_2 "Munição Extra": 3/3
  slot_3 "Bandagem Hemostática": 1/2
  slot_4 "Lanterna Tática" [state: filled]
  slot_5 [state: empty]
  slot_6 [state: empty]

@ability [col2]
  ability "Perito" [type: "Livre", cost: 2 PE]
    desc: "Gasta 2 PE para somar +1d6 em um teste de perícia treinada (Limite: {limite_pe} PE/turno)."

  ability "Mira de Elite" [type: "Movimento", active: false]
    desc: "Ao mirar com arma de fogo, adiciona +2 em Pontaria."
    when active -> Pontaria += 2

  spell "Decadência" [type: "Padrão", cost: 1 PE, range: "Toque", #morte]
    damage: 2d8 + 2
    desc: "Espirais de cinzas corroem o alvo."
    enhance "Discente" [cost: 2 PE, requires: "2º Círculo"]
      damage: 3d8 + 2
      desc: "Faz parte de um ataque corpo a corpo."
    enhance "Verdadeiro" [cost: 5 PE, requires: "3º Círculo"]
      damage: 4d8 + 4
      desc: "Afeta todos os inimigos em alcance curto."`,
  },

  storyteller_v5: {
    id: 'storyteller_v5',
    name: 'Carniçal / Vampiro (Storyteller d10 Pool)',
    system: 'Vampiro: A Máscara V5',
    paradigm: 'Parada de Sucessos (Xd10 >= 6) + Trilhas de Vitalidade + Relógio de Fome',
    source: `@meta "Viktor Nosferatu" [archetype: "Infiltrador", system: "Storyteller V5", theme: "red"]

@profile "Viktor Nosferatu" [col1, md]
  archetype: "Infiltrador"
  system: "Storyteller V5"

@attr [col1, list]
  Forca       := 3
  Destreza    := 4
  Vigor       := 3
  Carisma     := 1
  Manipulacao := 3
  Raciocinio  := 3

@stat [col1]
  Fome := 2
  Humanidade := 6
  Esquiva = Destreza + Atletismo

@res [col2]
  Vitalidade: track(Vigor + 3, states: [".", "/", "X"], current: 2)
  Vontade "Força de Vontade": track(6, states: [".", "/", "X"], current: 1)

@counter [col2, pie]
  fome_rel "Fome": 2/5 [pie, red]

@skill [col2, list, roll: (attr + self)d10 >= 6]
  Furtividade (Destreza) := 4
  Atletismo (Destreza)   := 2
  Briga (Forca)          := 3
  Intimidacao (Forca)    := 3
  Ocultismo (Raciocinio) := 2

@ability [col2]
  ability "Manto das Sombras" [type: "Passiva", !active, #disciplina]
    desc: "Adiciona +2 dados à parada de Furtividade enquanto ativo."
    when active -> Furtividade += 2

  action "Mordida Vampírica" [type: "Padrão"]
    test: (Forca + Briga)d10 >= 6
    damage: 2
    desc: "Causa 2 de dano Agravado e reduz 1 de Fome."`,
  },

  call_of_cthulhu: {
    id: 'call_of_cthulhu',
    name: 'Investigador (Call of Cthulhu d100)',
    system: 'Call of Cthulhu 7e',
    paradigm: 'Roll-Under Percentual (1d100 <= Perícia) + Limiares 1/2 e 1/5 + Tabelas de Dano',
    source: `@meta "Dra. Eleanor Vance" [archetype: "Antiquária", system: "Call of Cthulhu 7e", theme: "green"]

@profile "Dra. Eleanor Vance" [col1, md]
  archetype: "Antiquária"
  system: "Call of Cthulhu 7e"

@table build_table
  2..64    -> -2
  65..84   -> -1
  85..124  -> 0
  125..164 -> 1
  165..204 -> 2

@attr [col1, divided]
  FOR := 45 [bom: floor(self / 2), extremo: floor(self / 5)]
  CON := 50 [bom: floor(self / 2), extremo: floor(self / 5)]
  TAM := 55 [bom: floor(self / 2), extremo: floor(self / 5)]
  DES := 60 [bom: floor(self / 2), extremo: floor(self / 5)]
  INT := 80 [bom: floor(self / 2), extremo: floor(self / 5)]
  POD := 70 [bom: floor(self / 2), extremo: floor(self / 5)]

@stat [col1]
  Corpo = lookup(build_table, FOR + TAM)
  Movimento = (FOR < TAM && DES < TAM) ? 7 : 8

@res [col2]
  PV "Pontos de Vida": 10 / floor((CON + TAM) / 10) [red]
  Sanidade: 62 / POD                                [blue]
  Magia "Pontos de Magia": 14 / floor(POD / 5)      [purple]
  Sorte: counter(55)

@skill [col2, roll: 1d100 <= self]
  Biblioteca (INT)  := 75 [bom: floor(self / 2), extremo: floor(self / 5)]
  Ocultismo (INT)   := 60 [bom: floor(self / 2), extremo: floor(self / 5)]
  Encontrar (INT)   := 65 [bom: floor(self / 2), extremo: floor(self / 5)]
  ArmasDeFogo (DES) := 45 [bom: floor(self / 2), extremo: floor(self / 5)]
  Esquivar (DES)    = floor(DES / 2)

@ability [col2]
  action "Revólver .38" [type: "Padrão", range: "15m"]
    test: 1d100 <= ArmasDeFogo
    damage: 1d10
    desc: "Capacidade de 6 disparos."`,
  },

  savage_worlds: {
    id: 'savage_worlds',
    name: 'Caçador Selvagem (Step-Die + Explosão)',
    system: 'Savage Worlds (SWADE)',
    paradigm: 'Dados Escaláveis (d4..d12) + Dado Selvagem (d6!) + Aparar/Resistência + Bennies',
    source: `@meta "Jack Mercer" [archetype: "Pistoleiro", system: "Savage Worlds"]

@profile "Jack Mercer" [col1, sm]
  archetype: "Pistoleiro"
  system: "Savage Worlds"

@roll savage (trait_die)
  roll: max(trait_die, 1d6!)
  >= 8 -> "Sucesso com Ampliação!" [tier: "crit"]
  >= 4 -> "Sucesso (Alvo 4)"       [tier: "success"]
  < 4  -> "Falha"                  [tier: "fail"]

@attr [col1, cards]
  Agilidade := d8
  Astucia   := d6
  Espirito  := d8
  Forca     := d6
  Vigor     := d8

@stat [col1]
  Aparar = 2 + floor(Lutar / 2)
  Resistencia = 2 + floor(Vigor / 2)

@counter [col2, dots]
  bennies "Bennies": 3/3    [dots, amber]
  ferimentos "Ferimentos": 0/3 [segments, red]
  fadiga "Fadiga": 0/2      [segments, orange]

@skill [col2, roll: max(1d8!, 1d6!) + self]
  Atirar (Agilidade) := 2
  Lutar (Agilidade)  := 0
  Perceber (Astucia) := 1

@ability [col2]
  ability "Rápido no Gatilho" [type: "Passiva", #vantagem]
    desc: "Saca armas como ação livre e recebe +1 em Atirar."
    Atirar += 1

  action "Pacificador Colt .45" [type: "Padrão", range: "12/24/48"]
    test: max(1d8!, 1d6!) + Atirar
    damage: 2d6! + 1
    desc: "PA 1, Revólver de ação simples."`,
  },

  pbta_fate_narrative: {
    id: 'pbta_fate_narrative',
    name: 'Investigador Oculto (PbtA Moves + Fate Aspects + Anatomia)',
    system: 'Powered by the Apocalypse / Fate Hybrid',
    paradigm: 'Faixas 2d6 (<=6, 7..9, 10+) + Aspectos Invocáveis + Diagrama Anatômico',
    source: `@meta "Corvo" [archetype: "Ocultista Urbano", system: "PbtA / Narrative"]

@profile "Corvo" [col1, md]
  archetype: "Ocultista Urbano"
  desc: "Exorcista de becos que enxerga através do véu."

@roll pbta (mod)
  roll: 2d6 + mod
  >= 12  -> "Sucesso Avançado (12+)!" [tier: "crit"]
  10..11 -> "Sucesso Pleno (10+)"     [tier: "success"]
  7..9   -> "Sucesso Parcial (7-9): Escolha 1 custo" [tier: "partial"]
  <= 6   -> "Falha (6-): Marque XP, o Mestre age"    [tier: "fail"]

@attr [col1, list]
  Esperto    := 2
  Sorrateiro := 1
  Poderoso   := 0
  Estiloso   := -1

@stat [col1]
  Armadura := 1

@counter [col2, pie]
  harm "Relógio de Dano": 1/6 [pie, red]
  sorte "Sorte": 5/7          [segments, amber]
  destino "Destino": 3/3      [dots, purple]

@desc [col1]
  aspect "Conceito": "Exorcista de Becos" [!active] -> Esperto += 1
  tag "Visão Astral" [!active] -> Perceber += 1
  consequence "Costela Trincada" := -2 [active: false]

@skill [col2, roll: pbta(attr + self)]
  Perceber (Esperto) := 0
  Esgueirar (Sorrateiro) := 1

@ability [col2]
  move "Ler uma Situação" [type: "Movimento"]
    test: pbta(Esperto)
    desc: "Quando analisa uma cena sob pressão: 10+ receba 3 Domínio; 7-9 receba 1 Domínio."
    choices "Gaste 1 Domínio para perguntar:"
      - "Qual é a minha melhor rota de fuga?"
      - "Qual é a maior ameaça oculta aqui?"
      - "Quem aqui está mentindo ou controlado?"

@diagram "Anatomia" [full, layout: "humanoid", hit_roll: 1d10]
  node "Cabeca" "Cabeça" [hit: 1, mult: 2]
    PV: 6/6
    SP := 4
  node "Torso" "Torso" [hit: 2..6, mult: 1]
    PV: 14/14
    SP := 6
  node "Membros" "Membros" [hit: 7..10, mult: 1]
    PV: 8/8
    SP := 4`,
  },

  mausritter: {
    id: 'mausritter',
    name: 'Pip, o Guardião da Toca (Mausritter)',
    system: 'Mausritter',
    paradigm: 'Roll-Under d20 + Grade Física de Slots (Patas, Corpo, Mochila) + Fadiga & Condições em Espaços',
    source: `@meta "Pip, o Guardião da Toca" [archetype: "Rato Aventureiro", system: "Mausritter", level: 1, theme: "amber"]

# ==============================================================================
# ABA 1: RATO AVENTUREIRO
# ==============================================================================
@tab "Rato Aventureiro"

@profile "Pip" [col1, md]
  background: "Guarda da Toca"
  birthsign: "A Estrela"
  coat: "Marrom Rajado"
  look: "Cicatriz na orelha e capa de folha seca"
  level: 1
  xp: 0

@attr "Atributos do Rato" [col1, cards]
  FOR "Força"    := 10 [roll: "1d20 <= FOR", desc: "Resistência física, carga, escaladas e testes de vigor."]
  DES "Destreza" := 12 [roll: "1d20 <= DES", desc: "Agilidade, esquiva, corrida, furtividade e acrobacias."]
  VON "Vontade"  := 8  [roll: "1d20 <= VON", desc: "Força mental, moral, feitiços e resistência ao medo."]

@res "Recursos Vitais" [col2]
  HP "Pontos de Proteção": 4 / 6 [red]
  Grit "Determinação": 1 / 1     [purple]
  Pips "Pips Carregados": 45 / 250 [amber]

@stat "Progressão & Resistência" [col2]
  nivel "Nível" = level
  xp_proximo "XP para Nível 2" := 1000
  condicoes_ignoradas "Condições Ignoradas pelo Grit" = Grit

@desc "Condições e Estados Atuais" [col1]
  condicoes_info: "Condições ocupam slots na mochila até que o descanso adequado seja realizado."
  tag "Ferido" [active: false] -> FOR -= 2
  tag "Exausto" [active: false] -> DES -= 2
  tag "Assustado" [active: false] -> VON -= 2

@texto "Regras Rápidas de Mausritter" [col2]
  "Combate e Sobrevivência:"
  - Testes: Role 1d20. Se o resultado for menor ou igual ao atributo, você teve sucesso.
  - Dano: O dano reduz primeiro o HP. Quando o HP chega a 0, o dano excedente reduz a Força diretamente.
  - Morte: Se sua Força chegar a 0, o ratinho falece.

# ==============================================================================
# ABA 2: INVENTÁRIO & SLOTS
# ==============================================================================
@tab "Inventário & Slots"

@slots "Equipamento em Uso" [col1, cols: 2]
  main_paw "Pata Principal: Espada de Agulha" [state: filled]
  off_paw "Pata Secundária: Escudo de Botão" [state: filled]
  body_1 "Corpo: Armadura de Besouro" [state: filled, double]
  body_2 "Capa de Chuva" [state: filled]

@slots "Mochila (6 Espaços)" [col2, cols: 3]
  pack_1 "Ração Seca": 3/3
  pack_2 "Tochas de Fósforo": 4/6
  pack_3 "Corda de Barbante" [state: filled]
  pack_4 "Pederneira e Giz" [state: filled]
  pack_5 "Slot 5: Vazio" [state: empty]
  pack_6 "Slot 6: Vazio" [state: empty]

@inv "Detalhes dos Itens Carregados" [col1]
  unit = "slots"
  max_load = 10

  item "Espada de Agulha" [weight: 1, qty: 1, !equipped, #arma]
    desc: "Feita a partir de uma agulha de costura polida."
    action "Ataque com Espada" [type: "Principal"]
      damage: 1d6
      desc: "Dano físico direto. Dano excedente reduz Força."

  item "Escudo de Botão" [weight: 1, qty: 1, !equipped, #escudo]
    desc: "Botão de latão preso ao braço com barbante. Ignora 1 de dano."

  item "Armadura de Besouro" [weight: 2, qty: 1, !equipped, #armadura]
    desc: "Carapaça resistente que ocupa 2 espaços de corpo."

  item "Feitiço: Dardos de Centelha" [weight: 1, qty: 1, !carried, #magia]
    desc: "Pedra rúnica gravada que dispara fagulhas incandescentes."
    action "Disparar Fagulho" [type: "Feitiço"]
      damage: 1d6
      desc: "Cada 4..6 rolado no feitiço gera 1 Fadiga na mochila."

@texto "Cofre & Banco do Assentamento" [col2]
  "Tesouros guardados com segurança na Toca dos Ratos (Ecktown):"
  - Sementes Guardadas no Cofre: 320 pips
  - 1x Anel de Prata polido (vale 150 pips)
  - 2x Frascos de Mel Silvestre (cura total de Força após descanso)

# ==============================================================================
# ABA 3: MERCENÁRIOS & DIÁRIO
# ==============================================================================
@tab "Mercenários & Diário"

@slots "Mercenário: Bramble (Espadachim)" [col1, cols: 2]
  hire_paw1 "Pata Principal: Lança de Espinho" [state: filled]
  hire_paw2 "Pata Secundária: Escudo de Noz" [state: filled]
  hire_pack1 "Slot 1: Ração": 2/3
  hire_pack2 "Slot 2: Tocha": 3/6
  hire_pack3 "Slot 3: Vazio" [state: empty]
  hire_pack4 "Slot 4: Vazio" [state: empty]

@stat "Perfil do Mercenário (Bramble)" [col1]
  hire_tipo "Descrição": "Rato veterano caolho. Disposição Leal. Custo: 5 pips/dia."
  hire_str "Força"    := 9  [roll: "1d20 <= hire_str"]
  hire_dex "Destreza" := 11 [roll: "1d20 <= hire_dex"]
  hire_wil "Vontade"  := 7  [roll: "1d20 <= hire_wil"]
  hire_hp "HP": 3 / 4

@texto "Diário de Campanhas & Rumores" [col2]
  "Anotações de Exploração e Boatos:"
  - A Toca do Velho Carvalho: Há relatos de um gato caolho rondando as raízes ao anoitecer.
  - Rumor dos Sapos: O líder do pântano troca um mapa secreto por 50 pips ou comida fresca.
  - Missão Ativa: Recuperar a chave de cobre perdida no celeiro das corujas.`,
  },
};
