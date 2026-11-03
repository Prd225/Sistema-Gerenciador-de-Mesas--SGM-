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
  const clipId = `die-clip-${faces}-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  // Cores dinâmicas para bordas e destaques limpos
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

  const sideNumberColor = 'rgba(255, 255, 255, 0.4)';

  // Deslocamento de perspectiva pseudo-3D suave normalizado (-1..+1)
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
        {/* Gradiente principal da resina do dado */}
        <linearGradient id={gradientId} x1="20%" y1="15%" x2="80%" y2="85%">
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

        {/* ClipPaths Mestres para garantir 100% que NENHUM número vaza fora do dado */}
        {faces === 4 && (
          <clipPath id={clipId}>
            <polygon points="50,6 94,88 6,88" />
          </clipPath>
        )}
        {faces === 6 && (
          <clipPath id={clipId}>
            <rect x="8" y="8" width="84" height="84" rx="16" />
          </clipPath>
        )}
        {faces === 8 && (
          <clipPath id={clipId}>
            <polygon points="50,4 94,50 50,96 6,50" />
          </clipPath>
        )}
        {(faces === 10 || faces === 100) && (
          <clipPath id={clipId}>
            <polygon points="50,4 92,48 50,96 8,48" />
          </clipPath>
        )}
        {faces === 12 && (
          <clipPath id={clipId}>
            <polygon points="50,4 78,13 95,37 95,67 78,91 50,96 22,91 5,67 5,37 22,13" />
          </clipPath>
        )}
        {faces === 20 && (
          <clipPath id={clipId}>
            <polygon points="50,4 92,26 92,74 50,96 8,74 8,26" />
          </clipPath>
        )}
      </defs>

      {/* D4: Piramidal / Tetraedro */}
      {faces === 4 && (() => {
        const apexX = 50 + tiltX * 8;
        const apexY = 58 + tiltY * 8;

        return (
          <g clipPath={`url(#${clipId})`}>
            {/* Silhueta triangular */}
            <polygon
              points="50,6 94,88 6,88"
              fill={`url(#${gradientId})`}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {/* Facetas internas */}
            <polygon points={`50,6 ${apexX},${apexY} 6,88`} fill="url(#facet-light)" opacity={0.55} />
            <polygon points={`50,6 94,88 ${apexX},${apexY}`} fill="url(#facet-dark)" opacity={0.45} />
            <polygon points={`6,88 ${apexX},${apexY} 94,88`} fill="url(#facet-light)" opacity={0.3} />

            {/* Linhas de crista */}
            <line x1="50" y1="6" x2={apexX} y2={apexY} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
            <line x1="6" y1="88" x2={apexX} y2={apexY} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
            <line x1="94" y1="88" x2={apexX} y2={apexY} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />

            {/* Números nas facetas laterais (apenas durante a rolagem) */}
            {isRolling && (
              <>
                <text
                  x={34 + tiltX * 3}
                  y={50 + tiltY * 3}
                  textAnchor="middle"
                  fill={sideNumberColor}
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="monospace, sans-serif"
                >
                  {sideFaces[0] ?? 1}
                </text>
                <text
                  x={66 + tiltX * 3}
                  y={50 + tiltY * 3}
                  textAnchor="middle"
                  fill={sideNumberColor}
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="monospace, sans-serif"
                >
                  {sideFaces[1] ?? 3}
                </text>
              </>
            )}

            {/* Sombra de texto rápida */}
            <text
              x={50 + tiltX * 4}
              y={76 + tiltY * 3 + 1.2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#000000"
              fontSize="25"
              fontWeight="900"
              fontFamily="monospace, sans-serif"
              opacity={0.85}
            >
              {value}
            </text>
            {/* Número Principal */}
            <text
              x={50 + tiltX * 4}
              y={76 + tiltY * 3}
              textAnchor="middle"
              dominantBaseline="central"
              fill={numberColor}
              fontSize="25"
              fontWeight="900"
              fontFamily="monospace, sans-serif"
            >
              {value}
            </text>
          </g>
        );
      })()}

      {/* D6: Cubo com chanfros */}
      {faces === 6 && (() => {
        const fx = 12 + tiltX * 6;
        const fy = 12 + tiltY * 6;
        const fw = 76;
        const fh = 76;

        return (
          <g clipPath={`url(#${clipId})`}>
            {/* Extrusão de fundo */}
            <rect x="8" y="8" width="84" height="84" rx="16" fill="#090a0d" opacity={0.7} />

            {/* Face frontal */}
            <rect
              x={fx}
              y={fy}
              width={fw}
              height={fh}
              rx="13"
              fill={`url(#${gradientId})`}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* Borda interna chanfrada */}
            <rect
              x={fx + 4}
              y={fy + 4}
              width={fw - 8}
              height={fh - 8}
              rx="10"
              fill="none"
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="0.9"
            />

            {/* Sombra rápida do número */}
            <text
              x={fx + fw / 2}
              y={fy + fh / 2 + 2.2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#000000"
              fontSize="31"
              fontWeight="900"
              fontFamily="monospace, sans-serif"
              opacity={0.85}
            >
              {value}
            </text>
            {/* Número Principal */}
            <text
              x={fx + fw / 2}
              y={fy + fh / 2 + 1}
              textAnchor="middle"
              dominantBaseline="central"
              fill={numberColor}
              fontSize="31"
              fontWeight="900"
              fontFamily="monospace, sans-serif"
            >
              {value}
            </text>
          </g>
        );
      })()}

      {/* D8: Octaedro / Diamante */}
      {faces === 8 && (() => {
        const cx = 50 + tiltX * 6;
        const cy = 22 + tiltY * 6;
        const rx = 76 + tiltX * 5;
        const ry = 68 + tiltY * 5;
        const lx = 24 + tiltX * 5;
        const ly = 68 + tiltY * 5;

        return (
          <g clipPath={`url(#${clipId})`}>
            {/* Silhueta externa */}
            <polygon
              points="50,4 94,50 50,96 6,50"
              fill={`url(#${gradientId})`}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />

            {/* Faceta frontal triangular */}
            <polygon
              points={`${cx},${cy} ${rx},${ry} ${lx},${ly}`}
              fill="url(#facet-light)"
              opacity={0.45}
              stroke={strokeColor}
              strokeWidth="0.9"
              strokeOpacity={0.6}
            />

            {/* Facetas periféricas */}
            <polygon points={`50,4 ${cx},${cy} 6,50`} fill="url(#facet-light)" opacity={0.3} />
            <polygon points={`50,4 ${cx},${cy} 94,50`} fill="url(#facet-dark)" opacity={0.4} />
            <polygon points={`6,50 ${lx},${ly} 50,96`} fill="url(#facet-light)" opacity={0.25} />
            <polygon points={`94,50 ${rx},${ry} 50,96`} fill="url(#facet-dark)" opacity={0.5} />

            {/* Linhas de crista */}
            <line x1="50" y1="4" x2={cx} y2={cy} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
            <line x1="94" y1="50" x2={rx} y2={ry} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
            <line x1="6" y1="50" x2={lx} y2={ly} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
            <line x1="50" y1="96" x2={50 + tiltX * 5} y2={ly} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />

            {/* Números nas facetas durante a rolagem (estritamente dentro das facetas) */}
            {isRolling && (
              <>
                <text x="50" y="16" textAnchor="middle" fill={sideNumberColor} fontSize="10" fontWeight="bold">
                  {sideFaces[0] ?? 4}
                </text>
                <text x="26" y="62" textAnchor="middle" fill={sideNumberColor} fontSize="10" fontWeight="bold">
                  {sideFaces[1] ?? 7}
                </text>
                <text x="74" y="62" textAnchor="middle" fill={sideNumberColor} fontSize="10" fontWeight="bold">
                  {sideFaces[2] ?? 2}
                </text>
              </>
            )}

            {/* Sombra de texto */}
            <text
              x={50 + tiltX * 5}
              y={52 + tiltY * 5 + 1.2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#000000"
              fontSize="26"
              fontWeight="900"
              fontFamily="monospace, sans-serif"
              opacity={0.85}
            >
              {value}
            </text>
            {/* Número Principal */}
            <text
              x={50 + tiltX * 5}
              y={52 + tiltY * 5}
              textAnchor="middle"
              dominantBaseline="central"
              fill={numberColor}
              fontSize="26"
              fontWeight="900"
              fontFamily="monospace, sans-serif"
            >
              {value}
            </text>
          </g>
        );
      })()}

      {/* D10 & D100: Formato de Pipa / Deltoedro Autêntico */}
      {(faces === 10 || faces === 100) && (() => {
        const topX = 50 + tiltX * 3;
        const topY = 4;
        const rightX = 72 + tiltX * 5;
        const rightY = 48 + tiltY * 4;
        const botX = 50 + tiltX * 3;
        const botY = 80 + tiltY * 5;
        const leftX = 28 + tiltX * 5;
        const leftY = 48 + tiltY * 4;

        return (
          <g clipPath={`url(#${clipId})`}>
            {/* Silhueta externa deltoedro em pipa */}
            <polygon
              points="50,4 92,48 50,96 8,48"
              fill={`url(#${gradientId})`}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />

            {/* Faceta frontal em forma de pipa central */}
            <polygon
              points={`${topX},${topY} ${rightX},${rightY} ${botX},${botY} ${leftX},${leftY}`}
              fill="url(#facet-light)"
              opacity={0.42}
              stroke={strokeColor}
              strokeWidth="1"
              strokeOpacity={0.65}
            />

            {/* Facetas periféricas */}
            <polygon points={`${topX},${topY} ${leftX},${leftY} 8,48`} fill="url(#facet-light)" opacity={0.35} />
            <polygon points={`${topX},${topY} ${rightX},${rightY} 92,48`} fill="url(#facet-dark)" opacity={0.35} />
            <polygon points={`${leftX},${leftY} ${botX},${botY} 50,96 8,48`} fill="url(#facet-light)" opacity={0.2} />
            <polygon points={`${rightX},${rightY} ${botX},${botY} 50,96 92,48`} fill="url(#facet-dark)" opacity={0.48} />

            {/* Linha de crista inferior */}
            <line x1={botX} y1={botY} x2="50" y2="96" stroke={strokeColor} strokeWidth={1.1} strokeOpacity={0.65} />

            {/* Números nas facetas laterais inclinados (estritamente dentro das facetas) */}
            {isRolling && (
              <>
                <g transform={`translate(${28 + tiltX * 3}, ${32 + tiltY * 3}) rotate(-40)`}>
                  <text textAnchor="middle" dominantBaseline="central" fill={sideNumberColor} fontSize="10" fontWeight="bold">
                    {sideFaces[0] ?? 2}
                  </text>
                </g>
                <g transform={`translate(${72 + tiltX * 3}, ${32 + tiltY * 3}) rotate(40)`}>
                  <text textAnchor="middle" dominantBaseline="central" fill={sideNumberColor} fontSize="10" fontWeight="bold">
                    {sideFaces[1] ?? 6}
                  </text>
                </g>
                <g transform={`translate(${30 + tiltX * 3}, ${68 + tiltY * 3}) rotate(-25)`}>
                  <text textAnchor="middle" dominantBaseline="central" fill={sideNumberColor} fontSize="10" fontWeight="bold">
                    {sideFaces[2] ?? 7}
                  </text>
                </g>
                <g transform={`translate(${70 + tiltX * 3}, ${68 + tiltY * 3}) rotate(25)`}>
                  <text textAnchor="middle" dominantBaseline="central" fill={sideNumberColor} fontSize="10" fontWeight="bold">
                    {sideFaces[3] ?? 3}
                  </text>
                </g>
              </>
            )}

            {/* Sombra de texto */}
            <text
              x={50 + tiltX * 4}
              y={48 + tiltY * 4 + 1.2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#000000"
              fontSize={faces === 100 ? '22' : '26'}
              fontWeight="900"
              fontFamily="monospace, sans-serif"
              opacity={0.85}
            >
              {value}
            </text>
            {/* Número Principal na Faceta Central */}
            <text
              x={50 + tiltX * 4}
              y={48 + tiltY * 4}
              textAnchor="middle"
              dominantBaseline="central"
              fill={numberColor}
              fontSize={faces === 100 ? '22' : '26'}
              fontWeight="900"
              fontFamily="monospace, sans-serif"
            >
              {value}
            </text>
          </g>
        );
      })()}

      {/* D12: Dodecaedro */}
      {faces === 12 && (() => {
        const v0 = { x: 50 + tiltX * 5, y: 19 + tiltY * 5 };
        const v1 = { x: 80 + tiltX * 5, y: 41 + tiltY * 5 };
        const v2 = { x: 69 + tiltX * 5, y: 78 + tiltY * 5 };
        const v3 = { x: 31 + tiltX * 5, y: 78 + tiltY * 5 };
        const v4 = { x: 20 + tiltX * 5, y: 41 + tiltY * 5 };

        return (
          <g clipPath={`url(#${clipId})`}>
            {/* Decágono exterior */}
            <polygon
              points="50,4 78,13 95,37 95,67 78,91 50,96 22,91 5,67 5,37 22,13"
              fill={`url(#${gradientId})`}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />

            {/* Pentágono regular central */}
            <polygon
              points={`${v0.x},${v0.y} ${v1.x},${v1.y} ${v2.x},${v2.y} ${v3.x},${v3.y} ${v4.x},${v4.y}`}
              fill="url(#facet-light)"
              opacity={0.45}
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeOpacity={0.65}
            />

            {/* Arestas conectando aos vértices externos */}
            <line x1={v0.x} y1={v0.y} x2="50" y2="4" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.5} />
            <line x1={v1.x} y1={v1.y} x2="95" y2="37" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.5} />
            <line x1={v2.x} y1={v2.y} x2="78" y2="91" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.5} />
            <line x1={v3.x} y1={v3.y} x2="22" y2="91" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.5} />
            <line x1={v4.x} y1={v4.y} x2="5" y2="37" stroke={strokeColor} strokeWidth={1} strokeOpacity={0.5} />

            {/* Números nas facetas periféricas durante a rolagem */}
            {isRolling && (
              <>
                <text x="50" y="15" textAnchor="middle" fill={sideNumberColor} fontSize="9" fontWeight="bold">
                  {sideFaces[0] ?? 5}
                </text>
                <text x="82" y="32" textAnchor="middle" fill={sideNumberColor} fontSize="9" fontWeight="bold">
                  {sideFaces[1] ?? 8}
                </text>
                <text x="74" y="82" textAnchor="middle" fill={sideNumberColor} fontSize="9" fontWeight="bold">
                  {sideFaces[2] ?? 1}
                </text>
                <text x="26" y="82" textAnchor="middle" fill={sideNumberColor} fontSize="9" fontWeight="bold">
                  {sideFaces[3] ?? 11}
                </text>
                <text x="18" y="32" textAnchor="middle" fill={sideNumberColor} fontSize="9" fontWeight="bold">
                  {sideFaces[4] ?? 3}
                </text>
              </>
            )}

            {/* Sombra de texto */}
            <text
              x={50 + tiltX * 5}
              y={52 + tiltY * 5 + 1.2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#000000"
              fontSize="26"
              fontWeight="900"
              fontFamily="monospace, sans-serif"
              opacity={0.85}
            >
              {value}
            </text>
            {/* Número Principal */}
            <text
              x={50 + tiltX * 5}
              y={52 + tiltY * 5}
              textAnchor="middle"
              dominantBaseline="central"
              fill={numberColor}
              fontSize="26"
              fontWeight="900"
              fontFamily="monospace, sans-serif"
            >
              {value}
            </text>
          </g>
        );
      })()}

      {/* D20: Icosaedro */}
      {faces === 20 && (() => {
        const t1 = { x: 50 + tiltX * 6, y: 20 + tiltY * 6 };
        const t2 = { x: 80 + tiltX * 5, y: 72 + tiltY * 5 };
        const t3 = { x: 20 + tiltX * 5, y: 72 + tiltY * 5 };

        return (
          <g clipPath={`url(#${clipId})`}>
            {/* Silhueta hexagonal */}
            <polygon
              points="50,4 92,26 92,74 50,96 8,74 8,26"
              fill={`url(#${gradientId})`}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />

            {/* Triângulo equilátero central */}
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
            <polygon points={`${t2.x},${t2.y} 50,96 ${50 + tiltX * 4},72`} fill="url(#facet-dark)" opacity={0.5} />
            <polygon points={`${t3.x},${t3.y} 50,96 ${50 + tiltX * 4},72`} fill="url(#facet-dark)" opacity={0.4} />

            {/* Linhas de crista */}
            <line x1="50" y1="4" x2={t1.x} y2={t1.y} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
            <line x1="92" y1="74" x2={t2.x} y2={t2.y} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
            <line x1="8" y1="74" x2={t3.x} y2={t3.y} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
            <line x1="50" y1="96" x2={t2.x} y2={t2.y} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />
            <line x1="50" y1="96" x2={t3.x} y2={t3.y} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.6} />

            {/* Números nas facetas periféricas em rolagem */}
            {isRolling && (
              <>
                <text x="50" y="16" textAnchor="middle" fill={sideNumberColor} fontSize="10" fontWeight="bold">
                  {sideFaces[0] ?? 14}
                </text>
                <text x="82" y="50" textAnchor="middle" fill={sideNumberColor} fontSize="10" fontWeight="bold">
                  {sideFaces[1] ?? 8}
                </text>
                <text x="18" y="50" textAnchor="middle" fill={sideNumberColor} fontSize="10" fontWeight="bold">
                  {sideFaces[2] ?? 2}
                </text>
              </>
            )}

            {/* Sombra de texto */}
            <text
              x={50 + tiltX * 5}
              y={54 + tiltY * 5 + 1.2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#000000"
              fontSize="26"
              fontWeight="900"
              fontFamily="monospace, sans-serif"
              opacity={0.85}
            >
              {value}
            </text>
            {/* Número Principal */}
            <text
              x={50 + tiltX * 5}
              y={54 + tiltY * 5}
              textAnchor="middle"
              dominantBaseline="central"
              fill={numberColor}
              fontSize="26"
              fontWeight="900"
              fontFamily="monospace, sans-serif"
            >
              {value}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}
