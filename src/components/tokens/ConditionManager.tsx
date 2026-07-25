import { useState } from 'react';
import { Plus, Trash2, Hourglass, Ban, Skull, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Condition } from '@/types/game';

const PRESET_CONDITIONS: Condition[] = [
  { name: 'Fora de Combate', desc: 'Sempre pulado na iniciativa.', color: 'gray', type: 'out_of_combat' },
  { name: 'Atordoado', desc: 'Pula a vez, não pode fazer ações.', color: 'yellow', type: 'skip_turn', durationTurns: 1 },
  { name: 'Abalado', desc: '–1d20 em testes.', color: 'purple' },
  { name: 'Agarrado', desc: 'Desprevenido, imóvel, –1d20 ataque.', color: 'red' },
  { name: 'Alquebrado', desc: 'Custo de esforço/rituais +1.', color: 'purple' },
  { name: 'Apavorado', desc: '–2d20 testes, deve fugir.', color: 'purple' },
  { name: 'Caído', desc: 'Deslocamento reduzido, –2d20 ataque corpo a corpo.', color: 'yellow' },
  { name: 'Cego', desc: 'Desprevenido e lento. –2d20 Agi/For.', color: 'yellow' },
  { name: 'Debilitado', desc: '–2d20 Agi, For e Vig.', color: 'red' },
  { name: 'Desprevenido', desc: '–5 Defesa, –1d20 Reflexos.', color: 'yellow' },
  { name: 'Em Chamas', desc: '1d6 fogo/turno.', color: 'red' },
  { name: 'Enredado', desc: 'Lento, vulnerável, –1d20 ataque.', color: 'yellow' },
  { name: 'Envenenado', desc: 'Efeito contínuo de veneno.', color: 'green' },
  { name: 'Esmorecido', desc: '–2d20 Int e Pre.', color: 'purple' },
  { name: 'Exausto', desc: 'Debilitado, lento e vulnerável.', color: 'red' },
  { name: 'Fascinado', desc: 'Não faz ações além de observar.', color: 'purple', type: 'skip_turn' },
  { name: 'Fatigado', desc: 'Fraco e vulnerável.', color: 'red' },
  { name: 'Fraco', desc: '–1d20 Agi, For e Vig.', color: 'red' },
  { name: 'Frustrado', desc: '–1d20 Int e Pre.', color: 'purple' },
  { name: 'Imóvel', desc: 'Deslocamento reduzido a 0m.', color: 'yellow' },
  { name: 'Inconsciente', desc: 'Indefeso, não pode agir.', color: 'red', type: 'skip_turn' },
  { name: 'Indefeso', desc: 'Desprevenido, –10 Defesa.', color: 'red' },
  { name: 'Lento', desc: 'Deslocamento metade, não corre.', color: 'yellow' },
  { name: 'Machucado', desc: '< Metade dos PV totais.', color: 'red' },
  { name: 'Morrendo', desc: '0 PV, inconsciente, morre em 3 rodadas.', color: 'red', type: 'skip_turn', durationTurns: 3 },
  { name: 'Ofuscado', desc: '–1d20 ataque e Percepção.', color: 'yellow' },
  { name: 'Paralisado', desc: 'Imóvel, indefeso, apenas ações mentais.', color: 'red', type: 'skip_turn' },
  { name: 'Pasmo', desc: 'Não pode fazer ações.', color: 'purple', type: 'skip_turn', durationTurns: 1 },
  { name: 'Petrificado', desc: 'Inconsciente, Resistência Dano 10.', color: 'yellow', type: 'skip_turn' },
  { name: 'Sangrando', desc: 'Teste de Vig ou 1d6 PV/turno.', color: 'red' },
  { name: 'Surdo', desc: '–2d20 Iniciativa e ruim p/ rituais.', color: 'yellow' },
  { name: 'Surpreendido', desc: 'Desprevenido e não pode agir.', color: 'yellow', type: 'skip_turn', durationTurns: 1 },
  { name: 'Vulnerável', desc: '–5 Defesa.', color: 'yellow' }
];

interface ConditionManagerProps {
  conditions: Condition[];
  onUpdate: (conditions: Condition[]) => void;
}

