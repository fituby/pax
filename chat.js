function reload_chat_msgs() {
    prev_val = $('#pax-user-selector option:selected').text();
    if (prev_val && !prev_val.startsWith("All players"))
        prev_val = prev_val.split(" ")[2];
    $('#pax-user-selector').remove();
    $('.mchat__messages a.user-link').parent().removeClass('none');
    let users = {};
    $('.mchat__messages a.user-link').each(function(i, o){
        if (o.text in users)
            users[o.text]++;
        else
            users[o.text] = 1;
    });
    let data = [];
    $.each(users, function(user, num){
        data.push(`<option>${num} &mdash; ${user}</option>`);
    });
    data.sort(function (a, b) {
        return a.split(" ")[2].toLowerCase().localeCompare(b.split(" ")[2].toLowerCase());
    });
    const user_sel = `
        <select id="pax-user-selector">
            <option>All players &mdash; ${data.length}</option>
            ${data.join("")}
        </select>`;
    $(user_sel).insertBefore(".mchat__content");
    $('#pax-user-selector').change(function() {
        const user_data = $('option:selected', this).text();
        $('.mchat__messages a.user-link').parent().removeClass('none');
        if (!user_data.startsWith("All players")) {
            const user = user_data.split(" ")[2];
            $(`.mchat__messages a.user-link`).each(function(i, o) {
                if ($(this).text() !== user)
                    $(this).parent().addClass('none');
            });
        }
    });
    if (prev_val && (prev_val in users)) {
        $(`#pax-user-selector option:contains(" ${prev_val}")`).first().prop('selected', true);
        $('#pax-user-selector').change();
    }
}

var is_chat_initialized = false;
const config = { attributes: false, childList: true, subtree: true };
const chat_callback = (mutationList, observer) => {
    for (const mutation of mutationList) {
        if (mutation.type === "childList") {
            for (const node of mutation.addedNodes) {
                if (node.nodeName.toLowerCase() === 'li') {
                    reload_chat_msgs();
                    return;
                }
                if (!is_chat_initialized && node.nodeName.toLowerCase() === 'section') {
                    if ($('.mchat__messages').length) {
                        is_chat_initialized = true;
                        reload_chat_msgs();
                    }
                    return;
                }
            }
        }
    }
};
const chat_observer = new MutationObserver(chat_callback);
chat_observer.observe(document, config);
