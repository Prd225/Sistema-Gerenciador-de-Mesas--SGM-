import { type DieFaceCount } from '@/store/useDiceTrayStore';

interface DieShapeSVGProps {
  faces: DieFaceCount;
  color: string;
  isCrit: boolean;
  isFumble: boolean;
  isRolling: boolean;
  value: number | string;
  size?: number;
}

export default function DieShapeSVG({
  faces,
  color,
  isCrit,
  isFumble,
  isRolling,
  value,
  size = 82,
}: DieShapeSVGProps) {
  const gradientId = `die-grad-${faces}-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  // Cores dinâmicas para bordas e destaques
  const strokeColor = isCrit
    ? '#fbbf24'
    : isFumble
    ? '#ef4444'
    : 'rgba(255, 255, 255, 0.28)';

  const strokeWidth = isCrit || isFumble ? 2.5 : 1.6;

  const numberColor = isCrit
    ? '#fde047'
    : isFumble
    ? '#f87171'
    : isRolling
    ? '#c084fc'
    : '#ffffff';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="overflow-visible drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] select-none pointer-events-none"
    >
      <defs>
        {/* Gradiente principal da resina do dado */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.88} />
          <stop offset="45%" stopColor={color} stopOpacity={0.55} />
          <stop offset="100%" stopColor="#121316" stopOpacity={0.95} />
        </linearGradient>

        {/* Gradientes de iluminação das facetas */}
        <linearGradient id="facet-light" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0.02} />
        </linearGradient>

        <linearGradient id="facet-dark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#000000" stopOpacity={0.1} />
          <stop offset="100%" stopColor="#000000" stopOpacity={0.45} />
        </linearGradient>

        {/* Filtro de sombra no número para máxima legibilidade */}
        <filter id="num-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.9" />
        </filter>
      </defs>

      {/* D4: Piramidal / Tetraedro (Triângulo Equilátero com 3 Facetas Internas) */}
      {faces === 4 && (
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
          <polygon points="50,6 50,62 6,88" fill="url(#facet-light)" opacity={0.6} />
          {/* Faceta Direita */}
          <polygon points="50,6 94,88 50,62" fill="url(#facet-dark)" opacity={0.5} />
          {/* Linhas de crista internas unindo o ápice às pontas */}
          <line x1="50" y1="6" x2="50" y2="62" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.5} />
          <line x1="6" y1="88" x2="50" y2="62" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.5} />
          <line x1="94" y1="88" x2="50" y2="62" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.5} />

          {/* Número */}
          <text
            x="50"
            y="64"
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
      )}

      {/* D6: Quadrado / Cubo com chanfros suaves */}
      {faces === 6 && (
        <g>
          <rect
            x="8"
            y="8"
            width="84"
            height="84"
            rx="16"
            ry="16"
            fill={`url(#${gradientId})`}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Chanfro interno sutil */}
          <rect
            x="14"
            y="14"
            width="72"
            height="72"
            rx="11"
            ry="11"
            fill="none"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="1"
          />

          {/* Número */}
          <text
            x="50"
            y="52"
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
      )}

      {/* D8: Octaedro / Diamante (Pontas superior e inferior com faceta triangular central) */}
      {faces === 8 && (
        <g>
          {/* Silhueta de diamante/octaedro */}
          <polygon
            points="50,5 93,50 50,95 7,50"
            fill={`url(#${gradientId})`}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          {/* Faceta triangular frontal onde o número descansa */}
          <polygon points="50,18 78,66 22,66" fill="url(#facet-light)" opacity={0.45} />
          {/* Arestas conectando a faceta central às pontas */}
          <line x1="50" y1="5" x2="50" y2="18" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
          <line x1="93" y1="50" x2="78" y2="66" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
          <line x1="7" y1="50" x2="22" y2="66" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
          <line x1="50" y1="95" x2="50" y2="66" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
          <line x1="50" y1="18" x2="78" y2="66" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
          <line x1="50" y1="18" x2="22" y2="66" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
          <line x1="22" y1="66" x2="78" y2="66" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />

          {/* Número */}
          <text
            x="50"
            y="51"
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
      )}

      {/* D10 & D100: Pirâmide Curvada / Deltoedro (Formato de pipa característico do d10 real) */}
      {(faces === 10 || faces === 100) && (
        <g>
          {/* Contorno em pipa com ombros arredondados e pontas afiladas */}
          <polygon
            points="50,4 90,36 80,82 50,96 20,82 10,36"
            fill={`url(#${gradientId})`}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />

          {/* Faceta frontal losangular/pipa central */}
          <polygon
            points="50,14 74,45 50,80 26,45"
            fill="url(#facet-light)"
            opacity={0.4}
            stroke={strokeColor}
            strokeWidth="0.9"
            strokeOpacity={0.5}
          />

          {/* Facetas laterais sombreadas */}
          <polygon points="50,14 74,45 90,36" fill="url(#facet-dark)" opacity={0.35} />
          <polygon points="50,14 26,45 10,36" fill="url(#facet-light)" opacity={0.35} />
          <polygon points="50,80 74,45 80,82" fill="url(#facet-dark)" opacity={0.5} />
          <polygon points="50,80 26,45 20,82" fill="url(#facet-dark)" opacity={0.3} />

          {/* Linhas de crista até o ápice e base */}
          <line x1="50" y1="4" x2="50" y2="14" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
          <line x1="50" y1="80" x2="50" y2="96" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />

          {/* Número (fonte ligeiramente menor no d100 para caber "100" ou "00") */}
          <text
            x="50"
            y="50"
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
      )}

      {/* D12: Dodecaedro (Pentágono Central com Facetas Trapezoidais ao Redor) */}
      {faces === 12 && (
        <g>
          {/* Silhueta externa de 10 lados (decágono regular arredondado) */}
          <polygon
            points="50,4 78,13 95,37 95,67 78,91 50,96 22,91 5,67 5,37 22,13"
            fill={`url(#${gradientId})`}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />

          {/* Pentágono regular central onde o número repousa */}
          <polygon
            points="50,19 80,41 69,78 31,78 20,41"
            fill="url(#facet-light)"
            opacity={0.45}
            stroke={strokeColor}
            strokeWidth="1.2"
            strokeOpacity={0.6}
          />

          {/* Linhas conectando os 5 vértices do pentágono aos vértices externos */}
          <line x1="50" y1="19" x2="50" y2="4" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.5} />
          <line x1="80" y1="41" x2="95" y2="37" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.5} />
          <line x1="69" y1="78" x2="78" y2="91" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.5} />
          <line x1="31" y1="78" x2="22" y2="91" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.5} />
          <line x1="20" y1="41" x2="5" y2="37" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.5} />

          {/* Número */}
          <text
            x="50"
            y="52"
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
      )}

      {/* D20: Icosaedro (Triângulo Equilátero Central em Silhueta Hexagonal) */}
      {faces === 20 && (
        <g>
          {/* Silhueta hexagonal externa */}
          <polygon
            points="50,4 92,26 92,74 50,96 8,74 8,26"
            fill={`url(#${gradientId})`}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />

          {/* Triângulo equilátero central grande */}
          <polygon
            points="50,19 82,73 18,73"
            fill="url(#facet-light)"
            opacity={0.5}
            stroke={strokeColor}
            strokeWidth="1.3"
            strokeOpacity={0.65}
          />

          {/* Facetas triangulares superiores e inferiores conectando aos cantos externos */}
          <polygon points="50,19 50,4 92,26" fill="url(#facet-light)" opacity={0.25} />
          <polygon points="50,19 50,4 8,26" fill="url(#facet-light)" opacity={0.35} />
          <polygon points="82,73 92,26 92,74" fill="url(#facet-dark)" opacity={0.4} />
          <polygon points="18,73 8,26 8,74" fill="url(#facet-light)" opacity={0.2} />
          <polygon points="82,73 50,96 50,73" fill="url(#facet-dark)" opacity={0.5} />
          <polygon points="18,73 50,96 50,73" fill="url(#facet-dark)" opacity={0.4} />

          {/* Linhas de crista dos vértices do triângulo aos vértices do hexágono */}
          <line x1="50" y1="19" x2="50" y2="4" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
          <line x1="82" y1="73" x2="92" y2="74" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
          <line x1="18" y1="73" x2="8" y2="74" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
          <line x1="82" y1="73" x2="50" y2="96" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
          <line x1="18" y1="73" x2="50" y2="96" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />

          {/* Número */}
          <text
            x="50"
            y="52"
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
      )}

      {/* Rótulo discreto do tipo de dado (d4, d6, etc.) */}
      <text
        x="50"
        y={faces === 4 ? '82' : '92'}
        textAnchor="middle"
        fill="rgba(255, 255, 255, 0.45)"
        fontSize="8"
        fontWeight="bold"
        fontFamily="sans-serif"
        letterSpacing="0.5"
      >
        D{faces}
      </text>
    </svg>
  );
}
