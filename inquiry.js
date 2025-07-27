$('#inquiry .dropper > div').css('max-height', "85vw");
$('#inquiry form > button.fbt').filter(function(i){
    return $(this).text().includes("And stay on this report");}
).parent().hide();
$('#inquiry form > button.fbt').filter(function(i){
    return $(this).text().includes("Then open profile");}
).parent().hide();