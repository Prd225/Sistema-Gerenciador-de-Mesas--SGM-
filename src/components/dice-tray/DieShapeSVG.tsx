import { type DieFaceCount } from '@/store/useDiceTrayStore';

interface DieShapeSVGProps {
  faces: DieFaceCount;
  color: string;
  isCrit: boolean;
  isFumble: boolean;
  isRolling: boolean;
  value: number | string;
  sideFaces?: number[];
  rotX?: number; // Ângulo de pitch em graus (-35..35)
  rotY?: number; // Ângulo de yaw em graus (-35..35)
  size?: number;
}

export default function DieShapeSVG({
  faces,
  color,
  isCrit,
  isFumble,
  isRolling,
  value,
  sideFaces = [],
  rotX = 0,
  rotY = 0,
  size = 84,
}: DieShapeSVGProps) {
  const gradientId = `die-grad-${faces}-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  // Cores dinâmicas para bordas e destaques (sem emojis nem brilhos artificiais)
  const strokeColor = isCrit
    ? '#fbbf24'
    : isFumble
    ? '#ef4444'
    : 'rgba(255, 255, 255, 0.35)';

  const strokeWidth = isCrit || isFumble ? 2.2 : 1.3;

  const numberColor = isCrit
    ? '#fde047'
    : isFumble
    ? '#f87171'
    : isRolling
    ? '#e9d5ff'
    : '#ffffff';

  const sideNumberColor = 'rgba(255, 255, 255, 0.38)';

  // Deslocamento de perspectiva pseudo-3D normalizado (-1..+1)
  const tiltX = Math.max(-1, Math.min(1, rotY / 32));
  const tiltY = Math.max(-1, Math.min(1, rotX / 32));

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="overflow-visible select-none pointer-events-none"
    >
      <defs>
        {/* Gradiente principal da resina do dado que reage à inclinação 3D */}
        <linearGradient
          id={gradientId}
          x1={`${Math.max(0, 20 - tiltX * 25)}%`}
          y1={`${Math.max(0, 20 - tiltY * 25)}%`}
          x2={`${Math.min(100, 80 - tiltX * 25)}%`}
          y2={`${Math.min(100, 80 - tiltY * 25)}%`}
        >
          <stop offset="0%" stopColor={color} stopOpacity={0.92} />
          <stop offset="50%" stopColor={color} stopOpacity={0.65} />
          <stop offset="100%" stopColor="#0c0d11" stopOpacity={0.95} />
        </linearGradient>

        {/* Gradientes de iluminação das facetas */}
        <linearGradient id="facet-light" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0.03} />
        </linearGradient>

        <linearGradient id="facet-dark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#000000" stopOpacity={0.08} />
          <stop offset="100%" stopColor="#000000" stopOpacity={0.48} />
        </linearGradient>

        {/* Filtro de sombra no número para máxima nitidez */}
        <filter id="num-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.95" />
        </filter>
      </defs>

      {/* D4: Piramidal / Tetraedro (3 Facetas que se movem com o ápice em perspectiva) */}
      {faces === 4 && (() => {
        const apexX = 50 + tiltX * 10;
        const apexY = 58 + tiltY * 10;

        return (
          <g>
            {/* Silhueta triangular externa */}
            <polygon
              points="50,6 94,88 6,88"
              fill={`url(#${gradientId})`}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {/* Faceta Esquerda */}
            <polygon points={`50,6 ${apexX},${apexY} 6,88`} fill="url(#facet-light)" opacity={0.55} />
            {/* Faceta Direita */}
            <polygon points={`50,6 94,88 ${apexX},${apexY}`} fill="url(#facet-dark)" opacity={0.45} />
            {/* Faceta Inferior */}
            <polygon points={`6,88 ${apexX},${apexY} 94,88`} fill="url(#facet-light)" opacity={0.3} />

            {/* Linhas de crista internas unindo o ápice às pontas */}
            <line x1="50" y1="6" x2={apexX} y2={apexY} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
            <line x1="6" y1="88" x2={apexX} y2={apexY} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
            <line x1="94" y1="88" x2={apexX} y2={apexY} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />

            {/* Número na faceta esquerda (visível em rotação) */}
            <text
              x={32 + tiltX * 4}
              y={52 + tiltY * 4}
              textAnchor="middle"
              fill={sideNumberColor}
              fontSize="13"
              fontWeight="bold"
              fontFamily="monospace, sans-serif"
            >
              {sideFaces[0] ?? 1}
            </text>

            {/* Número na faceta direita (visível em rotação) */}
            <text
              x={68 + tiltX * 4}
              y={52 + tiltY * 4}
              textAnchor="middle"
              fill={sideNumberColor}
              fontSize="13"
              fontWeight="bold"
              fontFamily="monospace, sans-serif"
            >
              {sideFaces[1] ?? 3}
            </text>

            {/* Número Principal na Base/Centro */}
            <text
              x={50 + tiltX * 5}
              y={76 + tiltY * 4}
              textAnchor="middle"
              dominantBaseline="central"
              fill={numberColor}
              fontSize="24"
              fontWeight="900"
              fontFamily="monospace, sans-serif"
              filter="url(#num-shadow)"
            >
              {value}
            </text>
          </g>
        );
      })()}

      {/* D6: Cubo 3D com chanfros e faces laterais visíveis conforme inclinação */}
      {faces === 6 && (() => {
        const fx = 14 + tiltX * 8;
        const fy = 14 + tiltY * 8;
        const fw = 72;
        const fh = 72;

        return (
          <g>
            {/* Extrusão 3D de fundo */}
            <rect
              x="10"
              y="10"
              width="80"
              height="80"
              rx="14"
              fill="#090a0d"
              opacity={0.7}
            />

            {/* Face frontal com chanfro */}
            <rect
              x={fx}
              y={fy}
              width={fw}
              height={fh}
              rx="12"
              fill={`url(#${gradientId})`}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* Aresta chanfrada de profundidade */}
            <rect
              x={fx + 4}
              y={fy + 4}
              width={fw - 8}
              height={fh - 8}
              rx="9"
              fill="none"
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="0.9"
            />

            {/* Número Principal */}
            <text
              x={fx + fw / 2}
              y={fy + fh / 2 + 1}
              textAnchor="middle"
              dominantBaseline="central"
              fill={numberColor}
              fontSize="30"
              fontWeight="900"
              fontFamily="monospace, sans-serif"
              filter="url(#num-shadow)"
            >
              {value}
            </text>
          </g>
        );
      })()}

      {/* D8: Octaedro / Diamante com faceta central e facetas periféricas móveis */}
      {faces === 8 && (() => {
        const cx = 50 + tiltX * 7;
        const cy = 20 + tiltY * 7;
        const rx = 76 + tiltX * 6;
        const ry = 68 + tiltY * 6;
        const lx = 24 + tiltX * 6;
        const ly = 68 + tiltY * 6;

        return (
          <g>
            {/* Silhueta externa em diamante */}
            <polygon
              points="50,4 94,50 50,96 6,50"
              fill={`url(#${gradientId})`}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />

            {/* Faceta triangular frontal móvel */}
            <polygon
              points={`${cx},${cy} ${rx},${ry} ${lx},${ly}`}
              fill="url(#facet-light)"
              opacity={0.45}
              stroke={strokeColor}
              strokeWidth="0.9"
              strokeOpacity={0.6}
            />

            {/* Facetas periféricas sombreadas */}
            <polygon points={`50,4 ${cx},${cy} 6,50`} fill="url(#facet-light)" opacity={0.3} />
            <polygon points={`50,4 ${cx},${cy} 94,50`} fill="url(#facet-dark)" opacity={0.4} />
            <polygon points={`6,50 ${lx},${ly} 50,96`} fill="url(#facet-light)" opacity={0.25} />
            <polygon points={`94,50 ${rx},${ry} 50,96`} fill="url(#facet-dark)" opacity={0.5} />

            {/* Linhas de crista */}
            <line x1="50" y1="4" x2={cx} y2={cy} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
            <line x1="94" y1="50" x2={rx} y2={ry} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
            <line x1="6" y1="50" x2={lx} y2={ly} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
            <line x1="50" y1="96" x2={50 + tiltX * 5} y2={ly} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />

            {/* Números nas facetas laterais durante o movimento */}
            <text x="50" y={cy - 5} textAnchor="middle" fill={sideNumberColor} fontSize="11" fontWeight="bold">
              {sideFaces[0] ?? 4}
            </text>
            <text x="24" y="60" textAnchor="middle" fill={sideNumberColor} fontSize="11" fontWeight="bold">
              {sideFaces[1] ?? 7}
            </text>
            <text x="76" y="60" textAnchor="middle" fill={sideNumberColor} fontSize="11" fontWeight="bold">
              {sideFaces[2] ?? 2}
            </text>

            {/* Número Principal no Centro */}
            <text
              x={50 + tiltX * 6}
              y={51 + tiltY * 6}
              textAnchor="middle"
              dominantBaseline="central"
              fill={numberColor}
              fontSize="26"
              fontWeight="900"
              fontFamily="monospace, sans-serif"
              filter="url(#num-shadow)"
            >
              {value}
            </text>
          </g>
        );
      })()}

      {/* D10 & D100: Formato de Pipa / Deltoedro Autêntico (Idêntico à foto de referência anexada) */}
      {(faces === 10 || faces === 100) && (() => {
        // Coordenadas da faceta central em formato de pipa com distorção 3D
        const topX = 50 + tiltX * 4;
        const topY = 4;
        const rightX = 72 + tiltX * 7;
        const rightY = 48 + tiltY * 6;
        const botX = 50 + tiltX * 4;
        const botY = 80 + tiltY * 7;
        const leftX = 28 + tiltX * 7;
        const leftY = 48 + tiltY * 6;

        return (
          <g>
            {/* Silhueta externa de 4 pontas (deltoedro autêntico em pipa com ápice superior e inferior nítidos) */}
            <polygon
              points="50,4 92,48 50,96 8,48"
              fill={`url(#${gradientId})`}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />

            {/* Faceta frontal em forma de pipa central onde repousa o número */}
            <polygon
              points={`${topX},${topY} ${rightX},${rightY} ${botX},${botY} ${leftX},${leftY}`}
              fill="url(#facet-light)"
              opacity={0.42}
              stroke={strokeColor}
              strokeWidth="1"
              strokeOpacity={0.65}
            />

            {/* Faceta Superior-Esquerda com sombreamento */}
            <polygon
              points={`${topX},${topY} ${leftX},${leftY} 8,48`}
              fill="url(#facet-light)"
              opacity={0.35}
            />
            {/* Faceta Superior-Direita com sombreamento */}
            <polygon
              points={`${topX},${topY} ${rightX},${rightY} 92,48`}
              fill="url(#facet-dark)"
              opacity={0.35}
            />
            {/* Faceta Inferior-Esquerda com sombreamento */}
            <polygon
              points={`${leftX},${leftY} ${botX},${botY} 50,96 8,48`}
              fill="url(#facet-light)"
              opacity={0.2}
            />
            {/* Faceta Inferior-Direita com sombreamento */}
            <polygon
              points={`${rightX},${rightY} ${botX},${botY} 50,96 92,48`}
              fill="url(#facet-dark)"
              opacity={0.48}
            />

            {/* Linha de crista inferior conectando ao ápice de baixo */}
            <line
              x1={botX}
              y1={botY}
              x2="50"
              y2="96"
              stroke={strokeColor}
              strokeWidth={1.1}
              strokeOpacity={0.65}
            />

            {/* Números nas facetas laterais (inclinados nas facetas como no dado real fotografado) */}
            {/* Faceta Superior-Esquerda: número inclinado */}
            <g transform={`translate(${24 + tiltX * 4}, ${30 + tiltY * 4}) rotate(-42)`}>
              <text textAnchor="middle" dominantBaseline="central" fill={sideNumberColor} fontSize="11" fontWeight="bold">
                {sideFaces[0] ?? 2}
              </text>
            </g>

            {/* Faceta Superior-Direita: número inclinado */}
            <g transform={`translate(${76 + tiltX * 4}, ${30 + tiltY * 4}) rotate(42)`}>
              <text textAnchor="middle" dominantBaseline="central" fill={sideNumberColor} fontSize="11" fontWeight="bold">
                {sideFaces[1] ?? 6}
              </text>
            </g>

            {/* Faceta Inferior-Esquerda: número inclinado */}
            <g transform={`translate(${26 + tiltX * 4}, ${68 + tiltY * 4}) rotate(-25)`}>
              <text textAnchor="middle" dominantBaseline="central" fill={sideNumberColor} fontSize="10" fontWeight="bold">
                {sideFaces[2] ?? 7}
              </text>
            </g>

            {/* Faceta Inferior-Direita: número inclinado */}
            <g transform={`translate(${74 + tiltX * 4}, ${68 + tiltY * 4}) rotate(25)`}>
              <text textAnchor="middle" dominantBaseline="central" fill={sideNumberColor} fontSize="10" fontWeight="bold">
                {sideFaces[3] ?? 3}
              </text>
            </g>

            {/* Número Principal na Faceta Central (fonte nítida e contrastada) */}
            <text
              x={50 + tiltX * 6}
              y={49 + tiltY * 6}
              textAnchor="middle"
              dominantBaseline="central"
              fill={numberColor}
              fontSize={faces === 100 ? '21' : '26'}
              fontWeight="900"
              fontFamily="monospace, sans-serif"
              filter="url(#num-shadow)"
            >
              {value}
            </text>
          </g>
        );
      })()}

      {/* D12: Dodecaedro (Decágono com Pentágono Regular Central Móvel e Facetas Periféricas) */}
      {faces === 12 && (() => {
        const v0 = { x: 50 + tiltX * 7, y: 19 + tiltY * 7 };
        const v1 = { x: 80 + tiltX * 7, y: 41 + tiltY * 7 };
        const v2 = { x: 69 + tiltX * 7, y: 78 + tiltY * 7 };
        const v3 = { x: 31 + tiltX * 7, y: 78 + tiltY * 7 };
        const v4 = { x: 20 + tiltX * 7, y: 41 + tiltY * 7 };

        return (
          <g>
            {/* Decágono exterior */}
            <polygon
              points="50,4 78,13 95,37 95,67 78,91 50,96 22,91 5,67 5,37 22,13"
              fill={`url(#${gradientId})`}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />

            {/* Pentágono regular central móvel */}
            <polygon
              points={`${v0.x},${v0.y} ${v1.x},${v1.y} ${v2.x},${v2.y} ${v3.x},${v3.y} ${v4.x},${v4.y}`}
              fill="url(#facet-light)"
              opacity={0.45}
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeOpacity={0.65}
            />

            {/* Arestas conectando os vértices do pentágono aos vértices externos */}
            <line x1={v0.x} y1={v0.y} x2="50" y2="4" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.5} />
            <line x1={v1.x} y1={v1.y} x2="95" y2="37" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.5} />
            <line x1={v2.x} y1={v2.y} x2="78" y2="91" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.5} />
            <line x1={v3.x} y1={v3.y} x2="22" y2="91" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.5} />
            <line x1={v4.x} y1={v4.y} x2="5" y2="37" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.5} />

            {/* Números nas facetas periféricas (como no d12 azul da foto anexada) */}
            <text x="50" y="13" textAnchor="middle" fill={sideNumberColor} fontSize="9" fontWeight="bold">
              {sideFaces[0] ?? 5}
            </text>
            <text x="84" y="32" textAnchor="middle" fill={sideNumberColor} fontSize="9" fontWeight="bold">
              {sideFaces[1] ?? 8}
            </text>
            <text x="76" y="84" textAnchor="middle" fill={sideNumberColor} fontSize="9" fontWeight="bold">
              {sideFaces[2] ?? 1}
            </text>
            <text x="24" y="84" textAnchor="middle" fill={sideNumberColor} fontSize="9" fontWeight="bold">
              {sideFaces[3] ?? 11}
            </text>
            <text x="16" y="32" textAnchor="middle" fill={sideNumberColor} fontSize="9" fontWeight="bold">
              {sideFaces[4] ?? 3}
            </text>

            {/* Número Principal no Pentágono Central */}
            <text
              x={50 + tiltX * 7}
              y={52 + tiltY * 7}
              textAnchor="middle"
              dominantBaseline="central"
              fill={numberColor}
              fontSize="26"
              fontWeight="900"
              fontFamily="monospace, sans-serif"
              filter="url(#num-shadow)"
            >
              {value}
            </text>
          </g>
        );
      })()}

      {/* D20: Icosaedro (Hexágono com Triângulo Equilátero Central Móvel e Facetas Adjacentes) */}
      {faces === 20 && (() => {
        const t1 = { x: 50 + tiltX * 8, y: 20 + tiltY * 8 };
        const t2 = { x: 80 + tiltX * 7, y: 72 + tiltY * 7 };
        const t3 = { x: 20 + tiltX * 7, y: 72 + tiltY * 7 };

        return (
          <g>
            {/* Silhueta hexagonal externa */}
            <polygon
              points="50,4 92,26 92,74 50,96 8,74 8,26"
              fill={`url(#${gradientId})`}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />

            {/* Triângulo equilátero central móvel */}
            <polygon
              points={`${t1.x},${t1.y} ${t2.x},${t2.y} ${t3.x},${t3.y}`}
              fill="url(#facet-light)"
              opacity={0.5}
              stroke={strokeColor}
              strokeWidth="1.3"
              strokeOpacity={0.7}
            />

            {/* Facetas triangulares periféricas */}
            <polygon points={`50,4 ${t1.x},${t1.y} 92,26`} fill="url(#facet-light)" opacity={0.25} />
            <polygon points={`50,4 ${t1.x},${t1.y} 8,26`} fill="url(#facet-light)" opacity={0.35} />
            <polygon points={`${t2.x},${t2.y} 92,26 92,74`} fill="url(#facet-dark)" opacity={0.4} />
            <polygon points={`${t3.x},${t3.y} 8,26 8,74`} fill="url(#facet-light)" opacity={0.2} />
            <polygon points={`${t2.x},${t2.y} 50,96 ${50 + tiltX * 5},72`} fill="url(#facet-dark)" opacity={0.5} />
            <polygon points={`${t3.x},${t3.y} 50,96 ${50 + tiltX * 5},72`} fill="url(#facet-dark)" opacity={0.4} />

            {/* Linhas de crista internas */}
            <line x1="50" y1="4" x2={t1.x} y2={t1.y} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
            <line x1="92" y1="74" x2={t2.x} y2={t2.y} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
            <line x1="8" y1="74" x2={t3.x} y2={t3.y} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
            <line x1="50" y1="96" x2={t2.x} y2={t2.y} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
            <line x1="50" y1="96" x2={t3.x} y2={t3.y} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />

            {/* Números nas facetas periféricas (trocam durante a rolagem) */}
            <text x="50" y={t1.y - 7} textAnchor="middle" fill={sideNumberColor} fontSize="10" fontWeight="bold">
              {sideFaces[0] ?? 14}
            </text>
            <text x="84" y="52" textAnchor="middle" fill={sideNumberColor} fontSize="10" fontWeight="bold">
              {sideFaces[1] ?? 8}
            </text>
            <text x="16" y="52" textAnchor="middle" fill={sideNumberColor} fontSize="10" fontWeight="bold">
              {sideFaces[2] ?? 2}
            </text>

            {/* Número Principal no Centro */}
            <text
              x={50 + tiltX * 7}
              y={53 + tiltY * 7}
              textAnchor="middle"
              dominantBaseline="central"
              fill={numberColor}
              fontSize="26"
              fontWeight="900"
              fontFamily="monospace, sans-serif"
              filter="url(#num-shadow)"
            >
              {value}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}
