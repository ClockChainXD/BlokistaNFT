let AWS = require('aws-sdk');
let config = require('../index')();
let fs = require('fs');
let dateformat = require('dateformat');
let spawn = require('child_process').spawn;


let CronJob = require('cron').CronJob;
let job = new CronJob('30 1 * * *', function () { /* Upload Backup Every 1 AM */
    try {
        if (!fs.existsSync('./db_dump'))
            fs.mkdirSync('./db_dump');

        let dump_filename = `NanaiNFTs_DB_${dateformat(new Date(), "yyyy_mm_dd")}.gz`;
        let backupProcess = spawn('mongodump', [
            '--db=NanaiNFTs_DB',
            `--archive=./db_dump/${dump_filename}`,
            '--gzip'
        ]);

        backupProcess.on('exit', (code, signal) => {
            if (code)
                console.log('Backup process exited with code ', code);
            else if (signal)
                console.error('Backup process was killed with signal ', signal);
            else {
                console.log('Successfully backup the database')
            }
        });
    } catch {
        console.log('Exception happened on cron-job');
    }
});

module.exports = {
    start: function () {
        job.start();
    }
};