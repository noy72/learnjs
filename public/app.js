'use strict';
var learnjs = {
	poolId: 'us-east-1:5214431b-034b-4a8c-8d1e-18322036249e'
};

learnjs.identity = new $.Deferred();

//source[learnjs/public/app.js]{
learnjs.problems = [
	{
		description: "What is truth?",
		code: "function problem() { return __; }"
	},
	{
		description: "Simple Math",
		code: "function problem() { return 42 === 6 * __; }"
	},
];
//}

learnjs.applyObject = function(obj, elem) {
	for (var key in obj) {
		elem.find('[data-name="' + key + '"]').text(obj[key]);
	}
}

learnjs.problemView = function(data) {
	var problemNumber = parseInt(data, 10);
	var view = $('.templates .problem-view').clone();
	var problemData = learnjs.problems[problemNumber - 1];
	var resultFlash = view.find('.result');

	function checkAnswer() {
		var answer = view.find('.answer').val();
		var test = problemData.code.replace('__', answer) + '; problem();';
		return eval(test);
	}

	function checkAnswerClick() {
		if (checkAnswer()) {
			var correctFlash = learnjs.template('correct-flash');
			correctFlash.find('a').attr('href', '#problem-' + (problemNumber + 1));
			learnjs.flashElement(resultFlash, correctFlash);
		} else {
			learnjs.flashElement(resultFlash, 'Incorrect!');
		}
		return false;
	}

	if (problemNumber < learnjs.problems.length) {
		var buttonItem = learnjs.template('skip-btn');
		buttonItem.find('a').attr('href', '#problem-' + (problemNumber + 1));
		$('.nav-list').append(buttonItem);
		view.bind('removingView', function() {
			buttonItem.remove();
		});
	}

	view.find('.check-btn').click(checkAnswerClick);
	view.find('.title').text('Problem #' + problemNumber);
	learnjs.applyObject(problemData, view);
	return view;
}

learnjs.showView = function(hash) {
	var routes = {
		'#problem': learnjs.problemView,
		'#': learnjs.landingView,
		'': learnjs.landingView
	};
	var hashParts = hash.split('-');
	var viewFn = routes[hashParts[0]];
	if(viewFn) {
		learnjs.triggerEvent('removeingView', []);
		$('.view-container').empty().append(viewFn(hashParts[1]));
	}
}

learnjs.landingView = function() {
	return learnjs.template('landing-view');
}

learnjs.appOnReady = function() {
	window.onhashchange = function() {
		learnjs.showView(window.location.hash);
	}
	learnjs.showView(window.location.hash);
}

learnjs.flashElement = function(elem, content) {
	elem.fadeOut('fact', function() {
		elem.html(content);
		elem.fadeIn();
	});
}


learnjs.buildCorrectFlash = function(problemNum) {
	var correctFlash = learnjs.template('correct-flash');
	var link = correctFlash.find('a');
	if (problemNum < learnjs.problems.length) {
		link.attr('href', '#problem-' + (problemNum + 1));
	} else {
		link.attr('href', '');
		link.text("You're Finished!");
	}
	return correctFlash;
}

learnjs.triggerEvent = function(name, args) {
	$('.view-container>*').trigger(name, args);
}

learnjs.template = function(name) {
	return $('.templates .' + name).clone();
}



function googleSignIn(googleUser) {
	var id_token = googleUser.getAuthResponse().id_token;
		AWS.config.update({
		region: 'us-east-1',
		credentials: new AWS.CognitoIdentityCredentials({
			IdentityPoolId: learnjs.poolId,
			Logins: {
				'accounts.google.com': id_token
			}
		})
	})

	learnjs.awsRefresh = function() {
		var deferred = new $.Deferred();
			AWS.config.credentials.refresh(function(err) {
			if (err) {
				deferred.reject(err);
			} else {
				deferred.resolve(AWS.config.credentials.identityId);
			}
		});
		return deferred.promise();
	}

	learnjs.awsRefresh().then(function(id) {
		learnjs.identity.resolve({
			id: id,
			email: googleUser.getBasicProfile().getEmail(),
			refresh: refresh
		});
	});
}

function refresh() {
	return gapi.auth2.getAuthInstance().signIn({
		prompt: 'login'
	}).then(function(userUpdate) {
		var creds = AWS.config.credentials;
		var newToken = userUpdate.getAuthResponse().id_token;
		creds.params.Logins['accounts.google.com'] = newToken;
		return learnjs.awsRefresh();
	});
}
