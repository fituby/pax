// Everything is wrapped in a function so that names declared here can't clash
// with other content scripts loaded on the same page (they share one global scope).
(() => {

const appeal_presets = new Set(["cheat", "boost", "close", "comm", "rank", "arena", "prize", "blog", "streamer", "warning", "legacy", "chat"]);

var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};
function escapeHtml (string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
        return entityMap[s];
    });
}

// Custom presets are stored (and exported) with group names, preset names and texts
// HTML-escaped by escapeHtml(). That format is kept so that files exported by any version
// of Pax keep working everywhere. This turns stored values back into plain text for display.
const entityNames = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'"};
function unescapeHtml(string) {
    return String(string).replace(/&(?:#(\d+)|#x([0-9a-f]+)|(amp|lt|gt|quot|apos));/gi, function (s, dec, hex, name) {
        if (name)
            return entityNames[name.toLowerCase()];
        const code = dec ? parseInt(dec, 10) : parseInt(hex, 16);
        return code <= 0x10FFFF ? String.fromCodePoint(code) : s;
    });
}

// Firefox provides the "browser" API, Chrome only "chrome". Both return promises.
const ext = globalThis.browser ?? globalThis.chrome;

function getData(key) {
    return ext.storage.local.get(key);
}

// Preset buttons and group headers remember their group and name exactly as stored (escaped),
// so they can be compared with the stored presets directly.
// The text is set with .text()/.attr(), so it is never interpreted as HTML.
function make_preset_button(group, name, text) {
    return $('<button type="button" class="pax-preset">')
        .attr('title', unescapeHtml(text))
        .text(unescapeHtml(name))
        .data({group: group, name: name});
}

function group_buttons(group) {
    return $('#appeal-presets button.pax-preset').filter(function() {
        return $(this).data('group') === group;
    });
}

function group_header(group) {
    return $('#appeal-presets .pax-preset-group').filter(function() {
        return $(this).data('group') === group;
    });
}

function create_group(group, buttons) {
    const header = $('<b class="pax-preset-group">')
        .css('color', "var(--c-primary)")
        .text(`${unescapeHtml(group)}:`)
        .data('group', group);
    $('#appeal-presets').append(header, buttons);
}

function preset_clicked() {
    const text_to_add = this.title;
    if (text_to_add) {
        let curr_text = $('.form-group > textarea#form3-text').val().trimEnd();
        if (curr_text.includes(text_to_add))
            return;
        if (curr_text.length)
            curr_text += "\n\n";
        $('.form-group > textarea#form3-text').val(curr_text + text_to_add);
    }
}

function txtToBase64(txt) {
    const bytes = new TextEncoder().encode(txt);
    const binString = Array.from(bytes, (byte) =>
        String.fromCodePoint(byte),
    ).join("");
    return btoa(binString);
}

function update_export(custom_presets) {
    $('#pax-export-presets').attr('href', `data:application/json;base64,${txtToBase64(JSON.stringify(custom_presets))}`);
}

// Loads a page and parses it into a separate, inert document:
// unlike $(html), this doesn't start downloading its images or other resources.
async function fetch_page(url) {
    const response = await fetch(url);
    if (!response.ok)
        throw new Error(`Failed to load ${url}: ${response.status}`);
    const html = await response.text();
    return $(new DOMParser().parseFromString(html, 'text/html'));
}

async function fetch_user(url) {
    const page = await fetch_page(url);
    let note_zone = page.find('.note-zone');
    if (note_zone.length == 1 && note_zone.find('.note').length) {
        note_zone.addClass('pax-note-zone').attr('id', "pax-note-list");
        if ($('#pax-table-appeals').length > 0)
            note_zone.insertAfter('#pax-table-appeals');
        else
            note_zone.insertBefore('.mod-zone-full');
        $('.note').not('#inquiry .note').addClass('pax-note');
        add_note_buttons(true);
        $('.note-zone form').hide();
    }
}

