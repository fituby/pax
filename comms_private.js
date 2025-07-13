const team_msg = "You received this because you are subscribed to messages of the team https://lichess.org/team/";
//const team_msg_old = "You received this message because you are part of the team lichess.org/team/"

const num_team_msgs_author = $(`.post.author:contains(${team_msg})`).length;
const num_team_msgs_others = $(`.post:not(.author):contains(${team_msg})`).length;
const num_chat_msgs = $('.chat .line').length;
const num_chat_msgs_author = $('.chat .line.author').length;
const num_priv_msgs = $('.post').length;
const num_priv_msgs_author = $('.post.author').length;
const buttons_style = 'style="background: var(--c-secondary); color: #fff; border-bottom-width: 0; border-top-width: 0; text-shadow: 0 1px 1px #000 !important;"';
let btns_chat = [];
if (num_chat_msgs) {
    const text_msgs = `Others' msgs: ${num_chat_msgs - num_chat_msgs_author} of ${num_chat_msgs}`;
    btns_chat.push(`<button id="pax-only-author-msgs" class="btn-rack__btn" ${buttons_style}>${text_msgs}</button>`);
}
btns_chat.push(`<button id="pax-scrollbars-chat" class="btn-rack__btn" ${buttons_style}>Scrollbars</button>`);
let btns_priv = [];
if (num_priv_msgs) {
    const text_msgs = `Others' msgs: ${num_priv_msgs - num_priv_msgs_author} of ${num_priv_msgs}`;
    btns_priv.push(`<button id="pax-only-author-posts" class="btn-rack__btn" ${buttons_style}>${text_msgs}</button>`);
}
if (num_team_msgs_author + num_team_msgs_others) {
    const text_msgs = `Team msgs: ${num_team_msgs_author}+${num_team_msgs_others}`;
    btns_priv.push(`<button id="pax-team-msgs" class="btn-rack__btn" ${buttons_style}>${text_msgs}</button>`);
}
btns_priv.push(`<button id="pax-scrollbars-priv" class="btn-rack__btn" ${buttons_style}>Scrollbars</button>`);

const comms_buttons = `<div>
	<div class="btn-rack">
	    <span>Chats:</span>
	    ${btns_chat.join("")}
	</div>
	<div class="btn-rack">
		<span>Inbox:</span>
	    ${btns_priv.join("")}
	</div>
</div>`;

function scrollbars_priv() {
	if ($('#pax-scrollbars-priv').is('.active')) {
		$('#pax-scrollbars-priv').removeClass('active').css("background", "var(--c-secondary)");
		$(".thread").css("max-height", "300px");
	}
	else {
		$('#pax-scrollbars-priv').addClass('active').css("background", "var(--c-accent)");
		$(".thread").css("max-height", "none");
	}
}

function scrollbars_chat() {
	if ($('#pax-scrollbars-chat').is('.active')) {
		$('#pax-scrollbars-chat').removeClass('active').css("background", "var(--c-secondary)");
		$(".chat").css("height", "15em");
	}
	else {
		$('#pax-scrollbars-chat').addClass('active').css("background", "var(--c-accent)");
		$(".chat").css("height", "auto");
	}
}

function hide_team_msgs() {
	if ($('#pax-team-msgs').is('.active')) {
		$('#pax-team-msgs').removeClass('active').css("background", "var(--c-secondary)");
		$(`.post:contains(${team_msg})`).removeClass('none');
		if ($('#pax-only-author-posts').is('.active'))
			$('.post:not(.author)').addClass('none');
	}
	else {
		$('#pax-team-msgs').addClass('active').css("background", "var(--c-accent)");
		$(`.post:contains(${team_msg})`).addClass('none');
	}
}

function show_only_author_posts() {
	if ($('#pax-only-author-posts').is('.active')) {
		$('#pax-only-author-posts').removeClass('active').css("background", "var(--c-secondary)");
		$('.post:not(.author)').removeClass('none');
		if ($('#pax-team-msgs').is('.active'))
			$(`.post:contains(${team_msg})`).addClass('none');
	}
	else {
		$('#pax-only-author-posts').addClass('active').css("background", "var(--c-accent)");
		$('.post:not(.author)').addClass('none');
	}
}

function show_only_author_msgs() {
	if ($('#pax-only-author-msgs').is('.active')) {
		$('#pax-only-author-msgs').removeClass('active').css("background", "var(--c-secondary)");
		$('.chat .line:not(.author)').removeClass('none');
	}
	else {
		$('#pax-only-author-msgs').addClass('active').css("background", "var(--c-accent)");
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
if (num_team_msgs_others || num_team_msgs_author)
	hide_team_msgs();

if (!$('#pax-modlog-info').length) {
    add_modlog_info();
    add_modlog_buttons();
}

if (CSS.highlights)
    CSS.highlights.clear();
