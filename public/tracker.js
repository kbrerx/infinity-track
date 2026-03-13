(function() {
    // 1. Detección de Parámetros de Atribución
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');
    const utm_source = urlParams.get('utm_source');
    const utm_medium = urlParams.get('utm_medium');
    const utm_campaign = urlParams.get('utm_campaign');
    const utm_content = urlParams.get('utm_content');
    const utm_term = urlParams.get('utm_term');

    // 2. Gestión de Identidad (Cookies Propias 1st Party)
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    function setCookie(name, value, days = 90) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
    }

    // Visitor ID (SCK para Hotmart)
    let visitorId = getCookie('_it_visitor');
    if (!visitorId) {
        visitorId = 'it_' + Math.random().toString(36).substr(2, 9) + Date.now();
        setCookie('_it_visitor', visitorId);
    }

    // FBC (Facebook Click Id)
    let fbc = getCookie('_fbc');
    if (fbclid) {
        fbc = `fb.1.${Date.now()}.${fbclid}`;
        setCookie('_fbc', fbc);
    }

    // FBP (Facebook Browser Id)
    let fbp = getCookie('_fbp');
    if (!fbp) {
        fbp = `fb.1.${Date.now()}.${Math.floor(Math.random() * 1000000000)}`;
        setCookie('_fbp', fbp);
    }

    // 3. Captura del Evento PageView
    const eventData = {
        event_type: 'PageView',
        visitor_id: visitorId,
        url: window.location.href,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        fbc: fbc,
        fbp: fbp,
        utm_source: utm_source,
        utm_medium: utm_medium,
        utm_campaign: utm_campaign,
        utm_content: utm_content,
        utm_term: utm_term,
        // Extracción de Campaign/Ad ID si están en el UTM (Pattern standard)
        campaign_id: urlParams.get('campaign_id') || urlParams.get('utm_id'),
        adset_id: urlParams.get('adset_id'),
        ad_id: urlParams.get('ad_id'),
        pixel_id: window._it_pixel_id // El usuario debe definir esto en el snippet
    };

    // 4. Envío al Servidor (InfinityTrack Backend)
    fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
        keepalive: true
    }).catch(err => console.error('IT Tracking Error:', err));

    // 5. Autocompletar SCK en enlaces de Hotmart (Opcional pero recomendado)
    document.addEventListener('mousedown', function(e) {
        const link = e.target.closest('a');
        if (link && (link.href.includes('hotmart.com') || link.href.includes('pay.hotmart.com'))) {
            const url = new URL(link.href);
            url.searchParams.set('sck', visitorId);
            link.href = url.toString();
        }
    });

})();
