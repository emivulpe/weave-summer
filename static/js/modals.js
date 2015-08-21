$('.modal').on('hidden.bs.modal', function () {
	$(this).removeData('bs.modal'); 
})

$(document).ready(function() {
	$(".modal-content").each(function(i) {
	    $(this).draggable({
	        handle: ".modal-header"  
	    });
	});

});

$('#question_modal').on('shown.bs.modal', function () {
	$('#question_text').css("width", "100%");	
})