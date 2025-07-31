var modlog_items = {};

const boost_types = ["Sandbagging", "Throwing", "Failure", "Boosting"];
const comm_types = ["Offensive", "Accusations", "Inappropriate", "Spam", "Team", "Advertisements", "Chat/Forum"];

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
    if (sup) {
        $.each(msgs, function (key, val) {
            msg_list.push(`${val} ${key.slice(txt_start)}<br>`);
        });
    }
    else {
        let report_type = $('#inquiry .report h3 strong').first().text() || "";
        if (report_type) {
            if (report_type != "Boost" && report_type != "Comm" && report_type != "Cheat") {
                if (["Print", "Other", "Username"].includes(report_type)) {
                    report_type = "";
                }
                else {
                    const a1 = $('#inquiry .report h3 a:not(.user-link)').first().attr('href');
                    if (a1 && a1.endsWith("/communication"))
                        report_type = "Comm";
                }
            }
        }
        else if ($(location).attr('href').includes("/communication")) {
            report_type = "Comm";
        }
        $.each(msgs, function (key, val) {
            const txt = key.slice(txt_start);
            let highlight_style = "";
            if (report_type && txt && ['warning', 'action'].includes(type)) {
                const txt_type = txt.split(" ")[0];
                if (report_type == "Boost") {
                    if (type == 'warning') {
                        if (boost_types.includes(txt_type))
                            highlight_style = "background: var(--m-bad_bg--mix-30);";
                        else if (txt_type == "possible")
                            highlight_style = "background: var(--m-bad_bg--mix-15);";
                    }
                }
                else if (report_type == "Cheat") {
                    if (type == 'action' && txt_type == "game")
                        highlight_style = "background: var(--m-bad_bg--mix-30);";
                }
                else if (report_type == "Comm") {
                    if (type == 'warning' && comm_types.includes(txt_type))
                        highlight_style = "background: var(--m-bad_bg--mix-30);";
                    else if (type == 'action' && ["chat", "delete", "kid"].includes(txt_type))
                        highlight_style = "background: var(--m-primary_bg--mix-30);";
                    else if (type == 'action' && txt_type == "shadowban")
                        highlight_style = "background: var(--m-bad_bg--mix-30);";
                }
            }
            msg_list.push(`<span style="display: flex; align-items: baseline; ${highlight_style}">
                             <h2 style="padding-right: 5px;">${val}</h2>
                             ${txt}
                           </span>`);
        });
    }
    if (!msg_list.length)
        return "";
    const header = (sup == "old") ? `<h3>${name} ${sup.toUpperCase()}:</h3>` : `<h2>${name}<sup>${sup}</sup></h2>`;
    return `<span style="padding: 0 20px 0 0;">
                ${header}
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

const timeline_actions = [
    'mod-timeline__event__action--sentence',
    //'mod-timeline__event__action--undo',
    //'mod-timeline__event__action--account-sentence:not(.mod-timeline__event__action--sentence)'
];

const recent_event = '.mod-timeline__event--recent';

function get_age(obj) {
    age = obj.is(recent_event) || obj.closest('.mod-timeline__event').is(recent_event) ? "new" : "old";
    if (!(age in modlog_items))
        modlog_items[age] = {};
    return age;
}

function add_modlog_info() {
    if ($('#pax-modlog-info').length)
        return;
    modlog_items = {};
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
    'pax-init':      {name: "Init",
                      sel: '.mod-timeline__event--account-creation, .mod-timeline__event__action--reopenAccount, .mod-timeline__event__action--selfCloseAccount'}
};

function modlog_btn_clicked(btn_id) {
    const btn = $(`#${btn_id}`);
    if (!btn.length)
        return;

    if (btn.is('.pax-active'))
        btn.removeClass('pax-active').addClass('pax-inactive');
    else
        btn.removeClass('pax-inactive').addClass('pax-active');

    const d = modlog_btns[btn.attr('id')];
    $(d.sel).each(function(i, o) {
        const element = $(this).is('.mod-timeline__event') ? $(this) : $(this).closest('.mod-timeline__event');
        if (btn.is('.pax-active'))
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
        if (btn.is('.pax-active'))
            num_active++;
        else
            num_inactive++;
    });
    $.each(modlog_btns, function (btn_id, d) {
        const btn = $(`#${btn_id}`);
        if (num_active >= num_inactive && btn.is('.pax-active'))
            btn.trigger("click");
        else if (num_active < num_inactive && !btn.is('.pax-active'))
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
            btns.push(`<button id="${btn_id}" class="btn-rack__btn pax-inactive">${d.name}: ${num}</button>`);
            btn_ids.push(btn_id);
        }
    });
    const total = $('.mod-timeline__event').length;
    btns.push(`<button id="pax-total" class="btn-rack__btn">Total: ${total}</button>`);
    const pax_buttons = `<div id="pax-modlog-btns" class="btn-rack" style="border: 0;">${btns.join("")}</div>`;
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

