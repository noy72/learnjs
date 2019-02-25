describe('LearnJS', function() {
	beforeEach(function() {
		learnjs.identity = new $.Deferred();
	});

	it('can show a probelm view', function() {
		learnjs.showView('#problem-1');
		expect($('.view-container .problem-view').length).toEqual(1);
	});
	it('shows the loading page view when there is no hash', function() {
		learnjs.showView('');
		expect($('.view-container .landing-view').length).toEqual(1)
	});
	it('passes the hash view parameter to the view function', function() {
		spyOn(learnjs, 'problemView');
		learnjs.showView('#problem-42');
		expect(learnjs.problemView).toHaveBeenCalledWith('42')
	});
	it('triggers removingView event when removing the view', function() {
		spyOn(learnjs, 'triggerEvent');
		learnjs.showView('#problem-1');
		expect(learnjs.triggerEvent).toHaveBeenCalledWith('removingView', []);
	});
	it('invokes the router when loaded', function() {
		spyOn(learnjs, 'showView');
		learnjs.appOnReady();
		expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash);
	});
	it('subscribes to the hash change event', function() {
		learnjs.appOnReady();
		spyOn(learnjs, 'showView');
		$(window).trigger('hashchange');
		expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash);
	});
	it('can flash an element while setting the text', function() {
		var elem = $('<p>');
		spyOn(elem, 'fadeOut').and.callThrough();
		spyOn(elem, 'fadeIn');
		learnjs.flashElement(elem, "new text");
		expect(elem.text()).toEqual("new text");
		expect(elem.fadeOut).toHaveBeenCalled();
		expect(elem.fadeIn).toHaveBeenCalled();
	});
	it('can redirect to the main view after the last problem is answered', function() {
		var flash = learnjs.buildCorrectFlash(2);
		expect(flash.find('a').attr('href')).toEqual("");
		expect(flash.find('a').text()).toEqual("You're Finished!");
	});
	it('can trigger events on the view', function() {
		callback = jasmine.createSpy('callback');
		var div = $('<div>').bind('fooEvent', callback);
		$('.view-container').append(div);
		learnjs.triggerEvent('fooEvent', ['bar']);
		expect(callback).toHaveBeenCalled();
		expect(callback.calls.argsFor(0)[1]).toEqual('bar');
	});

	describe('profile view', function() {
		var view;
		beforeEach(function() {
			view = learnjs.profileView();
		});

		it('shows no email when the user is not logged in yet', function() {
			expect(view.find('.email').text()).toEqual("");
		});
		it('shows the users email address when they log in', function() {
			learnjs.identity.resolve({
				email: 'foo@bar.com'
			});
			expect(view.find('.email').text()).toEqual("foo@bar.com");
		});
	});

	describe('googleSignIn callback', function() {
		var user, fakeCreds;

		beforeEach(function() {
			profile = jasmine.createSpyObj('profile', ['getEmail']);
			fakeCreds = jasmine.createSpyObj('creds', ['refresh']);
			fakeCreds.refresh.and.callFake(function(c) { c() });
			fakeCreds.identity = "COGNITO_ID"
			spyOn(AWS, 'CognitoIdentityCredentials').and.returnValue(fakeCreds);
			user = jasmine.createSpyObj('user', ['getAuthResponse', 'getBasicProfile']);
			user.getAuthResponse.and.returnValue({id_token: 'GOOGLE_ID'});
			user.getBasicProfile.and.returnValue(profile);
			profile.getEmail.and.returnValue('foo@bar.com');
			googleSignIn(user);
		});

		it('sets the AWS region', function() {
			expect(AWS.config.region).toEqual('us-east-1');
		});
		it('sets the identity pool ID and Google ID token', function() {
			expect(AWS.CognitoIdentityCredentials).toHaveBeenCalledWith({
				IdentityPoolId: learnjs.poolId,
				Logins: {
					'accounts.google.com': 'GOOGLE_ID'
				}
			});
		});
	});
	
	describe('problem view', function() {
		var view;

		beforeEach(function() {
			view = learnjs.problemView(1);
		});

		it('has a title that includes the problem number', function() {
			expect(view.find('.title').text().trim()).toEqual('Problem #1');
		});
		it('shows the description', function() {
			expect(view.find('[data-name="description"]').text()).toEqual('What is truth?');
		});
		it('shows the problem code', function() {
			expect(view.find('[data-name="code"]').text()).toEqual('function problem() { return __; }');
		});
	});

	describe('skip button', function() {
		var view;

		beforeEach(function() {
			view = learnjs.problemView(1);
		});

		it('is added to the navbar when the view is added', function() {
			expect($('.nav-list .skip-btn').length).toEqual(1);
		});
		it('is removed from the navbar when the view is removed', function() {
			view.trigger('removingView');
			expect($('.nav-list .skip-btn').length).toEqual(0);
		});
		it('contains a link to the next problem', function() {
			expect($('.nav-list .skip-btn a').attr('href')).toEqual('#problem-2');
		});
		if('does not added when at the last problem', function() {
			view.trigger('removingView');
			view = learnjs.problemView('2');
			expect($('.nav-list .skip-btn').length).toEqual(0);
		});
	})

	describe('answer section', function() {
		var resultFlash;
		var view;

		beforeEach(function() {
			spyOn(learnjs, 'flashElement');
			view = learnjs.problemView(1);
			resultFlash = view.find('.result');
		});

		describe('when the answer is correct', function() {
			beforeEach(function() {
				view.find('.answer').val('true');
				view.find('.check-btn').click();
			});

			it('flashes the result', function() {
				var flashArgs = learnjs.flashElement.calls.argsFor(0);
				expect(flashArgs[0]).toEqual(resultFlash);
				expect(flashArgs[1].find('span').text()).toEqual('Correct!');
			});
			it('shows a link to the next problem', function() {
				var link = learnjs.flashElement.calls.argsFor(0)[1].find('a');
				expect(link.text()).toEqual('Next Problem');
				expect(link.attr('href')).toEqual('#problem-2');
			});
		});
		
		it('rejects an incorrenct answer', function() {
			view.find('.answer').val('false');
			view.find('.check-btn').click();
			expect(learnjs.flashElement).toHaveBeenCalledWith(resultFlash, 'Incorrect!')
		});
	});
});
