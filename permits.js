const permits = {
    'Admin':    {regex: /\b(Super Admin|Admin|Lila settings|Process title requests)\b/g,
                 color: "var(--c-interesting)"},
    'Mod':      {regex: /\b(Cheat Hunter|Boost Hunter|Shusher|View player insights)\b/g,
                 color: "var(--c-bad)"},
    'Modding':  {regex: /\b(Timeout mod|Moderate \w+|Give free patron|Send mod messages|See reports|Mod notes|View blurs|User profile mod view)\b/g,
                 color: "var(--c-warn)"},
    'Manager':  {regex: /\b(Manage \w+)\b/g,
                 color: "var(--c-brag)"},
    'Team':     {regex: /\b(Chat timeout|Lichess team)\b/g,
                 color: "var(--c-brilliant)"},
    'Official': {regex: /\b(Study\/Broadcast admin|Broadcast official|Feed updates|Lichess pages)\b/g,
                 color: "var(--c-good)"},
    'Settings': {regex: /\b(GDPR erase account|Set email address|Email answerer|Close\/reopen account)\b/g,
                 color: "var(--c-accent)"}
};

$('#mod_table .slist td a:not(.user-link)').each(function(i, o) {
    let text = $(this).text();
    $.each(permits, function (name, d) {
        text = text.replaceAll(d.regex, `<span style="color: ${d.color};">$1</span>`);
    });
    $(this).html(text);
});

function permits_btn_clicked(btn_id) {
    const btn = $(`#${btn_id}`);
    if (!btn.length)
        return;

    if (btn.is('.pax-active'))
        btn.removeClass('pax-active').addClass('pax-inactive');
    else
        btn.removeClass('pax-inactive').addClass('pax-active');

    $('#mod_table .slist td a:not(.user-link)').each(function(i, o) {
        let other = $(this).text().replaceAll(/<span [^<>]+>([^<>]+)<\/span>/g, "$1");
        let is_text = false;
        $.each(permits, function (name, d) {
            if ($(`#pax-permits-${name}`).is('.pax-inactive'))
                if (other.search(d.regex) >= 0)
                    is_text = true;
            other = other.replaceAll(d.regex, "");
        });
        other = other.replaceAll(/[\s,]/g, "");
        if (is_text)
            $(this).closest('tr').show();
        else if (other && $('#pax-permits-other').is('.pax-inactive'))
            $(this).closest('tr').show();
        else
            $(this).closest('tr').hide();
    });
}

function permits_total_clicked() {
    let num_active = 0;
    let num_inactive = 0;
    if ($('#pax-permits-other').is('.pax-active'))
        num_active++;
    else
        num_inactive++;
    $.each(permits, function (name, d) {
        const btn = $(`#pax-permits-${name}`);
        if (!btn.length)
            return;
        if (btn.is('.pax-active'))
            num_active++;
        else
            num_inactive++;
    });
    $.each(permits, function (name, d) {
        const btn = $(`#pax-permits-${name}`);
        if (num_active >= num_inactive && btn.is('.pax-active'))
            btn.trigger("click");
        else if (num_active < num_inactive && !btn.is('.pax-active'))
            btn.trigger("click");
    });
    const btn = $('#pax-permits-other');
    if (num_active >= num_inactive && btn.is('.pax-active'))
        btn.trigger("click");
    else if (num_active < num_inactive && !btn.is('.pax-active'))
        btn.trigger("click");
}

let permits_btns = [];
let num = {other: 0};
$('#mod_table .slist td a:not(.user-link)').each(function(i, o) {
    let other = $(this).text().replaceAll(/<span [^<>]+>([^<>]+)<\/span>/g, "$1");
    $.each(permits, function (name, d) {
        if (other.search(d.regex) >= 0)
            num[name] = (num[name] || 0) + 1;
        other = other.replaceAll(d.regex, "");
    });
    if (other.replaceAll(/[\s,]/g, ""))
        num['other']++;
});
$.each(permits, function (name, d) {
    const n = num[name] || 0;
    const title = d.regex.toString().replaceAll(/(\\b|\/g|\(|\)|^\/)/g, "").replaceAll("\\/", "/")
                                    .replaceAll(" \\w+", "..."). replaceAll("|", ", ");
    permits_btns.push(`<button id="pax-permits-${name}" class="btn-rack__btn pax-inactive"
                               title="${title}">
                           ${name}: ${n}
                       </button>`);
});
const num_total = $('#mod_table .slist td a:not(.user-link)').length;
const permits_buttons = `<div class="btn-rack" style="display: flex; margin-top: 10px; border: 0;">
    ${permits_btns.join("")}
    <button id="pax-permits-other" class="btn-rack__btn pax-inactive" title="Everything else">Other: ${num['other']}</button>
    <button id="pax-permits-total" class="btn-rack__btn">Total: ${num_total}</button>
</div>`;
$(permits_buttons).insertBefore('.slist');
$.each(permits, function (name, d) {
    const btn_id = `pax-permits-${name}`;
    $(`#${btn_id}`).click(() => { permits_btn_clicked(btn_id); });
});
$('#pax-permits-other').click(() => { permits_btn_clicked('pax-permits-other'); });
$('#pax-permits-total').click(permits_total_clicked);
