// Note buttons
$('.note-zone form.note-form .mod-note button[value="dox"]').css('background', "var(--c-accent)");
$('.note-zone form.note-form .mod-note button[value="normal"]').css('background', "var(--c-font-dim)");
$('.note-zone form.note-form .mod-note button').css('text-align', "center");

function init_modlog() {
    if (!$('#pax-modlog-info').length) {
        add_modlog_info();
        add_modlog_buttons();
        add_modlog_actions();
        update_others();
    }
}

const config_modlog = { attributes: false, childList: true, subtree: false };
const callback_mod_zone = (mutationList, observer) => {
    let is_timeline = false;
    let is_actions = false;
    let is_others = false;
    for (const mutation of mutationList) {
        if (mutation.type === "childList") {
            for (const node of mutation.addedNodes) {
                if (!is_timeline && node.id == "mz_timeline") {
                    is_timeline = true;
                    setTimeout(() => { init_modlog(); });
                }
                if (!is_actions && node.id == "mz_actions") {
                    is_actions = true;
                    setTimeout(() => { add_modlog_actions(); });
                }
                if (!is_others && node.id == "mz_others") {
                    is_others = true;
                    setTimeout(() => { update_others(); });
                }
            }
        }
    }
};
const observer_modlog = new MutationObserver(callback_mod_zone);
$('.mod-zone').each(function(i, o) {
    observer_modlog.observe(o, config_modlog);
    if (!$(this).is('.none')) {
        setTimeout(() => { init_modlog(); }, 500);
        setTimeout(() => { init_modlog(); }, 2000);
    }
});
