var modlog_items = {};

function count_msgs(data, type, name, sup) {
    if (!data[type])
        return "";
	let msgs = {};
	for (const w of data[type]) {
        if (w in msgs)
            msgs[w]++;
        else
            msgs[w] = 1;
	}
	for (const msg of ["playbans", "appeal messages", "mod messages"]) {
        if (msg in msgs && msgs[msg] == 1) {
            delete msgs[msg];
            msgs[msg.slice(0, -1)] = 1;
        }
    }
	const txt_start = type == 'warning' ? 9 : 0;
	let msg_list = [];
	if (sup)
        $.each(msgs, function (key, val) {
            msg_list.push(`${val} ${key.slice(txt_start)}<br>`);
        });
    else
        $.each(msgs, function (key, val) {
            msg_list.push(`<span style="display: flex; align-items: baseline;"><h2 style="padding-right: 5px;">${val}</h2>${key.slice(txt_start)}</span>`);
        });
	if (!msg_list.length)
	    return "";
	return `<span style="padding: 0 20px 0 0">
	            <h2>${name}<sup>${sup}</sup></h2>
	            ${msg_list.join("")}
	        </span>`;
}

const timeline_types = {action: "Actions", warning: "Warnings", mod_msg: "Mod msgs"};

function add_timeline_info(age, data) {
    const sup = (age == 'new') ? "" : age;
    let items = [];
    $.each(timeline_types, function (type, name) {
        items.push(count_msgs(data, type, name, sup));
    });
	return items.join("");
}

const periods = ['Year', ''];
const timeline_actions = [
    'mod-timeline__event__action--sentence',
    //'mod-timeline__event__action--undo',
    //'mod-timeline__event__action--account-sentence:not(.mod-timeline__event__action--sentence)'
];

function get_age(obj) {
    const siblings = obj.closest('.mod-timeline__period').children('h3');
    let age = "?age";
    if (siblings.length) {
        const period = siblings.text();
        let is_old = period.includes('year');
        if (!is_old) {
            for (let i = 6; i <= 12; i++) {
                if (period.includes(`${i} months`)) {
                    is_old = true;
                    break;
                }
            }
        }
        age = is_old ? "old" : "new";
    }
    if (!(age in modlog_items))
        modlog_items[age] = {};
    return age;
}

function add_modlog_info() {
    for (const timeline_action of timeline_actions)
        $(`.mod-timeline__event--modlog .${timeline_action}`).each(function(i, o) {
            const age = get_age($(this));
            if (!('action' in modlog_items[age]))
                modlog_items[age]['action'] = [];
            modlog_items[age]['action'].push($(this).text());
        });

	$('.mod-timeline__event--modlog .mod-timeline__text:contains("Warning: ")').each(function(i, o) {
	    const age = get_age($(this));
		const texts = $(this).text().split(' / ');
		for (let w of texts) {
			if (w == "stalling on time")
				continue;
			const type = w.startsWith("Warning: ") ? 'warning' : 'mod_msg';
			if (!(type in modlog_items[age]))
				modlog_items[age][type] = [];
			modlog_items[age][type].push(w);
		}
	});

	$('.mod-timeline__event--modlog .mod-timeline__event__action--modMessage:not(.mod-timeline__event__action--warning)').each(function(i, o) {
	    const age = get_age($(this));
        if (!('mod_msg' in modlog_items[age]))
            modlog_items[age]['mod_msg'] = [];
        modlog_items[age]['mod_msg'].push("mod messages");
	});

	$('.mod-timeline__event--playban > .mod-timeline__event__body:contains("Playban")').each(function(i, o) {
        const num = parseInt($(this).text().split(" "));
        if (!num || num < 0 || num > 999)
            return;
	    const age = get_age($(this));
        if (!('action' in modlog_items[age]))
            modlog_items[age]['action'] = [];
        for (let i = 0; i < num; i++)
            modlog_items[age]['action'].push("playbans");
	});

	$('.mod-timeline__event__action--setKidMode, .mod-timeline__event__action--unsetKidMode').each(function(i, o) {
	    const age = get_age($(this));
	    if (!('action' in modlog_items[age]))
            modlog_items[age]['action'] = [];
        modlog_items[age]['action'].push("kid mode");
	});

	$('.mod-timeline__event--appeal > .mod-timeline__event__body > a.user-link > i.moderator').each(function(i, o) {
	    const age = get_age($(this));
	    if (!('mod_msg' in modlog_items[age]))
            modlog_items[age]['mod_msg'] = [];
        modlog_items[age]['mod_msg'].push("appeal messages");
	});

    let items = [];
	for (const age of ['new', '?age', 'old']) {
	    if (age in modlog_items)
	        items.push(add_timeline_info(age, modlog_items[age]));
	}
	const text = `<div id="pax-modlog-info" style="display: flex; align-items: top;">
                     ${items.join("")}
			     </div>`;
	$(text).insertBefore('.mod-timeline');
}