async function fetch_table_appeals(url) {
    if (!url.length)
        return;
    const page = await fetch_page(url);
    let table_appeals = page.find('.appeal-list');
    if (table_appeals.length == 1) {
        $('<h2 id="pax-appeal-msgs-header">All appeals</h2>').insertBefore('.mod-zone-full');
        table_appeals.attr('id', "pax-table-appeals").insertAfter('#pax-appeal-msgs-header');
    }
}

function reports_btn_clicked(report_type) {
    const btn = $(`#pax-reports-${report_type}`);
    if (!btn.length)
        return;

    if (btn.is('.pax-active'))
        btn.removeClass('pax-active').addClass('pax-inactive');
    else
        btn.removeClass('pax-inactive').addClass('pax-active');

    const reports = $('#pax-report-list .report h3 strong').filter(function() {
        return report_type == $(this).text();
    }).closest('.report');
    if (btn.is('.pax-active'))
        reports.hide();
    else
        reports.show();
}

function reports_total_clicked() {
    let num_active = 0;
    let num_inactive = 0;
    $('.pax-report-btn').each(function (i, o) {
        if ($(this).is('.pax-active'))
            num_active++;
        else
            num_inactive++;
    });
    $('.pax-report-btn').each(function (i, o) {
        if (num_active >= num_inactive && $(this).is('.pax-active'))
            $(this).trigger("click");
        else if (num_active < num_inactive && !$(this).is('.pax-active'))
            $(this).trigger("click");
    });
}

// Mod zone
move_modzone_elements();
const config_mz_full = { childList: true, subtree: false };
const callback_mz_full = (mutationList, observer) => {
    for (const mutation of mutationList) {
        if (mutation.type === "childList") {
            for (const node of mutation.addedNodes) {
                if (!['mz_others', 'mz_identification', 'mz_timeline',
                      'pax-load-more', 'pax-note-list', 'pax-report-list'].includes(node.id))
                    $(node).remove();
                else if (node.id == "mz_others")
                    setTimeout(() => { update_others(); });
                else if (node.id == 'mz_identification')
                    setTimeout(() => { update_identification(); });
                else if (node.id == 'mz_timeline') {
                    $('#pax-load-more').hide();
                    $('.mod-timeline').css('padding', "0 1em 0 2em");
                    add_modlog_buttons();
                    $.each(modlog_btns, function (btn_id, d) {
                        const btn = $(`#${btn_id}`);
                        if (btn.is('.pax-inactive'))
                            btn.trigger("click");
                    });
                }
            }
        }
    }
};
const observer_mz_full = new MutationObserver(callback_mz_full);
$('.mod-zone-full').first().each(function(i, o) {
    observer_mz_full.observe(o, config_mz_full);
});

// Add styles
$('.appeal__msg--mod').css('background', "color-mix(in oklab, var(--c-primary) 20%, var(--c-bg))");
const my_id = $('#user_tag').text().toLowerCase();
$('.appeal__msg--mod a.user-link').filter(function() {
    const href = $(this).attr('href');
    return href && href.toLowerCase().endsWith(`/${my_id}`);
}).closest('.appeal__msg--mod').css('background', "color-mix(in oklab, var(--c-secondary) 20%, var(--c-bg))");
$('.appeal__msg').css('padding', "1em 1em").css('margin-bottom', "1em");
$('.appeal__msg__header').css('margin-bottom', "1em");
$('p:contains("This appeal is now closed")').css('color', "var(--c-bad)").css('border', "2px solid var(--c-bad)");
$('p:contains("Appeal paused until")').css('color', "var(--c-brilliant)").css('border', "2px solid var(--c-brilliant)");
$("h3:contains('Declared accounts')").replaceWith(function() {
    return $("<h2>").append($(this).contents());
});

// All appeals
$('#pax-appeal-msgs-header').remove();
$('#pax-table-appeals').remove();
if ($('.appeal__all').length) {
    fetch_table_appeals($('.appeal__all').first().attr('href'))
        .catch(e => console.error("Pax:", e));
}

