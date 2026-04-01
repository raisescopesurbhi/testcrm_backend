module.exports = {
    apps: [

        // --- New app: Ellara Market ---
        {
            name: "9TestCrm",
            script: "index.js",
            // cwd: "C:\\Users\\Administrator\\Desktop\\ncrm server\\ellara-market",
            exec_mode: "fork", // keep 1 instance to avoid Socket.IO sticky-session issues
            instances: 1,
            watch: false,
            autorestart: true,
            max_memory_restart: "512M",
            env: {
                NODE_ENV: "production",
                HOST: "127.0.0.1",
                PORT: 5040, // match your .env
                TRUST_PROXY: "1",
            },
            // out_file: "C:\\Users\\Administrator\\Desktop\\ncrm server\\ellara-market\\logs\\out.log",
            // error_file: "C:\\Users\\Administrator\\Desktop\\ncrm server\\ellara-market\\logs\\error.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss",
        },
    ],
};