var modlog_btns = {
    'pax-reports':   {name: "Reports",
                      sel: '.mod-timeline__event--report-new'},
    'pax-appeals':   {name: "Appeal",
                      sel: '.mod-timeline__event--appeal'},
    'pax-playbans':  {name: "Playbans",
                      sel: '.mod-timeline__event--playban'},
    'pax-streamers': {name: "Streamer",
                      sel: '.mod-timeline__event__action--streamerList, .mod-timeline__event__action--streamerunlist, .mod-timeline__event__action--streamerTier'},
    'pax-blogs':     {name: "Blogs",
                      sel: '.mod-timeline__event__action--blogPostEdit, .mod-timeline__event__action--blogTier'},
    'pax-flaglines': {name: "Flag lines",
                      sel: '.mod-timeline__event--flagged-line'},
    'pax-notes':     {name: "Notes",
                      sel: '.mod-timeline__event--note'},
    'pax-perms':     {name: "Permissions",
                      sel: '.mod-timeline__event--modlog .mod-timeline__event__action--permissions'},
    'pax-actions':   {name: "Actions",
                      sel: '.mod-timeline__event__action--sentence:not(.mod-timeline__event__action--chatTimeout):not(.mod-timeline__event__action--deletePost), .mod-timeline__event__action--undo, .mod-timeline__event__action--setKidMode, .mod-timeline__event__action--unsetKidMode'},
    'pax-warnings':  {name: "Warnings",
                      sel: '.mod-timeline__event--modlog .mod-timeline__text:contains("Warning: ")'},
    'pax-forumposts':{name: "Forum posts",
                      sel: '.mod-timeline__event__action--deletePost'},
    'pax-timeouts':  {name: "Timeouts",
                      sel: '.mod-timeline__event__action--chatTimeout'},
    'pax-mod_msgs':  {name: "Mod msgs",
                      sel: '.mod-timeline__event--modlog .mod-timeline__event__action--modMessage:not(.mod-timeline__event__action--warning)'},
};

function modlog_btn_clicked(btn_id) {
    const btn = $(`#${btn_id}`);
    if (!btn)
        return;

    const d = modlog_btns[btn.attr('id')];
    if (btn.is('.active'))
        btn.removeClass('active').css("background", "var(--c-secondary)");
    else
        btn.addClass('active').css("background", "var(--c-accent)");

    $(d.sel).each(function(i, o) {
        const element = $(this).is('.mod-timeline__event') ? $(this) : $(this).closest('.mod-timeline__event');
        if (btn.is('.active'))
            element.addClass('none');
        else
            element.removeClass('none');
    });

    $('.mod-timeline__period').addClass('none');
    $('.mod-timeline__period .mod-timeline__event:not(.none)').each(function(i, o) {
        $(this).parents().eq(1).removeClass('none');
    });
}

function modlog_total_clicked() {
    let num_active = 0;
    let num_inactive = 0;
    $.each(modlog_btns, function (btn_id, d) {
        const btn = $(`#${btn_id}`);
        if (!btn.length)
            return;
        if (btn.is('.active'))
            num_active++;
        else
            num_inactive++;
    });
    $.each(modlog_btns, function (btn_id, d) {
        const btn = $(`#${btn_id}`);
        if (num_active >= num_inactive && btn.is('.active'))
            btn.trigger("click");
        else if (num_active < num_inactive && !btn.is('.active'))
            btn.trigger("click");
    });
}

function add_modlog_buttons() {
    if ($('#pax-modlog-btns').length)
        return;
    let btns = [];
    let btn_ids = [];
    $.each(modlog_btns, function (btn_id, d) {
        const num = $(d.sel).length;
        if (num) {
            btns.push(`<button id="${btn_id}" class="btn-rack__btn"
                style="background: var(--c-secondary); color: #fff; border-bottom-width: 0; border-top-width: 0; text-shadow: 0 1px 1px #000 !important;">
                ${d.name}: ${num}
            </button>`);
            btn_ids.push(btn_id);
        }
	});
	const total = $('.mod-timeline__event').length;
	btns.push(`<button id="pax-total" class="btn-rack__btn">Total: ${total}</button>`);
    const pax_buttons = `<div id="pax-modlog-btns" class="btn-rack">${btns.join("")}</div>`;
	$(pax_buttons).insertBefore('.mod-timeline');
    for (const btn_id of btn_ids) {
        $(`#${btn_id}`).click(() => { modlog_btn_clicked(btn_id); });
	};
	$('#pax-total').click(modlog_total_clicked);

	for (const btn_id of ['pax-appeals', 'pax-playbans', 'pax-blogs', 'pax-streamers'])
	    if ($(`#${btn_id}`).length)
	        modlog_btn_clicked(btn_id);
	for (const btn_id of ['pax-reports', 'pax-flaglines'])
	    if ($(`#${btn_id}`).length && !$(`${modlog_btns[btn_id].sel} .mod-timeline__report-form--open`).length)
	        modlog_btn_clicked(btn_id);
}

function split_presets() {
    if ($('.pm-preset-warn').length)
        return;
    $('.pm-preset').clone(true).addClass('pm-preset-warn').insertAfter('.pm-preset');
    $('.pm-preset-warn option').remove();
    $('<option value="">Warn</option>').appendTo('.pm-preset-warn select');
    $('.pm-preset:not(.pm-preset-warn) option:contains("Warning")').appendTo('.pm-preset-warn select');
    //$('option:not(:contains("Warning: "))+option:not(:contains("Send PM"))').remove();
    //$('.pm-preset:not(.pm-preset-msg) option:contains("Send PM")').text("Warn");
}

const config_modlog = { attributes: false, childList: true, subtree: false };
const mod_zone_callback = (mutationList, observer) => {
    modlog_items = {};
	for (const mutation of mutationList) {
		if (mutation.type === "childList") {
			for (const node of mutation.addedNodes) {
				if (node.id == "mz_timeline") {
					setTimeout(() => {
                        if (!$('#pax-modlog-info').length) {
                            add_modlog_info();
                            add_modlog_buttons();
                            split_presets();
                        }
					});
					return;
				}
			}
		}
	}
};
const observer_modlog = new MutationObserver(mod_zone_callback);
$('.mod-zone').each(function(i, o) {
    if ($(this).is('.none'))
        observer_modlog.observe(o, config_modlog);
    else {
        if (!$('#pax-modlog-info').length) {
            add_modlog_info();
            add_modlog_buttons();
            split_presets();
        }
    }
});
