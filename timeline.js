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
        update_identification();
    }
}

const config_modlog = { attributes: false, childList: true, subtree: false };
const callback_mod_zone = (mutationList, observer) => {
    let is_updated = {};
    for (const mutation of mutationList) {
        if (mutation.type === "childList") {
            for (const node of mutation.addedNodes) {
                if (is_updated[node.id])
                    continue;
                is_updated[node.id] = true;
                if (node.id == "mz_timeline")
                    setTimeout(() => { init_modlog(); });
                else if (node.id == "mz_actions")
                    setTimeout(() => { add_modlog_actions(); });
                else if (node.id == "mz_others")
                    setTimeout(() => { update_others(); });
                else if (node.id == 'mz_identification')
                    setTimeout(() => { update_identification(); });
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