function disable_name_close() {
    $('#pax-name-close').prop('disabled', true);
}

function disable_kid_msg() {
    $('#pax-kid-msg').prop('disabled', true);
}

function add_modlog_actions() {
    if ($('.pm-preset-warn').length)
        return;

    // Send PM + Warn
    $('.pm-preset').clone(true).addClass('pm-preset-warn').insertAfter('.pm-preset');
    $('.pm-preset-warn option').remove();
    $('<option value="">Warn</option>').appendTo('.pm-preset-warn select');
    $('.pm-preset:not(.pm-preset-warn) option:contains("Warning")').appendTo('.pm-preset-warn select');

    // Name+Close
    const close_name = `<button id="pax-name-close" class="btn-rack__btn" style="border: 0; margin: 1px;" title='Alt+Close this account + add note \"name\"'>Name+Alt</button>`;
    const add_action_btns = `<div id="pax-add-actions" class="btn-rack">${close_name}</div>`;
    $(add_action_btns).insertBefore('.pm-preset:not(.pm-preset-warn)');
    const btn_alt = $('.btn-rack__btn:not(#pax-name-close):not(.active):contains("Alt")');
    const btn_close = $('.btn-rack__btn:not(#pax-name-close):not(.active):contains("Close")');
    if (btn_alt.length != 1 || btn_close.length != 1) {
        disable_name_close();
    }
    else {
        $('#pax-name-close').click(function() {
            const note_form = $('.note-form');
            if (note_form.length != 1)
                return;
            const note_action = $('.note-form').attr('action');
            if (!note_action)
                return;
            const btn_alt = $('.btn-rack__btn:not(#pax-name-close):not(.active):contains("Alt")');
            const btn_close = $('.btn-rack__btn:not(#pax-name-close):not(.active):contains("Close")');
            if (btn_alt.length != 1 || btn_close.length != 1)
                return;
            const alt_action = btn_alt.parent().attr('action');
            if (!alt_action)
                return;
            $.post(alt_action, function() {
                disable_name_close();
                $.post(note_action, data = {text: "name", noteType: "mod"}, function() {
                    location.reload();
                });
            });
        });
        btn_alt.on("click keyup", disable_name_close);
        btn_close.on("click keyup", disable_name_close);
    }

    // Kid+Msg
    let num_btn_kid = 0;
    $('.btn-rack__btn:not(.active):contains("Kid")').each(function(i, o) {
        if ($(this).text() == "Kid") {
            $(this).removeClass('yes-no-confirm');
            num_btn_kid++;
        }
    });
    const kid_msg = `<button id="pax-kid-msg" class="btn-rack__btn" style="border: 0; margin: 1px;" title='Kid mode + Mod message'>Kid+Msg</button>`;
    $(kid_msg).appendTo('#pax-add-actions');
    if (num_btn_kid != 1) {
        disable_kid_msg();
    }
    else {
        $('#pax-kid-msg').click(function() {
            const note_form = $('.note-form');
            if (note_form.length != 1)
                return;
            const note_action = $('.note-form').attr('action');
            if (!note_action)
                return;
            const btn_kid = $('.btn-rack__btn:not(.active)').filter(function(i) {
                return $(this).text() == "Kid";
            });
            if (btn_kid.length != 1)
                return;
            const kid_action = btn_kid.parent().attr('action');
            if (!kid_action)
                return;
            const msg_kid = $('.pm-preset:not(.pm-preset-warn) option:contains("kid mode")');
            if (msg_kid.length != 1)
                return;
            const val_msg_kid = msg_kid.attr('value');
            if (!val_msg_kid)
                return;
            const msg_action = $('.pm-preset:not(.pm-preset-warn)').attr('action');
            if (!msg_action)
                return;
            const ok = confirm('Kid mode + Mod message?');
            if (!ok)
                return;
            $.post(kid_action, function() {
                disable_kid_msg();
                $.post(`${msg_action}${val_msg_kid}`, function() {
                    location.reload();
                });
            });
        });
        $('.btn-rack__btn:not(.active)').filter(function(i) {
            return $(this).text() == "Kid";
        }).on("click keyup", disable_kid_msg);
    }
}
