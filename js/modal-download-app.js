document.addEventListener("DOMContentLoaded", function() {
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isMobile = isAndroid || isIOS;
  if (!isMobile) return;

  const overlayBanner = document.getElementById("overlay-teste");
  const topModalBanner = document.querySelector(".top-modal");
  const nowChoiceDate = localStorage.getItem('nowChoiceDate');
  const now = new Date();
  const twoMinutesInMs = 2 * 60 * 1000; // 2 minutos em milissegundos

  // Função para verificar e exibir o banner apropriado
  function checkAndDisplayBanner() {
    let accessCount = localStorage.getItem('accessCount') || 0;
    accessCount = parseInt(accessCount, 10) + 1;
    localStorage.setItem('accessCount', accessCount);

    if (nowChoiceDate && (now - new Date(nowChoiceDate)) < twoMinutesInMs) {
      overlayBanner.style.display = "none";
      topModalBanner.style.display = "none";
    } else {
      if (accessCount === 1) {
        overlayBanner.style.display = "flex";
        topModalBanner.style.display = "none";
        trackEvent("view_modal_download_app");
      } else {
        overlayBanner.style.display = "none";
        topModalBanner.style.display = "flex";
        trackEvent("view_modal_abrir_app");
      }
    }
  }

  // Função para rastrear eventos
  function trackEvent(eventName, action = null, label = null) {
    window.dataLayer = window.dataLayer || [];
    const event = { event: eventName };
    if (action) event.event_action = action;
    if (label) event.event_label = label;
    dataLayer.push(event);
  }

  // Função para configurar eventos de clique nos botões
  function setupButtonEvents() {
    const buttons = document.querySelectorAll("#openOrDownloadBtn");
    buttons.forEach(button => {
      button.addEventListener("click", () => {
        handleButtonClick(button);
      });
    });

    const nowButton = overlayBanner.querySelector(".btn-link");
    nowButton.addEventListener("click", () => {
      localStorage.setItem('nowChoiceDate', new Date().toISOString());
      overlayBanner.style.display = "none";
    });

    const closeButton = document.querySelector(".close-btn");
    closeButton.addEventListener("click", () => {
      topModalBanner.style.display = "none";
    });
  }

  // Função para lidar com o clique no botão
  function handleButtonClick(button) {
    const appScheme = "prudentialapp://open";
    const androidStore = "market://details?id=com.prudential.clienteprudential";
    const iosStore = "https://apps.apple.com/br/app/prudential-seguros/id6736710765";
    const ANDROID_DELAY = 1200;
    const IOS_DELAY = 2500;
    const GRACE_MS = 500;
    const start = Date.now();
    let iframe = null;
    let fallbackTimer = null;
    let opened = false;

    function cleanupListeners() {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    }

    function onVisibility() {
      if (document.hidden) {
        opened = true;
        cleanupListeners();
      }
    }

    function onPageHide() {
      opened = true;
      cleanupListeners();
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    if (isAndroid) {
      iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = appScheme;
      document.body.appendChild(iframe);
    } else if (isIOS) {
      window.location.assign(appScheme);
    }

    const delay = isIOS ? IOS_DELAY : ANDROID_DELAY;
    fallbackTimer = setTimeout(() => {
      const elapsed = Date.now() - start;
      if (!opened && elapsed < delay + GRACE_MS) {
        if (isIOS) {
          alert("Se o app estiver instalado, toque em 'Abrir' na App Store.");
        }
        try {
          if (isAndroid) {
            window.location.href = androidStore;
          } else {
            window.location.href = iosStore;
          }
        } catch (e) {
          if (isAndroid) {
            window.open("https://play.google.com/store/apps/details?id=com.prudential.clienteprudential", "_blank");
          } else {
            window.open(iosStore, "_blank");
          }
        }
      }
      cleanupListeners();
      if (iframe && iframe.parentNode) {
        try {
          iframe.parentNode.removeChild(iframe);
        } catch (e) {}
      }
    }, delay);

    if (button.closest("#overlay-teste")) {
      trackEvent("ev", "click", "Baixar APP Prudential");
    } else if (button.closest(".top-modal")) {
      trackEvent("ev", "click", "Abrir APP Prudential");
    }
  }

  // Inicialização
  checkAndDisplayBanner();
  setupButtonEvents();
});