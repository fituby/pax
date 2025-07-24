var note_btns = {
    'pax-notes-mod':  {name:  "Mod",
                       start: "/note/setDox/",
                       end:   "/true",
                       bkg:   "var(--m-primary_bg--mix-15)"},
    'pax-notes-dox':  {name:  "Dox",
                       start: "/note/setDox/",
                       end:   "/false",
                       bkg:   "var(--m-bad_bg--mix-15)"},
    'pax-notes-std':  {name:  "Regular",
                       start: "/note/delete/",
                       end:   "",
                       bkg:   ""},
    'pax-notes-mine': {name:  "Mine",
                       start: "",
                       end:   "",
                       bkg:   "var(--m-secondary_bg--mix-15)"}
}

function note_btn_clicked(btn_id) {
    const btn = $(`#${btn_id}`);
    if (!btn)
        return;

    if (btn.is('.pax-active'))
        btn.removeClass('pax-active').addClass('pax-inactive');
    else
        btn.removeClass('pax-inactive').addClass('pax-active');

    const d = note_btns[btn.attr('id')];
    $('.note form').each(function(i, o) {
        const attr = $(this).attr('action');
        if (!attr.startsWith(d.start) || !attr.endsWith(d.end))
            return;
        if (btn.is('.pax-active'))
            $(this).parent().addClass('none');
        else
            $(this).parent().removeClass('none');
    });
}

function note_mine_btn_clicked() {
    const btn = $('#pax-notes-mine');
    if (btn.is('.pax-active'))
        btn.removeClass('pax-active').addClass('pax-inactive');
    else
        btn.removeClass('pax-inactive').addClass('pax-active');
    const my_id = $('#user_tag').text().toLowerCase();
    $('.note .note__meta a.user-link').each(function(i, o) {
        const href = $(this).attr('href');
        if (!href)
            return;
        if (!href.toLowerCase().endsWith(`/${my_id}`))
            return;
        if (btn.is('.pax-active'))
            $(this).closest('.note').addClass('none');
        else
            $(this).closest('.note').removeClass('none');
    });
}

function note_total_clicked() {
    let num_active = 0;
    let num_inactive = 0;
    $.each(note_btns, function (btn_id, d) {
        const btn = $(`#${btn_id}`);
        if (!btn.length)
            return;
        if (btn.is('.pax-active'))
            num_active++;
        else
            num_inactive++;
    });
    $.each(note_btns, function (btn_id, d) {
        const btn = $(`#${btn_id}`);
        if (num_active >= num_inactive && btn.is('.pax-active'))
            btn.trigger("click");
        else if (num_active < num_inactive && !btn.is('.pax-active'))
            btn.trigger("click");
    });
}

function add_note_buttons() {
    $('.note').css('padding-left', "1em");
    let num = {};
    $.each(note_btns, function (btn_id, d) {
        num[btn_id] = 0;
    });
    // Count & highlight
    $('.note form').each(function(i, o) {
        const attr = $(this).attr('action');
        $.each(note_btns, function (btn_id, d) {
            if (btn_id == 'pax-notes-mine')
                return;
            if (!attr.startsWith(d.start) || !attr.endsWith(d.end))
                return;
            num[btn_id]++;
            if (d.bkg)
                $(o).closest('.note').css('background', d.bkg);
        });
    });
    const my_id = $('#user_tag').text().toLowerCase();
    $('.note .note__meta a.user-link').each(function(i, o) {
        const href = $(this).attr('href');
        if (!href)
            return;
        if (!href.toLowerCase().endsWith(`/${my_id}`))
            return;
        num['pax-notes-mine']++;
        const bkg = note_btns['pax-notes-mine'].bkg;
        if (bkg)
            $(this).closest('.note').css('background', bkg);
    });
    // Add buttons
    let btns = [];
    $.each(note_btns, function (btn_id, d) {
        if (num[btn_id]) {
            const name = `${d.name}: ${num[btn_id]}`;
            btns.push(`<button id="${btn_id}" class="btn-rack__btn pax-inactive">${name}</button>`);
        }
    });
    if (btns.length) {
        const total = num['pax-notes-mod'] + num['pax-notes-dox'] + num['pax-notes-std'];
        btns.push(`<button id="pax-notes-total" class="btn-rack__btn">Total: ${total}</button>`);
        const note_buttons = `<div class="btn-rack" style="margin-top: 10px;">${btns.join("")}</div>`;
        $(note_buttons).insertAfter('.note-form');
        $.each(note_btns, function (btn_id, d) {
            if (num[btn_id] && btn_id != 'pax-notes-mine')
                $(`#${btn_id}`).click(() => { note_btn_clicked(btn_id); });
        });
        $('#pax-notes-mine').click(note_mine_btn_clicked);
        $('#pax-notes-total').click(note_total_clicked);
    }
}

add_note_buttons();
