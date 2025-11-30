module.exports = {
  apps: [
    {
      name: 'orchestrator',
      script: 'dist/index.js',
      env: {
        PROVIDER_A_FAIL: 'false',
        PROVIDER_B_FAIL: 'false',
        NODE_ENV: 'production'
      },
      // optional: max memory restart
      max_memory_restart: '300M'
    }
  ]
};
