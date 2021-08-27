let config = {
    mode: 'local',
    port: 5000,
    base_url: 'https://admin.blokista.com',
    mongo: {
        host: '127.0.0.1',
        port: 27017,
        db_name: 'BlokistaDBv2'
    },
    dev_info: {
        name: 'Technical Manager',
        email: 'dev@dev.com',
        password: '4339f6fd59e9637b0e6f31d477c41aec96179a06cb44151ce51987606cb6e2cb'
        // devBlokista
    },
    admin_info: {
        name: 'Administrator',
        email: 'admin@admin.com',
        password: 'b38f7d462bbca34b27af4f0a572f53f0e04325c5b982ba69c0ee5f9804fb613a'
        // adminBlokista
    },
    smtp_info: {
        host: '',
        user: '',
        password: '',
        port: 465,
        from_email: '',
        from_name: ''
    },

    sub_graph_url: 'https://api.thegraph.com/subgraphs/name/clockchainxd/blokistachapel',

    session_secret: 'TESTNFTSSECRET',
    terminal_key: 'TESTNFTSSECRET-20210616'
};

module.exports = function () {
    return config;
};