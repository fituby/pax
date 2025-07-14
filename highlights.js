function remove_highlights() {
    if (CSS.highlights) {
        setTimeout(() => {
            CSS.highlights.clear();
        });
    }
}

setTimeout(() => { remove_highlights(); }, 500);
setTimeout(() => { remove_highlights(); }, 2000);

const config_comms = { childList: true, subtree: true };
const chat_callback = (mutationList, observer) => {
    remove_highlights();
};
const chat_observer = new MutationObserver(chat_callback);
chat_observer.observe(document, config_comms);
