import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Condition } from '@/types/game';

const PRESET_CONDITIONS: Condition[] = [
  {
    name: 'Abalado',
    desc: 'O personagem sofre –1d20 em testes. Se ficar abalado novamente, em vez disso fica apavorado. Condição de medo.',
    color: 'purple',
  },
  {
    name: 'Agarrado',
    desc: 'O personagem fica desprevenido e imóvel, sofre –1d20 em testes de ataque e só pode atacar com armas leves. Um personagem fazendo um ataque à distância contra um alvo envolvido na manobra agarrar tem 50% de chance de acertar o alvo errado. Condição de paralisia.',
    color: 'red',
  },
  {
    name: 'Alquebrado',
    desc: 'O custo em pontos de esforço das habilidades e dos rituais do personagem aumenta em +1. Condição mental.',
    color: 'purple',
  },
  {
    name: 'Apavorado',
    desc: 'O personagem sofre –2d20 em testes de perícia e deve fugir da fonte do medo da maneira mais eficiente possível. Condição de medo.',
    color: 'purple',
  },
  {
    name: 'Asfixiado',
    desc: 'O personagem não pode respirar. Um personagem asfixiado pode prender seu fôlego por um total de rodadas igual ao seu Vigor e, a cada vez que sofre dano enquanto está nesta condição, reduz este valor em 1. Ao final de seu turno na última dessas rodadas, o personagem fica morrendo.',
    color: 'yellow',
  },
  {
    name: 'Atordoado',
    desc: 'O personagem fica desprevenido e não pode fazer ações. Condição mental.',
    color: 'yellow',
  },
  {
    name: 'Caído',
    desc: 'Deitado no chão. O personagem sofre –2d20 em ataques corpo a corpo e seu deslocamento é reduzido a 1,5m. Além disso, sofre –5 na Defesa contra ataques corpo a corpo, mas recebe +5 na Defesa contra ataques à distância.',
    color: 'yellow',
  },
  {
    name: 'Cego',
    desc: 'O personagem fica desprevenido e lento, não pode fazer testes de Percepção para observar e sofre –2d20 em testes de perícias baseadas em Agilidade ou Força. Todos os alvos de seus ataques recebem camuflagem total. Condição de sentidos.',
    color: 'yellow',
  },
  {
    name: 'Confuso',
    desc: 'O personagem comporta-se de modo aleatório. Role 1d6 no início de seus turnos: 1) Movimenta-se em direção aleatória; 2-3) Não pode fazer ações; 4-5) Ataca o ser mais próximo; 6) Age normalmente. Condição mental.',
    color: 'purple',
  },
  {
    name: 'Debilitado',
    desc: 'O personagem sofre –2d20 em testes de Agilidade, Força e Vigor. Se o personagem ficar debilitado novamente, em vez disso fica inconsciente.',
    color: 'red',
  },
  {
    name: 'Desprevenido',
    desc: 'Despreparado para reagir. O personagem sofre –5 na Defesa e –1d20 Reflexos. Você fica desprevenido contra inimigos que não possa perceber.',
    color: 'yellow',
  },
  { name: 'Doente', desc: 'Sob efeito de uma doença.', color: 'green' },
  {
    name: 'Em Chamas',
    desc: 'O personagem está pegando fogo. No início de seus turnos, sofre 1d6 pontos de dano de fogo. O personagem pode gastar uma ação padrão para apagar o fogo com as mãos.',
    color: 'red',
  },
  {
    name: 'Enjoado',
    desc: 'O personagem só pode realizar uma ação padrão ou de movimento (não ambas) por rodada.',
    color: 'green',
  },
  {
    name: 'Enredado',
    desc: 'O personagem fica lento, vulnerável e sofre –1d20 em testes de ataque. Condição de paralisia.',
    color: 'yellow',
  },
  {
    name: 'Envenenado',
    desc: 'O efeito desta condição varia de acordo com o veneno. Pode ser outra condição ou dano recorrente.',
    color: 'green',
  },
  {
    name: 'Esmorecido',
    desc: 'O personagem sofre –2d20 em testes de Intelecto e Presença. Condição mental.',
    color: 'purple',
  },
  {
    name: 'Exausto',
    desc: 'O personagem fica debilitado, lento e vulnerável. Se ficar exausto novamente, em vez disso fica inconsciente. Condição de fadiga.',
    color: 'red',
  },
  {
    name: 'Fascinado',
    desc: 'Com a atenção presa em alguma coisa. O personagem sofre –2d20 em Percepção e não pode fazer ações, exceto observar aquilo que o fascinou. Condição mental.',
    color: 'purple',
  },
  {
    name: 'Fatigado',
    desc: 'O personagem fica fraco e vulnerável. Se o personagem ficar fatigado novamente, em vez disso fica exausto. Condição de fadiga.',
    color: 'red',
  },
  {
    name: 'Fraco',
    desc: 'O personagem sofre –1d20 em testes de Agilidade, Físico e Vigor. Se ficar fraco novamente, em vez disso fica debilitado.',
    color: 'red',
  },
  {
    name: 'Frustrado',
    desc: 'O personagem sofre –1d20 em testes de Intelecto e Presença. Se ficar frustrado novamente, em vez disso fica esmorecido. Condição mental.',
    color: 'purple',
  },
  {
    name: 'Imóvel',
    desc: 'Todas as formas de deslocamento do personagem são reduzidas a 0m. Condição de paralisia.',
    color: 'yellow',
  },
  {
    name: 'Inconsciente',
    desc: 'O personagem fica indefeso e não pode fazer ações, incluindo reações.',
    color: 'red',
  },
  {
    name: 'Indefeso',
    desc: 'O personagem é considerado desprevenido, mas sofre –10 na Defesa, falha automaticamente em testes de Reflexos e pode sofrer golpes de misericórdia.',
    color: 'red',
  },
  {
    name: 'Lento',
    desc: 'Todas as formas de deslocamento do personagem são reduzidas à metade (arredonde para baixo) e não pode correr ou fazer investidas. Condição de paralisia.',
    color: 'yellow',
  },
  {
    name: 'Machucado',
    desc: 'O personagem tem menos da metade de seus pontos de vida totais.',
    color: 'red',
  },
  {
    name: 'Morrendo',
    desc: 'Com 0 pontos de vida. Fica inconsciente e morre após três rodadas se não estabilizar.',
    color: 'red',
  },
  {
    name: 'Ofuscado',
    desc: 'O personagem sofre –1d20 em testes de ataque e de Percepção. Condição de sentidos.',
    color: 'yellow',
  },
  {
    name: 'Paralisado',
    desc: 'O personagem fica imóvel e indefeso e só pode realizar ações puramente mentais. Condição de paralisia.',
    color: 'red',
  },
  {
    name: 'Pasmo',
    desc: 'O personagem não pode fazer ações. Condição mental.',
    color: 'purple',
  },
  {
    name: 'Petrificado',
    desc: 'O personagem fica inconsciente e recebe resistência a dano 10.',
    color: 'yellow',
  },
  {
    name: 'Sangrando',
    desc: 'Com um ferimento aberto. No início de seus turnos, o personagem deve fazer um teste de Vigor (DT 20) ou perde 1d6 PV.',
    color: 'red',
  },
  {
    name: 'Surdo',
    desc: 'O personagem não pode ouvir, sofre –2d20 em Iniciativa e ruim p/ rituais. Condição de sentidos.',
    color: 'yellow',
  },
  {
    name: 'Surpreendido',
    desc: 'Não ciente de seus inimigos. O personagem fica desprevenido e não pode fazer ações.',
    color: 'yellow',
  },
  {
    name: 'Vulnerável',
    desc: 'O personagem sofre –5 na Defesa.',
    color: 'yellow',
  },
];

