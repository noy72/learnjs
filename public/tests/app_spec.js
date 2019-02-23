describe('LearnJS', function() {
	it('can show a probelm view', function() {
		learnjs.showView('#problem-1');
		expect($('.view-container .problem-view').length).toEqual(1);
	});
});
