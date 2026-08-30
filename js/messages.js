(() => {
    "use strict";

    const SUPABASE_URL = "https://qsymxqsigmilfbmmnlqi.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzeW14cXNpZ21pbGZibW1ubHFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTI4NjQsImV4cCI6MjA4NjQ4ODg2NH0.BGruTJ0vu7Y4pWpCaGmqKxYX5g6lFxA9Q8upPEIU-iI";
    const REFRESH_INTERVAL = 30000;
    const MESSAGES_ENDPOINT = `${SUPABASE_URL}/rest/v1/guests?select=full_name,message,responded_at&message=not.is.null&order=responded_at.desc`;

    const messagesCount = document.getElementById("messages-count");
    const messagesList = document.getElementById("messages-list");
    const loadingState = document.getElementById("loading-state");
    const errorState = document.getElementById("error-state");
    const emptyState = document.getElementById("empty-state");
    const refreshButton = document.getElementById("refresh-button");
    const retryButton = document.getElementById("retry-button");

    async function fetchMessages() {
        const response = await fetch(MESSAGES_ENDPOINT, {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !Array.isArray(payload)) {
            throw new Error("تعذر تحميل الرسائل من Supabase.");
        }

        return payload;
    }

    function setLoading(isLoading) {
        refreshButton.disabled = isLoading;
        refreshButton.textContent = isLoading ? "جارٍ التحديث..." : "تحديث";
        loadingState.hidden = !isLoading || messagesList.childElementCount > 0;
        if (isLoading) {
            errorState.hidden = true;
            emptyState.hidden = true;
        }
    }

    function formatDate(value) {
        if (!value) {
            return "";
        }

        return new Intl.DateTimeFormat("ar-EG", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }).format(new Date(value));
    }

    function renderMessages(guests) {
        const messages = guests
            .filter((guest) => typeof guest.message === "string" && guest.message.trim())
            .sort((first, second) => new Date(second.responded_at || 0) - new Date(first.responded_at || 0));

        messagesList.replaceChildren();
        messagesCount.textContent = messages.length === 1
            ? "وصلت رسالة واحدة"
            : `وصلت ${messages.length.toLocaleString("ar-EG")} رسالة`;
        emptyState.hidden = messages.length !== 0;

        const fragment = document.createDocumentFragment();

        messages.forEach((guest) => {
            const card = document.createElement("article");
            card.className = "message-card";

            const message = document.createElement("p");
            message.className = "message-text";
            message.textContent = guest.message.trim();

            const meta = document.createElement("footer");
            meta.className = "message-meta";

            const name = document.createElement("p");
            name.className = "message-name";
            name.textContent = guest.full_name || "ضيف";

            const date = document.createElement("time");
            date.className = "message-date";
            date.dateTime = guest.responded_at || "";
            date.textContent = formatDate(guest.responded_at);

            meta.append(name, date);
            card.append(message, meta);
            fragment.append(card);
        });

        messagesList.append(fragment);
    }

    async function loadMessages() {
        setLoading(true);

        try {
            renderMessages(await fetchMessages());
        } catch {
            errorState.hidden = false;
        } finally {
            setLoading(false);
        }
    }

    refreshButton.addEventListener("click", loadMessages);
    retryButton.addEventListener("click", loadMessages);

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            loadMessages();
        }
    });

    window.setInterval(loadMessages, REFRESH_INTERVAL);
    loadMessages();
})();
