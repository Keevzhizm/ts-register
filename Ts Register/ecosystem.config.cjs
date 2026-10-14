module.exports = {
  apps: [{
    name: "shaneria-register",
    script: "./dist/index.js",
    cwd: __dirname,
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    watch: false,
    max_restarts: 20,
    restart_delay: 3000,
    time: true,
    env: { NODE_ENV: "production" }
  }]
};
