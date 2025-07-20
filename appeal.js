const appeal_presets = {
    Cheat: ["Engine ", "Cheat ", ": cheat"],
    Boost: ["Booster ", "Arena ban ", "Boost ", ": boost"],
    Shadowban: ["Shadowban "],
    Alt: [" alt", "IP ban", "admission"],
    Playban_Ragesit: ["Playban ", "ragesit"],
    Blog: ["Blogs "]
};
var def_presets = {};

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

function getData(obj) {
    var deferred = $.Deferred();
    browser.storage.local.get(obj, function(result) {
       deferred.resolve(result);
    });
    return deferred.promise();
}

function create_group(group, options) {
    $('#appeal-presets').parent().append(`
        <select class="appeal-presets appeal-presets-${group}" style="width: 10em; margin-top: 10px;">
            <option>${group}</option>
            ${options.join("")}
        </select>`
    );
    $(`.appeal-presets-${group}`).change(function() {
        const text_to_add = $('option:selected', this).attr('title');
        if (text_to_add) {
            let curr_text = $('textarea#form3-text').val().trimEnd();
            if (curr_text.search(text_to_add) >= 0)
                return;
            if (curr_text.length)
                curr_text += "\n\n";
            $('textarea#form3-text').val(curr_text + text_to_add);
        }
    });
}

function base64ToTxt(base64) {
    const binString = atob(base64);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
    return new TextDecoder().decode(bytes);
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

var custom_preset_options = {};
if ($('textarea#form3-text').length && !$('.appeal-preset-alt').length) {
    // Default presets
    const presets = $('.appeal-presets').attr("id", "appeal-presets");
    $(`.appeal-presets`).css('width', "10em");
    $.each(appeal_presets, function (group, sel) {
        presets.clone(true, true).removeAttr("id").addClass(`appeal-presets-${group}`).insertBefore("#appeal-presets");
        $(`.appeal-presets-${group} option:not(:contains("Presets"))`).remove();
        const s = sel.join('"),option:contains("');
        const el = $(`#appeal-presets option:contains("${s}")`);
        def_presets[group] = {};
        el.each(function(i, data) {
            def_presets[group][data.text] = data.title;
        });
        el.appendTo(`.appeal-presets-${group}`);
        $(`.appeal-presets-${group} option`).first().text(group);
    });

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
                Import: <input id="pax-import-presets" type="file" id="file-selector" accept=".json" style="margin-bottom: 10px;"/>
            </td></tr>
        </tbody></table>
    </fieldset>`).insertAfter('#appeal-actions');
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
            $('#pax-preset-name-list').append(custom_preset_options[group].join(""));
    });
    $('#pax-import-presets:file').change(function() {
        const file = $(this).val();
        if (!file)
            return;
        const files = $(this).get(0).files;
        if (!files.length) {
            alert("Failed to read the file.")
            return;
        }
        $.when(getData('appeal_presets')).then(function(saved_data) {
            const custom_presets = saved_data['appeal_presets'];
            const file_presets = files[0];
            var reader = new FileReader();
            reader.onload = function (e) {
                const decoded = base64ToTxt(e.target.result.split(',')[1]);
                const loaded_presets = JSON.parse(decoded);
                if ($.isEmptyObject(loaded_presets)) {
                    alert("Failed to decode the file.")
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
                browser.storage.local.set({"appeal_presets": loaded_presets}).then(function() {
                    location.reload();
                });
            };
            reader.readAsDataURL(file_presets);
        });
    });

    // Custom presets
    $.when(getData('appeal_presets')).then(function(saved_data) {
        const custom_presets = saved_data['appeal_presets'];
        if (!custom_presets)
            return;
        $.each(custom_presets, function (group, data) {
            if ($.isEmptyObject(data))
                return;
            custom_preset_options[group] = [];
            let options = [];
            if (group in appeal_presets) {
                $.each(data, function (name, text) {
                    custom_preset_options[group].push(`<option value="${name}">`);
                    options.push(`<option title="${text}" value="${text}">${name}</option>`);
                });
                $(`.appeal-presets-${group}`).append(options.join(""));
                return;
            }
            $.each(data, function (name, text) {
                custom_preset_options[group].push(`<option value="${name}">`);
                options.push(`<option title="${text}">${name}</option>`);
            });
            create_group(group, options);
            $('#pax-preset-group-list').append(`<option value="${group}">`);
        });
        $('#pax-new-preset-group').trigger("input");
        update_export(custom_presets);
    });

    // Create a new preset
    $('#pax-save-preset').click(() => {
        const group = escapeHtml($('#pax-new-preset-group').val().trim());
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
        if ((group in def_presets) && (name in def_presets[group])) {
            alert('To change a default preset, go to the appropriate page.')
            return;
        }
        $.when(getData('appeal_presets')).then(function(saved_data) {
            let new_presets = saved_data['appeal_presets'] || {};
            if (!(group in new_presets))
                new_presets[group] = {};
            if (!$(`.appeal-presets-${group}`).length) {
                create_group(group, []);
            }
            new_presets[group][name] = text;
            browser.storage.local.set({"appeal_presets": new_presets});
            let existing = $(`.appeal-presets-${group} option`).filter(function() {
                return $(this).val() === name;
            });
            if (existing.length) {
                if (group in appeal_presets)
                    existing.attr('title', text).attr('value', text);
                else
                    existing.attr('title', text);
            }
            else {
                if (group in appeal_presets)
                    $(`.appeal-presets-${group}`).append(`<option title="${text}" value="${text}">${name}</option>`);
                else
                    $(`.appeal-presets-${group}`).append(`<option title="${text}">${name}</option>`);
            }
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
        if ((group in def_presets) && (name in def_presets[group])) {
            alert('To delete a default preset, go to the appropriate page.')
            return;
        }
        $.when(getData('appeal_presets')).then(function(saved_data) {
            let curr_presets = saved_data['appeal_presets'];
            if (!curr_presets)
                return;
            if (!(group in curr_presets)) {
                alert(`The group "${group}" does not exist`);
                return;
            }
            if (!(name in curr_presets[group])) {
                alert(`In the group "${group}", there's no preset named "${name}"`);
                return;
            }
            delete curr_presets[group][name];
            browser.storage.local.set({"appeal_presets": curr_presets});
            $(`.appeal-presets-${group} option`).filter(function() {
                return $(this).text() === $('#pax-new-preset-name').val();
            }).remove();
            if (!(group in def_presets) && $(`.appeal-presets-${group} option`).length == 1)
                $(`.appeal-presets-${group}`).remove();
            $('#pax-new-preset-name').val("");
            update_export(curr_presets);
        });
    });
}
