var csrftoken = getCookie('csrftoken');

$( "#information_dialog" ).dialog({
	width: $(window).width()*0.9,
	modal: true,
	autoOpen: true,
	resizable: false,
	buttons: {
		"OK": function() {
		$( this ).dialog( "close" );
			request = $.post("/weave/group_sheet_confirm/",{'csrfmiddlewaretoken' : csrftoken});
		}
	}
});