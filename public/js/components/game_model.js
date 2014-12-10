(function() {
	can.Model('Models.GameModel', {}, {
		init : function() {
			this.initStatus();
			this.initRanking();
			this.initMessages();
		},

		initStatus : function() {
			if (!(this.attr('status'))) {
				this.attr('status', 'waiting');
			}
		},

		initRanking : function() {
			var players = this.attr('players');
			var ranking = [];
			$.each(players, function(index, player) {
				ranking.push({
					id : player.attr('id'),
					name : player.attr('name'),
					position : index + 1,
					score : 0
				});
			});
			this.attr('ranking', ranking);
		},

		initMessages : function() {
			this.attr('messages', [ {
				from : '小明',
				content : '我们是害虫'
			}, {
				from : '张三',
				content : '快点啊，我等你等到花儿也谢了。'
			}, {
				from : '李四',
				content : '我是七星瓢虫'
			}, {
				from : '小明',
				content : '你们的水平太差了，我后悔跟你们一起玩了。'
			}, {
				from : '小明',
				content : '我们是害虫'
			}, {
				from : '小明',
				content : '我们是害虫'
			}, {
				from : '小明',
				content : '我们是害虫'
			}, {
				from : '小明',
				content : '我们是害虫'
			}, {
				from : '小明',
				content : '我们是害虫'
			}, {
				from : '小明',
				content : '我们是害虫'
			}, {
				from : '小明',
				content : '我们是害虫'
			}, {
				from : '小明',
				content : '我们是害虫'
			}, {
				from : '小明',
				content : '我们是害虫'
			} ]);
		},
		
		start : function() {
			this.attr('status', 'ongoing');
		}
	});
})();