(() => { // own scope, so names here cannot clash with other content scripts

$('#inquiry .dropper > div').css('max-height', "85vh");
$('#inquiry .dropper.counter').css('justify-content', "center").css("display", "flex");
$('#inquiry .dropper.counter > div').css('width', "fit-content").css("min-width", "40vw").css("max-width", "85vw").css('right', "unset");

$('#inquiry .notes form.note button[value="dox"]').css('background', "var(--c-accent)");
$('#inquiry .notes form.note button[value="copy-url"]').css('background', "var(--c-font-dim)");
$('#inquiry .notes form.note button').css('text-align', "center");

$('#inquiry .links .view-games > div').css('overflow', "auto");
$('#inquiry .dropper > div').css('overflow', "auto");

$('#inquiry .docs.reports .expendable').css('width', "fit-content").css('max-height', "85vh");
$('#inquiry .docs.reports .expendable .doc.report .atom').css('max-width', "70vw");

const action_sections = ['engine', 'booster', 'shadowban', 'alt'];
for (const section of action_sections) {
    $(`#inquiry .actions .dropper.${section} .separator`).hide();
    $(`#inquiry .actions .dropper.${section} form > button.fbt`).filter(function(i) {
        return $(this).text().includes("Then open profile");
    }).parent().hide();
}
// Show "And stay on this report" only while "Automatically open next report" is checked.
// Lichess renders that checkbox as checked and then restores the user's saved setting with its
// own script, which may run after this one and doesn't fire a "change" event. So besides
// "change", the buttons are also updated whenever one of the action menus is opened.
function update_stay_buttons() {
    const auto_next = $('#auto-next');
    if (!auto_next.length)
        return;
    const checked = auto_next.prop('checked');
    for (const section of action_sections) {
        $(`#inquiry .actions .dropper.${section} form > button.fbt`).filter(function (i) {
            return $(this).text().includes("And stay on this report");
        }).parent().toggle(checked);
    }
}
$('#auto-next').on('change', update_stay_buttons);
$('#inquiry .actions .dropper').on('mouseenter focusin', update_stay_buttons);
update_stay_buttons();

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

})();