export default function ConditionManager({ conditions, onUpdate }: ConditionManagerProps) {
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  
  // Custom modifiers state
  const [customType, setCustomType] = useState<string>('none');
  const [customDuration, setCustomDuration] = useState<string>('');

  const addCondition = (cond: Condition) => {
    onUpdate([...conditions, { ...cond, id: crypto.randomUUID() }]);
  };

  const removeCondition = (idx: number) => {
    onUpdate(conditions.filter((_, i) => i !== idx));
  };

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    
    let type: Condition['type'] = undefined;
    if (customType !== 'none') type = customType as Condition['type'];
    
    const durationTurns = customDuration ? parseInt(customDuration, 10) : undefined;

    addCondition({ 
      name: customName, 
      desc: customDesc, 
      color: 'red',
      type,
      durationTurns: isNaN(durationTurns as number) ? undefined : durationTurns
    });
    
    setCustomName('');
    setCustomDesc('');
    setCustomType('none');
    setCustomDuration('');
  };

  const colorMap: Record<string, string> = {
    red: '#e55757',
    yellow: '#ffd700',
    green: '#04d361',
    purple: '#8257e5',
    gray: '#a8a8b3'
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'skip_turn': return <Ban className="w-3 h-3 text-red-400" title="Pula a Vez" />;
      case 'out_of_combat': return <Skull className="w-3 h-3 text-gray-400" title="Fora de Combate" />;
      case 'stat_modifier': return <Activity className="w-3 h-3 text-blue-400" title="Modificador de Status" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Lista de Condições */}
      <div className="space-y-2">
        {conditions.map((c, idx) => (
          <div
            key={c.id || idx}
            className="flex justify-between items-center bg-black/20 p-2 rounded border border-[#323238] border-l-4"
            style={{ borderLeftColor: colorMap[c.color] || c.color }}
          >
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2">
                <strong className="text-sm text-[#e1e1e6] truncate">{c.name}</strong>
                {getTypeIcon(c.type)}
                {c.durationTurns !== undefined && (
                  <span className="flex items-center gap-1 text-[10px] bg-[#323238] text-[#a8a8b3] px-1.5 py-0.5 rounded-full" title="Duração (Turnos)">
                    <Hourglass className="w-3 h-3" /> {c.durationTurns}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[#a8a8b3] block truncate" title={c.desc}>{c.desc}</span>
            </div>
            <button className="text-[#a8a8b3] hover:text-[#e55757] shrink-0" onClick={() => removeCondition(idx)}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {conditions.length === 0 && <span className="text-xs text-[#a8a8b3]">Nenhuma condição aplicada.</span>}
      </div>

      {/* Adicionar Predefinido */}
      <div className="flex gap-2 items-center bg-[#121214] p-2 rounded-lg border border-[#323238]">
        <Select value={selectedPreset} onValueChange={(val) => setSelectedPreset(val as string)}>
          <SelectTrigger className="w-full bg-transparent border-none focus:ring-0 text-[#e1e1e6] h-8 text-sm">
            <SelectValue placeholder="Condição Predefinida..." />
          </SelectTrigger>
          <SelectContent className="bg-[#202024] border-[#323238] text-[#e1e1e6] max-h-[300px]">
            {PRESET_CONDITIONS.map(p => (
              <SelectItem key={p.name} value={p.name} className="hover:bg-[#8257e5] cursor-pointer text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorMap[p.color] }} />
                  {p.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Duração para o Preset */}
        <Input 
          type="number"
          placeholder="♾️"
          title="Duração em Turnos"
          value={customDuration}
          onChange={(e) => setCustomDuration(e.target.value)}
          className="w-12 h-8 text-center text-xs bg-[#202024] border-[#323238] px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />

        <Button 
          onClick={() => {
            if (selectedPreset) {
              const preset = PRESET_CONDITIONS.find(p => p.name === selectedPreset);
              if (preset) {
                const durationTurns = customDuration ? parseInt(customDuration, 10) : preset.durationTurns;
                addCondition({ 
                  ...preset, 
                  durationTurns: isNaN(durationTurns as number) ? undefined : durationTurns
                });
                setSelectedPreset('');
                setCustomDuration('');
              }
            }
          }}
          size="sm"
          variant="outline"
          className="border-[#323238] bg-[#202024] hover:bg-[#8257e5] hover:text-white hover:border-[#8257e5] shrink-0 h-8"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Condição Customizada */}
      <div className="bg-[#121214] p-2 rounded-lg border border-[#323238] flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            placeholder="Nome (Nova)..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="flex-1 bg-transparent border-[#323238] h-8 text-sm text-[#e1e1e6]"
          />
          <Input
            placeholder="Desc..."
            value={customDesc}
            onChange={(e) => setCustomDesc(e.target.value)}
            className="flex-1 bg-transparent border-[#323238] h-8 text-sm text-[#e1e1e6]"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Select value={customType} onValueChange={setCustomType}>
            <SelectTrigger className="flex-1 bg-[#202024] border-[#323238] text-[#e1e1e6] h-8 text-xs">
              <SelectValue placeholder="Efeito no Turno" />
            </SelectTrigger>
            <SelectContent className="bg-[#202024] border-[#323238] text-[#e1e1e6]">
              <SelectItem value="none">Normal</SelectItem>
              <SelectItem value="skip_turn">Pula Turno</SelectItem>
              <SelectItem value="out_of_combat">Fora de Combate</SelectItem>
              <SelectItem value="stat_modifier">Modificador (+/-)</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleAddCustom} size="sm" variant="outline" className="border-[#323238] hover:bg-white/5 hover:text-white shrink-0 h-8">
            Adicionar Custom
          </Button>
        </div>
      </div>
    </div>
  );
}