interface ConditionManagerProps {
  conditions: Condition[];
  onUpdate: (conditions: Condition[]) => void;
}

export default function ConditionManager({
  conditions,
  onUpdate,
}: ConditionManagerProps) {
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const addCondition = (cond: Condition) => {
    onUpdate([...conditions, { ...cond }]);
  };

  const removeCondition = (idx: number) => {
    onUpdate(conditions.filter((_, i) => i !== idx));
  };

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    addCondition({ name: customName, desc: customDesc, color: 'red' });
    setCustomName('');
    setCustomDesc('');
  };

  const colorMap: Record<string, string> = {
    red: '#e55757',
    yellow: '#ffd700',
    green: '#04d361',
    purple: '#8257e5',
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {conditions.map((c, idx) => (
          <div
            key={idx}
            className="flex justify-between items-start bg-black/20 p-2 rounded border border-[#323238] border-l-4"
            style={{ borderLeftColor: colorMap[c.color] || c.color }}
          >
            <div>
              <strong className="text-sm text-[#e1e1e6] block">{c.name}</strong>
              <span className="text-xs text-[#a8a8b3] block">{c.desc}</span>
            </div>
            <button
              className="text-[#a8a8b3] hover:text-[#e55757]"
              onClick={() => removeCondition(idx)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {conditions.length === 0 && (
          <span className="text-xs text-[#a8a8b3]">
            Nenhuma condição aplicada.
          </span>
        )}
      </div>

      <div className="flex gap-2 items-center">
        <Select
          value={selectedPreset}
          onValueChange={(val) => setSelectedPreset(val as string)}
        >
          <SelectTrigger className="w-full bg-[#121214] border-[#323238] focus:ring-[#8257e5] text-[#e1e1e6]">
            <SelectValue placeholder="Carregar do Compêndio..." />
          </SelectTrigger>
          <SelectContent className="bg-[#202024] border-[#323238] text-[#e1e1e6] max-h-[300px]">
            {PRESET_CONDITIONS.map((p) => (
              <SelectItem
                key={p.name}
                value={p.name}
                className="hover:bg-[#8257e5] cursor-pointer"
              >
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            if (selectedPreset) {
              const preset = PRESET_CONDITIONS.find(
                (p) => p.name === selectedPreset,
              );
              if (preset) {
                addCondition(preset);
                setSelectedPreset('');
              }
            }
          }}
          variant="outline"
          className="bg-transparent border-[#323238] hover:bg-white/5 hover:text-white shrink-0"
        >
          Adicionar
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Input
            placeholder="Nova Condição..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="bg-[#121214] border-[#323238] h-8 text-sm focus-visible:ring-[#8257e5] text-[#e1e1e6]"
          />
          <Input
            placeholder="Descrição..."
            value={customDesc}
            onChange={(e) => setCustomDesc(e.target.value)}
            className="bg-[#121214] border-[#323238] h-8 text-sm focus-visible:ring-[#8257e5] text-[#e1e1e6]"
          />
        </div>
        <Button
          onClick={handleAddCustom}
          variant="outline"
          className="bg-transparent border-[#323238] h-[72px] hover:bg-white/5 hover:text-white"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
