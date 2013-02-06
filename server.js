var express = require('express'),
	abhi = require('abhispeak'),
	app = express();

app.use(express.static(__dirname + '/public'));
app.engine('jade', require('jade').__express);

var pageSize = 20;

var liOptions = {
	paragraphs: pageSize,
	ptags: false
};

app.get('/', function(request, response) {	
	var template = request.xhr ? 'item.jade' : 'index.jade',
		page = request.xhr ? request.param('page') : 0;

	abhi.panda(liOptions, function(error, abhiResponse) {		
		response.render(template,
			{
				title: 'Fast List Test',
				items: abhiResponse.paragraphs,
				offset: pageSize * page
			});
	});	
});

app.listen(10000);