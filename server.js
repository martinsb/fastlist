var express = require('express'),
	abhi = require('abhispeak'),
	app = express();

app.use(express.static(__dirname + '/public'));
app.engine('jade', require('jade').__express);

var liOptions = {
	paragraphs: 1000,
	ptags: false
};

app.get('/', function(request, response) {
	abhi.panda(liOptions, function(error, abhiResponse) {
		response.render('index.jade',
			{
				title: 'Fast List Test',
				items: abhiResponse.paragraphs
			});
	});	
});

app.listen(10000);