// Add reports
$('#pax-report-list').remove();
$('#pax-reports-bar').remove();
if ($('#inquiry .docs.reports .expendable .report strong').length) {
    $('#inquiry .docs.reports .expendable').first().clone().attr('id', "pax-report-list").insertBefore('.mod-zone-full');
    $('#pax-report-list .report').first().remove();
    $('#pax-report-list').css('margin-bottom', "2em").css('padding-bottom', "1em");
    let reports = {};
    $('#pax-report-list .report h3 strong').each(function(i, o) {
        const t = $(this).text();
        reports[t] = reports[t] ? reports[t] + 1 : 1;
    });
    let total = $('#pax-report-list .report h3 strong').length;
    let report_btns = [];
    $.each(reports, function (name, num) {
        report_btns.push(`<button id="pax-reports-${name}" class="btn-rack__btn pax-active pax-report-btn">${name}: ${num}</button>`);
    });
    const report_buttons = `<div id="pax-reports-bar" style="display: flex; margin-top: 10px;">
        <h2 style="padding-right: 1em; align-self: end;">Reports</h2>
        <div class="btn-rack" style="border: 0;">
            ${report_btns.join("")}
            <button id="pax-reports-total" class="btn-rack__btn">Total: ${total}</button>
        </div>
    </div>`;
    $(report_buttons).insertBefore('#pax-report-list');
    if ($("#inquiry .score.green").length) {
        for (const style_name of ['background-color', 'display', 'white-space', 'font-weight', 'font-size', 'padding', 'border-radius']) {
            const style = $("#inquiry .score.green").first().css(style_name);
            $("#pax-report-list .score").css(style_name, style);
        }
    }
    $.each(reports, function (name, num) {
        $(`#pax-reports-${name}`).click(() => { reports_btn_clicked(`${name}`); });
    });
    $('#pax-reports-total').click(reports_total_clicked);
    $('#pax-report-list .report').hide();
}

// Add notes
if (location.pathname.includes('/appeal/'))
    fetch_user(location.pathname.replace(/\/appeal\/([^/]+).*/, '/@/$1'))
        .catch(e => console.error("Pax:", e));

// Appeal messages
$('#pax-curr-appeal-topic').remove();
var curr_topic_element = $('<h1 id="pax-curr-appeal-topic" class="box__top"><span class="title"></span></h1>');
curr_topic_element.css('margin-top', "1em");
curr_topic_element.insertBefore('.body');
var cloned_topic = $('.box__top .appeal-topic').first().clone();
var curr_topic = $('.box__top .appeal-topic').first().text();
curr_topic_element.find('.title').append(cloned_topic);
cloned_topic.after('Appeal');

var textarea = $('.form-group > textarea#form3-text');

// Presets
var custom_preset_options = {};

function add_custom_presets(group, data) {
    if ($.isEmptyObject(data))
        return;
    custom_preset_options[group] = [];
    let buttons = [];
    $.each(data, function (name, text) {
        custom_preset_options[group].push(unescapeHtml(name));
        if (!appeal_presets.has(group) || group == curr_topic)
            buttons.push(make_preset_button(group, name, text));
    });
    if (buttons.length)
        create_group(group, buttons);
    if (!(appeal_presets.has(group)))
        $('#pax-preset-group-list').append($('<option>').val(unescapeHtml(group)));
}

