(function(){
	var options = {
		container: 'table table:eq(1)',
		filter: 'tr',
		trigger: 'table table:eq(1) tr:last a'
	},
	$trigger;
	$(options.container).depagify(options.trigger, {
		container: options.container,
		filter: options.filter,
		threshold: options.trigger,
		effect: function() {
			$(this).fadeIn('slow');
		},
		events: {
			request: function() {
				$trigger = $(options.trigger);
				$trigger.html("<i class='icon-refresh'></i> Loading");
			},
			success: function() {
				var $parent = $trigger.parent().parent();
				$parent.prev().remove();
				$parent.remove();
			}
		}
	});
})();
