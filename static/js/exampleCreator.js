$('#example_name').on('input', function() {
    if ($("#example_name").val() == ""){
    	$('#create_example_button').prop('disabled', true);
    }
    else {
    	$('#create_example_button').prop('disabled', false);
    }
});
