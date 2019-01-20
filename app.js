const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const redis = require('redis');

const app = express();

let client = redis.createClient();
client.on('connect', () => {
    console.log('Redis Server Connected ...');
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    client.lrange('tasks', 0, -1, (err, reply) => {
	client.hgetall('call', (err, call) => {
            res.render('index', {
                title: 'Task List',
	        tasks: reply,
		call: call 
	    });
	});
    });
});

// add tasks
app.post('/task/add', (req, res) => {
    let task = req.body.task;
    client.rpush('tasks', task, (err, reply) => {
        if (err) {
	    console.log(err);
	}
	console.log('Task Added ...');
	res.redirect('/');
    });
});

// delete tasks
app.post('/task/delete', (req, res) => {
    let tasksToDelete = req.body.tasks;
    if (typeof(tasksToDelete) === 'string') {
	tasksToDelete = [tasksToDelete];
    }
    for (let i in tasksToDelete) {
	client.lrem('tasks', 0, tasksToDelete[i], (err, reply) => {
    	    if (err) {
	        console.log(err);
	    } else {
	    	console.log('Task Deleted...');
	    }
        });
    } 
    res.redirect('/');
});

// add call 
app.post('/call/add', (req, res) => {
    let newCall = {
	name: req.body.name,
	company: req.body.company,
	phone: req.body.phone,
	time: req.body.time
    };
    let commandInput = ['name', newCall.name, 'company', newCall.company, 'phone', newCall.phone, 'time', newCall.time];
    client.hmset('call', commandInput, (err, reply) => {
        if (err) {
	    console.log(err);
	}
	console.log(reply);
	res.redirect('/');
    });
});

const PORT = 3000;
app.listen(PORT);
console.log(`Server started on port ${PORT}...`)

module.exports = app;
