(function() {
	can.Model('Models.GameModel', {}, {
		init : function() {
			this.initRanking();
			this.initMessages();
		},
		
		initRanking : function() {
			var players = this.attr('players');
			var ranking = [];
			$.each(players, function(index, player) {
				ranking.push({
					id: player.attr('id'),
					name: player.attr('name'),
					position: index + 1,
					score: 0
				});
			});
			this.attr('ranking', ranking);
		},
		
		initMessages : function() {
			this.attr('messages', [{
				from : '小明',
				content : '我们是害虫'
			},{
				from : '小明',
				content : '我们是害虫'
			},{
				from : '小明',
				content : '我们是害虫'
			},{
				from : '小明',
				content : '我们是害虫'
			},{
				from : '小明',
				content : '我们是害虫'
			},{
				from : '小明',
				content : '我们是害虫'
			},{
				from : '小明',
				content : '我们是害虫'
			},{
				from : '小明',
				content : '我们是害虫'
			},{
				from : '小明',
				content : '我们是害虫'
			},{
				from : '小明',
				content : '我们是害虫'
			},{
				from : '小明',
				content : '我们是害虫'
			},{
				from : '小明',
				content : '我们是害虫'
			},{
				from : '小明',
				content : '我们是害虫'
			}]);
		}
	});
})();