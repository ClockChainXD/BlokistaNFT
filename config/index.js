let config = {
    mode: 'local',
    port: 5000,
    base_url: 'https://admin.blokista.com',
    mongo: {
        host: '127.0.0.1',
        port: 27017,
        db_name: 'BlokistaTestnet2DB'
    },
    dev_info: {
        name: 'Technical Manager',
        email: 'dev@dev.com',
        password: 'dev'
    },
    admin_info: {
        name: 'Administrator',
        email: 'admin@admin.com',
        password: 'admin'
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