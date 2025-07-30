$('#inquiry .dropper > div').css('max-height', "85vh");
$('#inquiry .dropper.counter').css('justify-content', "center").css("display", "flex");
$('#inquiry .dropper.counter > div').css('width', "fit-content").css("min-width", "40vw").css("max-width", "85vw").css('right', "unset");

$('#inquiry .notes form.note button[value="dox"]').css('background', "var(--c-accent)");
$('#inquiry .notes form.note button[value="copy-url"]').css('background', "var(--c-font-dim)");
$('#inquiry .notes form.note button').css('text-align', "center");

$('#inquiry .links .view-games > div').css('overflow', "auto");
$('#inquiry .dropper > div').css('overflow', "auto");

$('#inquiry .docs.reports .expendable').css('width', "fit-content").css('max-height', "85vh");
$('#inquiry .docs.reports .expendable .doc.report .atom').css('width', "70vw");

for (const section of ['engine', 'booster', 'shadowban', 'alt']) {
    $(`#inquiry .actions .dropper.${section} .separator`).hide();
    $(`#inquiry .actions .dropper.${section} form > button.fbt`).filter(function(i){
        return $(this).text().includes("And stay on this report");}
    ).parent().hide();
    $(`#inquiry .actions .dropper.${section} form > button.fbt`).filter(function(i){
        return $(this).text().includes("Then open profile");}
    ).parent().hide();
}

const observer_counter = new ResizeObserver(entries => {
    for (const entry of entries){
        if (entry.contentRect.width) {
            const offset = $(entry.target).offset();
            if (offset.left < 0)
                $(entry.target).offset({ left: 0 });
        }
    }
});
$('#inquiry .dropper.counter > div').each(function(i, o) {
    observer_counter.observe(o);
});
