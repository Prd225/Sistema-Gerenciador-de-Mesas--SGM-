/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'Proíbe ciclos de dependência fora dos stores legados do cliente',
      from: {
        pathNot: '^apps/web/src/(lib/saveHelpers\\.ts|store/)',
      },
      to: {
        circular: true,
      },
    },
    {
      name: 'shared-boundaries',
      severity: 'error',
      comment: '@sgm/shared só pode importar zod, vitest e módulos internos',
      from: {
        path: '^packages/shared/src',
      },
      to: {
        pathNot: '^(packages/shared/src|node_modules/(zod|vitest))',
      },
    },
    {
      name: 'engine-boundaries',
      severity: 'error',
      comment:
        '@sgm/engine só pode importar @sgm/shared, immer, vitest e módulos internos',
      from: {
        path: '^packages/engine/src',
      },
      to: {
        pathNot:
          '^(packages/engine/src|packages/shared/src|node_modules/(@sgm/shared|immer|vitest))',
      },
    },
    {
      name: 'server-cannot-import-web',
      severity: 'error',
      comment: 'apps/server não pode importar apps/web',
      from: {
        path: '^apps/server',
      },
      to: {
        path: '^apps/web',
      },
    },
    {
      name: 'web-cannot-import-server',
      severity: 'error',
      comment: 'apps/web não pode importar apps/server',
      from: {
        path: '^apps/web',
      },
      to: {
        path: '^apps/server',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