if (textarea.length && !$('.appeal-preset-custom').length) {
    const presets = $('.appeal-presets').attr("id", "appeal-presets").css({'max-height': 'none','overflow': 'visible'});
    presets.on('click', 'button.pax-preset', preset_clicked);

    // Custom presets form
    $('.submit').css('margin-top', "10px");
    $(`<fieldset id="custom-presets" class="toggle-box toggle-box--toggle toggle-box--ready toggle-box--toggle-off">
        <legend tabindex="0">Custom presets</legend>
        <table style="width: 100%;"><tbody>
            <tr>
                <td rowspan="3" style="padding: 0 10px 10px 0;">
                    <textarea id="pax-new-preset-text" rows="5" cols="50" style="width: 100%;" placeholder="Text of a new preset..."></textarea>
                </td>
                <td>
                    <input id="pax-new-preset-group" list="pax-preset-group-list" type="text" maxlength="20" style="width: 100%;" value="Custom" placeholder="Group name..."></input>
                    <datalist id="pax-preset-group-list"></datalist>
                </td>
            </tr>
            <tr><td>
                <input id="pax-new-preset-name" list="pax-preset-name-list" type="text" maxlength="50" placeholder="Preset name..." style="width:100%;"></input>
                <datalist id="pax-preset-name-list"></datalist>
            </td></tr>
            <tr><td>
                <button id="pax-save-preset" class="button button-thin" title="Save a custom preset" style="width:49%; margin-bottom: 10px;">Save</button>
                <button id="pax-delete-preset" class="button button-thin" title="Delete a custom preset defined by its group and name specified above" style="width:49%; margin-bottom: 10px;">Delete</button>
            </td></tr>
            <tr><td colspan="2">
                <a id="pax-export-presets" href='data:application/json;charset=utf-8,{}' download="custom_presets.json" class="button button-thin" title="Save all custom preset to a file" style="margin-bottom: 10px; margin-right: 10px;">Export all...</a>
                Import: <input id="pax-import-presets" type="file" accept=".json" style="margin-bottom: 10px;"/>
            </td></tr>
        </tbody></table>
    </fieldset>`).insertAfter('.appeal__actions');
    for (let group of appeal_presets) {
        custom_preset_options[group] = [];
        $('#pax-preset-group-list').append(`<option value="${group}">`);
    }
    $('#custom-presets legend').click(() => {
        if ($('#custom-presets').is('.toggle-box--toggle-off'))
            $('#custom-presets').removeClass('toggle-box--toggle-off');
        else
            $('#custom-presets').addClass('toggle-box--toggle-off');
    });
    $('#pax-new-preset-group').on('input', function() {
        const group = $(this).val().replace(/[^\w-]/g, '');
        $(this).val(group);
        $('#pax-preset-name-list').empty();
        if (group in custom_preset_options)
            $('#pax-preset-name-list').append(custom_preset_options[group].map(name => $('<option>').val(name)));
    });
    $('#pax-new-preset-group').on('click', function() {
        this.showPicker();
    });
    $('#pax-new-preset-name').on('click', function() {
        this.showPicker();
    });

    // Import custom presets
    $('#pax-import-presets:file').change(function() {
        const input = this;
        if (!input.value)
            return;
        const files = input.files;
        if (!files.length) {
            alert("Failed to read the file.")
            return;
        }
        getData('appeal_presets').then(function(saved_data) {
            const custom_presets = saved_data['appeal_presets'];
            const file_presets = files[0];
            var reader = new FileReader();
            reader.onload = function (e) {
                // Clear the input so that choosing the same file again triggers "change"
                input.value = "";
                let loaded_presets;
                try {
                    loaded_presets = JSON.parse(e.target.result);
                }
                catch (err) {
                    alert(`Failed to decode the file: ${err.message}`);
                    return;
                }
                // Expected format: {"group": {"preset name": "preset text", ...}, ...}
                const is_valid = $.isPlainObject(loaded_presets) && !$.isEmptyObject(loaded_presets) &&
                    Object.values(loaded_presets).every(data => $.isPlainObject(data) &&
                        Object.values(data).every(text => typeof text === 'string'));
                if (!is_valid) {
                    alert("Failed to decode the file: it doesn't contain custom presets.")
                    return;
                }
                if (!jQuery.isEmptyObject(custom_presets)) {
                    let num_curr_groups = 0;
                    let num_curr_names = 0;
                    $.each(custom_presets, function (group, data) {
                        num_curr_groups++;
                        $.each(data, function (name, text) {
                            num_curr_names++;
                        });
                    });
                    if (num_curr_names) {
                        let num_new_groups = 0;
                        let num_new_names = 0;
                        $.each(loaded_presets, function (group, data) {
                            num_new_groups++;
                            $.each(data, function (name, text) {
                                num_new_names++;
                            });
                        });
                        const ok = confirm(`The current custom presets will be deleted and replaced with those loaded from the file.\n\nExisting groups: ${num_curr_groups}\nExisting presets: ${num_curr_names}\nNew groups: ${num_new_groups}\nNew presets: ${num_new_names}\n\nContinue?`);
                        if (!ok)
                            return;
                    }
                }
                ext.storage.local.set({"appeal_presets": loaded_presets}).then(function() {
                    location.reload();
                });
            };
            reader.onerror = function () {
                input.value = "";
                alert("Failed to read the file.");
            };
            reader.readAsText(file_presets);
        });
    });

    // Custom presets
    getData('appeal_presets').then(function(saved_data) {
        const custom_presets = saved_data['appeal_presets'];
        if (!custom_presets)
            return;
        $.each(custom_presets, function (group, data) {
            if (appeal_presets.has(group.toLowerCase()))
                add_custom_presets(group.toLowerCase(), data);
        });
        $.each(custom_presets, function (group, data) {
            if (!appeal_presets.has(group.toLowerCase()))
                add_custom_presets(group, data);
        });
        update_export(custom_presets); // update export list
    });

    // Create a new preset
    $('#pax-save-preset').click(() => {
        let group = escapeHtml($('#pax-new-preset-group').val().trim());
        if (appeal_presets.has(group.toLowerCase()))
            group = group.toLowerCase();
        const name = escapeHtml($('#pax-new-preset-name').val().trim());
        const text = escapeHtml($('#pax-new-preset-text').val().trim());
        if (!group || !name || !text) {
            alert("To save a preset, please specify its group, name, and text.")
            return;
        }
        if (name == group) {
            alert(`The preset name must be different from its group name "${group}".`)
            return;
        }
        if (group == "Presets") {
            alert('A preset group cannot be named "Presets".')
            return;
        }
        getData('appeal_presets').then(function(saved_data) {
            let new_presets = saved_data['appeal_presets'] || {};
            if (!(group in new_presets))
                new_presets[group] = {};
            new_presets[group][name] = text;
            ext.storage.local.set({"appeal_presets": new_presets});
            const buttons = group_buttons(group);
            const existing = buttons.filter(function() {
                return $(this).data('name') === name;
            });
            if (existing.length)
                existing.attr('title', unescapeHtml(text));
            else if (buttons.length)
                make_preset_button(group, name, text).insertAfter(buttons.last());
            else
                create_group(group, [make_preset_button(group, name, text)]);
            if (!(group in custom_preset_options))
                custom_preset_options[group] = [];
            if (!custom_preset_options[group].includes(unescapeHtml(name)))
                custom_preset_options[group].push(unescapeHtml(name));
            $('#pax-new-preset-name').val("");
            $('#pax-new-preset-text').val("");
            update_export(new_presets);
        });
    });

    // Delete an existing preset
    $('#pax-delete-preset').click(() => {
        const group = escapeHtml($('#pax-new-preset-group').val().trim());
        const name = escapeHtml($('#pax-new-preset-name').val().trim());
        if (!group || !name) {
            alert("To delete a preset, please first specify its group and name.")
            return;
        }
        if (name == group) {
            alert(`The preset name must be different from its group name "${group}".`)
            return;
        }
        if (group == "Presets") {
            alert('A preset group cannot be named "Presets".')
            return;
        }
        getData('appeal_presets').then(function(saved_data) {
            let curr_presets = saved_data['appeal_presets'];
            if (!curr_presets)
                return;
            if (!(group in curr_presets)) {
                alert(`The group "${group}" does not exist`);
                return;
            }
            if (!(name in curr_presets[group])) {
                alert(`In the group "${group}", there's no preset named "${unescapeHtml(name)}"`);
                return;
            }
            delete curr_presets[group][name];
            if ($.isEmptyObject(curr_presets[group]))
                delete curr_presets[group];
            ext.storage.local.set({"appeal_presets": curr_presets});
            group_buttons(group).filter(function() {
                return $(this).data('name') === name;
            }).remove();
            if (!group_buttons(group).length)
                group_header(group).remove();
            if (group in custom_preset_options)
                custom_preset_options[group] = custom_preset_options[group].filter(n => n !== unescapeHtml(name));
            $('#pax-new-preset-name').val("");
            update_export(curr_presets);
        });
    });
}

})();
