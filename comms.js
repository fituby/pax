const team_msg = "You received this because you are subscribed to messages of the team https://lichess.org/team/";
//const team_msg_old = "You received this message because you are part of the team lichess.org/team/"

const num_team_msgs_author = $(`.post.author:contains(${team_msg})`).length;
const num_team_msgs_others = $(`.post:not(.author):contains(${team_msg})`).length;
const num_chat_msgs = $('.chat .line').length;
const num_chat_msgs_author = $('.chat .line.author').length;
const num_priv_msgs = $('.post').length;
const num_priv_msgs_author = $('.post.author').length;
let btns_chat = [];
if (num_chat_msgs - num_chat_msgs_author) {
    const text_msgs = `Others' msgs: ${num_chat_msgs - num_chat_msgs_author} of ${num_chat_msgs}`;
    btns_chat.push(`<button id="pax-only-author-msgs" class="btn-rack__btn pax-inactive">${text_msgs}</button>`);
}
btns_chat.push(`<button id="pax-scrollbars-chat" class="btn-rack__btn pax-inactive">Scrollbars</button>`);
let btns_priv = [];
if (num_priv_msgs - num_priv_msgs_author) {
    const text_msgs = `Others' msgs: ${num_priv_msgs - num_priv_msgs_author} of ${num_priv_msgs}`;
    btns_priv.push(`<button id="pax-only-author-posts" class="btn-rack__btn pax-inactive">${text_msgs}</button>`);
}
if (num_team_msgs_author + num_team_msgs_others) {
    const text_msgs = `Team msgs: ${num_team_msgs_author}+${num_team_msgs_others}`;
    btns_priv.push(`<button id="pax-team-msgs" class="btn-rack__btn pax-inactive">${text_msgs}</button>`);
}
btns_priv.push(`<button id="pax-scrollbars-priv" class="btn-rack__btn pax-inactive">Scrollbars</button>`);

const comms_buttons = `<div>
	<div class="btn-rack" style="margin-right: 10px;">
	    <span>Chats:</span>
	    ${btns_chat.join("")}
	</div>
	<div class="btn-rack">
		<span>Inbox:</span>
	    ${btns_priv.join("")}
	</div>
</div>`;

function scrollbars_priv() {
	if ($('#pax-scrollbars-priv').is('.pax-active')) {
		$('#pax-scrollbars-priv').removeClass('pax-active').addClass('pax-inactive');
		$(".thread").css("max-height", "300px");
	}
	else {
		$('#pax-scrollbars-priv').removeClass('pax-inactive').addClass('pax-active');
		$(".thread").css("max-height", "none");
	}
}

function scrollbars_chat() {
	if ($('#pax-scrollbars-chat').is('.pax-active')) {
		$('#pax-scrollbars-chat').removeClass('pax-active').addClass('pax-inactive');
		$(".chat").css("height", "15em");
	}
	else {
		$('#pax-scrollbars-chat').removeClass('pax-inactive').addClass('pax-active');
		$(".chat").css("height", "auto");
	}
}

function hide_team_msgs() {
	if ($('#pax-team-msgs').is('.pax-active')) {
		$('#pax-team-msgs').removeClass('pax-active').addClass('pax-inactive');
		$(`.post:contains(${team_msg})`).removeClass('none');
		if ($('#pax-only-author-posts').is('.pax-active'))
			$('.post:not(.author)').addClass('none');
	}
	else {
		$('#pax-team-msgs').removeClass('pax-inactive').addClass('pax-active');
		$(`.post:contains(${team_msg})`).addClass('none');
	}
}

function show_only_author_posts() {
	if ($('#pax-only-author-posts').is('.pax-active')) {
		$('#pax-only-author-posts').removeClass('pax-active').addClass('pax-inactive');
		$('.post:not(.author)').removeClass('none');
		if ($('#pax-team-msgs').is('.pax-active'))
			$(`.post:contains(${team_msg})`).addClass('none');
	}
	else {
		$('#pax-only-author-posts').removeClass('pax-inactive').addClass('pax-active');
		$('.post:not(.author)').addClass('none');
	}
}

function show_only_author_msgs() {
	if ($('#pax-only-author-msgs').is('.pax-active')) {
		$('#pax-only-author-msgs').removeClass('pax-active').addClass('pax-inactive');
		$('.chat .line:not(.author)').removeClass('none');
	}
	else {
		$('#pax-only-author-msgs').removeClass('pax-inactive').addClass('pax-active');
		$('.chat .line:not(.author)').addClass('none');
	}
}

$(comms_buttons).insertAfter('.mod-timeline');
$('#pax-scrollbars-priv').click(scrollbars_priv);
$('#pax-scrollbars-chat').click(scrollbars_chat);
$('#pax-team-msgs').click(hide_team_msgs);
$('#pax-only-author-posts').click(show_only_author_posts);
$('#pax-only-author-msgs').click(show_only_author_msgs);
scrollbars_priv();
let max_len_chat = 0;
$('.game').each(function(i, o) {
    let len = $(this).find('.line').length;
    if(len > max_len_chat)
        max_len_chat = len;
});
if (max_len_chat < 40)
    scrollbars_chat();
if (num_team_msgs_others || num_team_msgs_author)
    hide_team_msgs();

if (!$('#pax-modlog-info').length) {
    add_modlog_info();
    add_modlog_buttons();
}
